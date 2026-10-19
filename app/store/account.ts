import type { CookieRef } from '#app';
import { updateItem, updateUser } from '@directus/sdk';
import { defineStore } from 'pinia';
import { useAuth } from '~/store/auth';

const COOKIE_NAME = 'gp_active_account';
const IMPERSONATION_KEY = 'impersonationActiveAccount';

let cookie: CookieRef<string | undefined> | undefined;

const activeAccountCookie = () => {
	const { hostname, protocol } = new URL(useRuntimeConfig().public.serverUrl);
	const isGlobalpingHost = hostname === 'globalping.io' || hostname.endsWith('.globalping.io');

	return cookie ??= useCookie<string | undefined>(COOKIE_NAME, {
		domain: isGlobalpingHost ? '.globalping.io' : undefined,
		sameSite: 'lax',
		secure: protocol === 'https:',
		maxAge: 31536000,
		encode: value => value ?? '',
		decode: value => value ?? undefined,
	});
};

const readActiveId = () => {
	const auth = useAuth();
	const stored = auth.impersonation ? sessionStorage.getItem(IMPERSONATION_KEY) : activeAccountCookie().value;
	const [ userId, accountId ] = (stored ?? '').split(':');
	return userId === auth.user.id && accountId ? accountId : null;
};

const storeActiveId = (accountId: string) => {
	const { impersonation, user } = useAuth();
	const value = `${user.id}:${accountId}`;

	if (impersonation) {
		sessionStorage.setItem(IMPERSONATION_KEY, value);
		return;
	}

	activeAccountCookie().value = value;
};

export const useAccount = defineStore('account', {
	state: () => ({
		activeId: null as string | null,
	}),
	getters: {
		selectedOrgs (): Membership[] {
			const { user } = useAuth();
			return user.memberships.filter(membership => user.selected_orgs.includes(membership.org.id));
		},
		nonViewerOrgs (): Membership[] {
			return this.selectedOrgs.filter(({ role }) => role !== 'viewer');
		},
		personal (): Account {
			const { user } = useAuth();

			return {
				id: user.account,
				org_id: null,
				name: user.github_username || `${user.first_name} ${user.last_name}`,
				github_id: user.external_identifier || 'admin',
				user_type: user.user_type,
				org_role: null,
				public_probes: user.public_probes,
				tag_prefix: user.default_prefix,
				website: null,
				description: null,
				banner: null,
				adoption_token: user.adoption_token,
				extra_adoption_tokens: [],
			};
		},
		current (): Account {
			const membership = this.selectedOrgs.find(({ org }) => org.account === this.activeId);

			if (!membership) {
				return this.personal;
			}

			const { org: { id, account, name, github_id, user_type, public_probes, website, description, banner, adoption_token, extra_adoption_tokens }, role } = membership;
			return { id: account, org_id: id, name, github_id, user_type, org_role: role, public_probes, tag_prefix: name, website, description, banner, adoption_token, extra_adoption_tokens };
		},
		canManageProbes (): boolean {
			return !this.current.org_id || this.current.org_role === 'admin';
		},
		canManageOrg (): boolean {
			return this.current.org_role === 'admin';
		},
		canCreateTokens (): boolean {
			return !this.current.org_id || this.current.org_role === 'admin' || this.current.org_role === 'member';
		},
	},
	actions: {
		restore () {
			const { adminMode, impersonation, user } = useAuth();

			if (adminMode) {
				this.activeId = null;
				return;
			}

			// The first of the stored account and the default one (not for an impersonation) that is still offered applies, else the personal account.
			const offered = [ this.personal.id, ...this.selectedOrgs.map(({ org }) => org.account) ];
			const accountId = [ readActiveId(), impersonation ? null : user.default_account ].find(id => id && offered.includes(id));
			this.activeId = accountId && accountId !== this.personal.id ? accountId : null;
			storeActiveId(this.current.id);
		},
		switchTo (accountId: string | null) {
			if (accountId === this.activeId) {
				return;
			}

			storeActiveId(accountId ?? this.personal.id);
			window.location.reload();
		},
		async setPublicProbes (publicProbes: boolean) {
			const auth = useAuth();
			const { $directus } = useNuxtApp();
			const { org_id: orgId } = this.current;

			await (orgId
				? $directus.request(updateItem('gp_orgs', orgId, { public_probes: publicProbes }))
				: $directus.request(updateUser(auth.user.id, { public_probes: publicProbes })));

			await auth.refresh();
		},
		async setSelected (selectedOrgs: string[]) {
			const auth = useAuth();
			const { $directus } = useNuxtApp();

			const user = await $directus.request(updateUser(auth.user.id, { selected_orgs: selectedOrgs }, { fields: [ 'selected_orgs' ] }));
			auth.user.selected_orgs = user.selected_orgs;

			if (this.activeId && this.activeId !== this.current.id) {
				this.switchTo(null);
			}
		},
	},
});
