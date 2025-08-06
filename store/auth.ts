import { readMe, readRolesMe, deleteUser } from '@directus/sdk';
import { defineStore } from 'pinia';
import { requestDirectus } from '~/utils/request-directus';

interface AuthState {
	isLoggedIn: boolean;
	expiresAt: number;
	isAdmin: boolean;
	impersonation: {
		originalUser: User & {
			last_page: string | null;
		};
		github_username: string;
		impersonatedUser: User & {
			last_page: string | null;
		} | null;
	} | null;
	adminMode: boolean;
	user: User & {
		last_page: string | null;
	};
}

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
			github_organizations: [],
			user_type: 'member',
			appearance: null,
			public_probes: false,
			adoption_token: '',
			default_prefix: '',
			last_page: '',
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
		impersonate (user: User) {
			if (!user.github_username || !this.isAdmin) {
				return;
			}

			this.adminMode = false;

			this.impersonation = {
				originalUser: this.impersonation?.originalUser || this.user,
				github_username: user.github_username,
				impersonatedUser: {
					...user,
					last_page: this.user.last_page,
				},
			};

			this.user = {
				...user,
				last_page: this.user.last_page,
			};

			this.storeAdminConfig();
			window.location.reload();
		},
		clearImpersonation () {
			this.user = this.impersonation?.originalUser || this.user;
			this.impersonation = null;
			this.storeAdminConfig();
			window.location.reload();
		},
		storeAdminConfig () {
			sessionStorage.setItem('adminConfig', JSON.stringify({
				adminMode: this.adminMode,
				impersonation: this.impersonation,
			}));
		},
		applyAdminConfig () {
			try {
				const adminConfig: Pick<AuthState, 'adminMode' | 'impersonation'> = JSON.parse(sessionStorage.getItem('adminConfig') || '');

				if (
					typeof adminConfig?.adminMode !== 'boolean'
					|| (adminConfig?.impersonation !== null && (
						typeof adminConfig?.impersonation !== 'object'
						|| typeof adminConfig?.impersonation?.github_username !== 'string'
						|| typeof adminConfig?.impersonation?.originalUser?.id !== 'string'
					))
				) {
					this.clearAdminConfig();
					return;
				}

				this.adminMode = adminConfig?.adminMode || false;
				this.impersonation = adminConfig?.impersonation || null;

				if (this.impersonation) {
					this.user = this.impersonation.impersonatedUser || this.user;
				}
			} catch {
				sessionStorage.setItem('adminConfig', JSON.stringify({ adminMode: false, impersonation: null }));
			}
		},
		clearAdminConfig () {
			sessionStorage.removeItem('adminConfig');
		},
		async login () {
			const config = useRuntimeConfig();
			const redirect = this.getRedirectUrl();
			const directusRedirect = `${location.origin}/auth/callback?redirect=${encodeURIComponent(redirect.toString())}`;
			await navigateTo(`${config.public.directusUrl}/auth/login/github?redirect=${encodeURIComponent(directusRedirect)}`, { external: true });
		},
		async logout () {
			const { $directus } = useNuxtApp();

			this.clearAdminConfig();
			await $directus.logout();
			this.$reset();
			navigateTo('/login');
		},
		async refresh () {
			const { $directus } = useNuxtApp();

			try {
				const { expires_at } = await $directus.refresh();
				const [ user, roles ] = await Promise.all([
					requestDirectus(readMe()),
					requestDirectus(readRolesMe()),
				]);
				this.isLoggedIn = true;
				this.expiresAt = Number(expires_at);
				this.user = user as AuthState['user'];
				this.isAdmin = !!roles.some(role => role.name === 'Administrator');

				if (this.isAdmin) {
					this.applyAdminConfig();
				}
			} catch (error) {
				console.error(error);
			}
		},
		setAppearance (appearance: AuthState['user']['appearance']) {
			this.user.appearance = appearance;
		},
		async deleteAccount () {
			await requestDirectus(deleteUser(this.user.id));
			this.$reset();
			navigateTo('/login');
		},
	},
});
