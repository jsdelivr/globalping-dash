import { readItems, readMe, readRolesMe, readUser, deleteUser } from '@directus/sdk';
import { defineStore } from 'pinia';
import { readSessionActiveId, useAccount } from '~/store/account';
import { useHardwareProbeAdoption } from '~/store/local-adoption';

interface AuthState {
	isLoggedIn: boolean;
	expiresAt: number;
	isAdmin: boolean;
	impersonation: {
		originalUser: User;
		github_username: string;
		impersonatedUser: User | null;
		accountId?: string;
	} | null;
	adminMode: boolean;
	user: User;
}

export const ADMIN_CONFIG_KEY = 'adminConfig';
type AdminConfig = { adminId: string; sessionId: string; adminMode: boolean; userId?: string; accountId?: string };
let signedOut = false;

const readAdminConfig = (storage: Storage): AdminConfig | null => {
	try {
		const value: Partial<AdminConfig> | null = JSON.parse(storage.getItem(ADMIN_CONFIG_KEY) ?? 'null');

		if (typeof value?.adminId === 'string' && typeof value.sessionId === 'string' && typeof value.adminMode === 'boolean') {
			const { adminId, sessionId, adminMode, userId, accountId } = value;
			return { adminId, sessionId, adminMode, userId: typeof userId === 'string' ? userId : undefined, accountId: typeof accountId === 'string' ? accountId : undefined };
		}
	} catch {
		// Treat invalid browser storage as an unset preference.
	}

	return null;
};

export const MEMBERSHIP_FIELDS = [ 'id', 'role', 'notification_preferences', { org: [ 'id', 'name', 'github_id', 'account', 'user_type', 'public_probes', 'default_role', 'website', 'description', 'banner' ] }] as const;

const toMembership = (membership: DirectusMembership): Membership => ({
	...membership,
	org: {
		...membership.org,
		account: membership.org.account[0] ?? '',
		adoption_token: null,
		extra_adoption_tokens: [],
	},
});

const withOrgAdoptionTokens = (memberships: Membership[], orgs: DirectusOrg[]) => memberships.map((membership) => {
	const org = orgs.find(({ id }) => id === membership.org.id);

	return {
		...membership,
		org: {
			...membership.org,
			adoption_token: org?.adoption_token ?? null,
			extra_adoption_tokens: org?.extra_adoption_tokens ?? [],
		},
	};
});

const toUser = (user: DirectusUser): User => ({ ...user, account: user.account[0] ?? '', memberships: user.memberships.map(toMembership) });

