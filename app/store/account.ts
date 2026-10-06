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

	if (auth.adminMode) {
		return null;
	}

	const stored = auth.impersonation ? sessionStorage.getItem(IMPERSONATION_KEY) : activeAccountCookie().value;
	const [ userId, accountId ] = (stored ?? '').split(':');
	return userId === auth.user.id && accountId ? accountId : null;
};

const storeActiveId = (accountId: string | null) => {
	const { impersonation, user } = useAuth();
	const value = accountId ? `${user.id}:${accountId}` : undefined;

	if (impersonation) {
		sessionStorage.setItem(IMPERSONATION_KEY, value ?? '');
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
				adoption_token: user.adoption_token,
			};
		},
		current (): Account {
			const membership = this.selectedOrgs.find(({ org }) => org.account === this.activeId);

			if (!membership) {
				return this.personal;
			}

			const { org: { id, account, name, github_id, user_type, public_probes, adoption_token }, role } = membership;
			return { id: account, org_id: id, name, github_id, user_type, org_role: role, public_probes, tag_prefix: name, adoption_token };
		},
		canManageProbes (): boolean {
			return !this.current.org_id || this.current.org_role === 'admin';
		},
		canCreateTokens (): boolean {
			return !this.current.org_id || this.current.org_role === 'admin' || this.current.org_role === 'member';
		},
	},
	actions: {
		restore () {
			this.activeId = readActiveId();

			// An org that is no longer offered falls back to the personal account, for gp-api as well.
			if (this.activeId && this.activeId !== this.current.id) {
				storeActiveId(null);
				this.activeId = null;
			}
		},
		switchTo (accountId: string | null) {
			if (accountId === this.activeId) {
				return;
			}

			storeActiveId(accountId);
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
