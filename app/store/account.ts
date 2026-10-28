import { customEndpoint, updateItem, updateUser } from '@directus/sdk';
import { defineStore } from 'pinia';
import { useAuth } from '~/store/auth';

const IMPERSONATION_KEY = 'impersonationActiveAccount';

export const ACCOUNT_CHANNEL = 'gp-account';

const readImpersonationActiveId = () => {
	const [ userId, accountId ] = (sessionStorage.getItem(IMPERSONATION_KEY) ?? '').split(':');
	return userId === useAuth().user.id && accountId ? accountId : null;
};

export const readSessionActiveId = async () => {
	const { $directus } = useNuxtApp();
	const { accountId } = await $directus.request<{ accountId: string }>(customEndpoint({ path: '/accounts/active' }));
	return accountId;
};

const storeSessionActiveId = async (accountId: string) => {
	const { $directus } = useNuxtApp();

	await $directus.request(customEndpoint({
		method: 'POST',
		path: '/accounts/active',
		body: JSON.stringify({ accountId }),
	}));
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
				adoption_token: user.adoption_token,
				extra_adoption_tokens: [],
			};
		},
		current (): Account {
			const membership = this.selectedOrgs.find(({ org }) => org.account === this.activeId);

			if (!membership) {
				return this.personal;
			}

			const { org: { id, account, name, github_id, user_type, public_probes, adoption_token, extra_adoption_tokens }, role } = membership;
			return { id: account, org_id: id, name, github_id, user_type, org_role: role, public_probes, tag_prefix: name, adoption_token, extra_adoption_tokens };
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
		async loadActiveAccount (sessionActiveId: string) {
			const { adminMode, impersonation, isLoggedIn } = useAuth();

			if (adminMode) {
				this.activeId = null;
				return;
			}

			if (isLoggedIn) {
				return;
			}

			const accountId = impersonation ? readImpersonationActiveId() : sessionActiveId;
			const offered = this.selectedOrgs.map(({ org }) => org.account);
			this.activeId = accountId && offered.includes(accountId) ? accountId : null;

			// The session may act as an org this dashboard does not offer, e.g. one removed from the selected orgs on another device.
			if (!impersonation && accountId !== this.current.id) {
				await storeSessionActiveId(this.current.id);
				await useNuxtApp().$directus.refresh();
			}
		},
		async switchTo (accountId: string | null) {
			if (accountId === this.activeId) {
				return;
			}

			const { impersonation, user } = useAuth();
			const id = accountId ?? this.personal.id;

			if (impersonation) {
				sessionStorage.setItem(IMPERSONATION_KEY, `${user.id}:${id}`);
			} else {
				await storeSessionActiveId(id);
				new BroadcastChannel(ACCOUNT_CHANNEL).postMessage(id);
			}

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
				await this.switchTo(null);
			}
		},
	},
});