export const useAuth = defineStore('auth', {
	state: (): AuthState => ({
		isLoggedIn: false,
		expiresAt: 0,
		isAdmin: false,
		impersonation: null,
		adminMode: false,
		user: {
			id: '',
			first_name: '',
			last_name: '',
			email: '',
			external_identifier: '',
			github_username: '',
			user_type: 'member',
			appearance: null,
			public_probes: false,
			notification_preferences: null,
			adoption_token: '',
			default_prefix: '',
			last_page: '',
			date_created: '',
			account: '',
			default_account: null,
			selected_orgs: [],
			memberships: [],
		},
	}),
	actions: {
		getRedirectUrl () {
			const url = new URL(location.href);
			const redirect = url.searchParams.get('redirect') || '/';
			const view = url.searchParams.get('view');

			const redirectUrl = new URL(redirect, url.origin);

			if (view && !redirectUrl.searchParams.get('view')) {
				redirectUrl.searchParams.set('view', view);
			}

			if (redirectUrl.origin !== url.origin) {
				return url.origin;
			}

			return redirectUrl.toString();
		},
		impersonate (user: Pick<DirectusUser, 'id' | 'github_username'>) {
			if (user.github_username) {
				this.setAdminConfig(false, user.id);
			}
		},
		clearImpersonation () {
			this.setAdminConfig(false);
		},
		setAdminConfig (adminMode: boolean, userId?: string, accountId?: string) {
			const tab = readAdminConfig(sessionStorage);

			if (!this.isAdmin || !tab || tab.sessionId !== readAdminConfig(localStorage)?.sessionId) {
				return;
			}

			const config = JSON.stringify({ adminId: tab.adminId, sessionId: tab.sessionId, adminMode, userId, accountId });
			localStorage.setItem(ADMIN_CONFIG_KEY, config);
			sessionStorage.setItem(ADMIN_CONFIG_KEY, config);
			window.location.reload();
		},
		async applyAdminConfig () {
			const { $directus } = useNuxtApp();
			const originalUser = this.user;
			let shared = readAdminConfig(localStorage);

			if (shared?.adminId !== originalUser.id) {
				shared = { adminId: originalUser.id, sessionId: crypto.randomUUID(), adminMode: false };
				localStorage.setItem(ADMIN_CONFIG_KEY, JSON.stringify(shared));
			}

			const tab = readAdminConfig(sessionStorage);
			const config = tab?.adminId === shared.adminId && tab.sessionId === shared.sessionId ? tab : shared;
			let target: User | null = null;

			if (!config.adminMode && config.userId) {
				const user = await $directus.request(readUser(config.userId, { fields: [ '*', { memberships: MEMBERSHIP_FIELDS }] })).catch(console.error);
				const currentAdmin = this.user === this.impersonation?.impersonatedUser ? this.impersonation.originalUser : this.user;

				if (!this.isAdmin || currentAdmin.id !== originalUser.id) {
					return false;
				}

				target = user ? { ...toUser(user as DirectusUser), last_page: originalUser.last_page } : null;
			}

			if (signedOut || config.sessionId !== readAdminConfig(localStorage)?.sessionId) {
				this.finishLogout();
				return false;
			}

			this.adminMode = config.adminMode;

			this.impersonation = target?.github_username
				? { originalUser, github_username: target.github_username, impersonatedUser: target, accountId: config.accountId }
				: null;

			this.user = this.impersonation?.impersonatedUser ?? originalUser;
			sessionStorage.setItem(ADMIN_CONFIG_KEY, JSON.stringify(config));
			return true;
		},
		clearAdminConfig () {
			sessionStorage.removeItem(ADMIN_CONFIG_KEY);
		},
		async login () {
			const config = useRuntimeConfig();
			const redirect = this.getRedirectUrl();
			const directusRedirect = `https://dash.globalping.io/auth/callback?redirect=${encodeURIComponent(redirect.toString())}`;
			await navigateTo(`${config.public.directusUrl}/auth/login/github?redirect=${encodeURIComponent(directusRedirect)}`, { external: true });
		},
		async loginLocal () {
			const config = useRuntimeConfig();
			const redirect = this.getRedirectUrl();
			const directusRedirect = `/redirect?url=${encodeURIComponent(redirect)}`;

			await navigateTo(`${config.public.directusUrl}/admin/login?redirect=${encodeURIComponent(directusRedirect)}`, { external: true });
		},
		async logout () {
			const { $directus } = useNuxtApp();
			const sessionId = readAdminConfig(localStorage)?.sessionId;

			try {
				await $directus.logout();
			} catch (error) {
				const { response, errors } = (error ?? {}) as DashboardError;

				if (response?.status !== 401 && !(response?.status === 400 && errors?.[0]?.message?.includes('The refresh token is required'))) {
					throw error;
				}
			}

			if (sessionId === readAdminConfig(localStorage)?.sessionId) {
				localStorage.removeItem(ADMIN_CONFIG_KEY);
			}

			this.finishLogout();
		},
		finishLogout () {
			signedOut = true;
			this.clearAdminConfig();
			useHardwareProbeAdoption().reset();
			this.$reset();
			window.location.replace('/login');
		},
		async refresh () {
			const { $directus } = useNuxtApp();

			try {
				const { expires_at } = await $directus.refresh();
				const [ user, roles, adminOrgs, sessionActiveId ] = await Promise.all([
					$directus.request(readMe({ fields: [ '*', { memberships: MEMBERSHIP_FIELDS }] })),
					$directus.request(readRolesMe()),
					// A Directus admin matches every org here, so the list is capped.
					$directus.request(readItems('gp_orgs', { filter: { members: { role: { _eq: 'admin' } } }, limit: 100 })),
					readSessionActiveId(),
				]);

				if (signedOut) {
					return;
				}

				const isAdmin = roles.some(role => role.name === 'Administrator');
				const previousUserId = this.impersonation?.originalUser.id ?? this.user.id;
				const keepContext = this.isLoggedIn && this.isAdmin === isAdmin && previousUserId === user.id;
				this.user = toUser(user as DirectusUser);
				this.user.memberships = withOrgAdoptionTokens(this.user.memberships, adminOrgs);
				this.isAdmin = isAdmin;
				this.expiresAt = Number(expires_at);

				if (isAdmin && !keepContext) {
					if (!await this.applyAdminConfig()) {
						return;
					}
				} else if (isAdmin) {
					this.user = this.impersonation?.impersonatedUser ?? this.user;
				} else {
					this.clearAdminConfig();
					this.adminMode = false;
					this.impersonation = null;
				}

				if (signedOut) {
					return;
				}

				// For a Directus admin `adminOrgs` are all orgs, so the orgs of a Directus admin (or of the impersonated user) are read by id.
				if (this.isAdmin) {
					const adminOrgIds = this.user.memberships.filter(({ role }) => role === 'admin').map(({ org }) => org.id);
					const userOrgs = adminOrgIds.length ? await $directus.request(readItems('gp_orgs', { filter: { id: { _in: adminOrgIds } } })) : [];

					if (signedOut) {
						return;
					}

					this.user.memberships = withOrgAdoptionTokens(this.user.memberships, userOrgs);
				}

				await useAccount().loadActiveAccount(sessionActiveId, !keepContext);
				this.isLoggedIn = !signedOut;
			} catch (error) {
				console.error(error);
			}
		},
		setAppearance (appearance: AuthState['user']['appearance']) {
			this.user.appearance = appearance;
		},
		async deleteAccount () {
			const { $directus } = useNuxtApp();

			await $directus.request(deleteUser(this.user.id));
			this.$reset();
			navigateTo('/login');
		},
	},
});
