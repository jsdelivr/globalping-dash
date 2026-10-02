import type { CookieRef } from '#app';
import { updateUser } from '@directus/sdk';
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
				name: user.github_username || `${user.first_name} ${user.last_name}`,
				github_id: user.external_identifier || 'admin',
				user_type: user.user_type,
				role: 'owner',
			};
		},
		current (): Account {
			const membership = this.selectedOrgs.find(({ org }) => org.account === this.activeId);

			if (!membership) {
				return this.personal;
			}

			const { org: { account, name, github_id, user_type }, role } = membership;
			return { id: account, name, github_id, user_type, role };
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
