import { readMe, readRolesMe } from '@directus/sdk';
import { defineStore } from 'pinia';

interface AuthState {
	isLoggedIn: boolean,
	expiresAt: number,
		isAdmin: boolean,
		user: {
		id: string,
		first_name: string | null,
		last_name: string | null,
		github_username: string,
		github_organizations: string[],
		email: string | null,
		last_page: string | null,
		external_identifier: string | null,
		appearance: 'light' | 'dark' | null,
		user_type: 'member' | 'sponsor' | 'special',
		public_probes: boolean,
	}
}

export const useAuth = defineStore('auth', {
	state: (): AuthState => ({
		isLoggedIn: false,
		expiresAt: 0,
		isAdmin: false,
		user: {
			id: '',
			first_name: '',
			last_name: '',
			github_username: '',
			github_organizations: [],
			email: '',
			last_page: '',
			external_identifier: '',
			appearance: null,
			user_type: 'member',
			public_probes: false,
		},
	}),

	getters: {
		getUser: state => state.user,
	},

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
		async login () {
			const config = useRuntimeConfig();
			const redirect = this.getRedirectUrl();
			const directusRedirect = `${location.origin}/auth/callback?redirect=${encodeURIComponent(redirect.toString())}`;
			await navigateTo(`${config.public.directusUrl}/auth/login/github?redirect=${encodeURIComponent(directusRedirect)}`, { external: true });
		},
		async logout () {
			const { $directus } = useNuxtApp();

			await $directus.logout();
			this.$reset();
			navigateTo('/login');
		},
		async refresh () {
			const { $directus } = useNuxtApp();

			try {
				const { expires_at } = await $directus.refresh();
				const [ user, roles ] = await Promise.all([
					$directus.request(readMe()),
					$directus.request(readRolesMe()),
				]);
				this.isLoggedIn = true;
				this.expiresAt = Number(expires_at);
				this.user = user as AuthState['user'];
				this.isAdmin = !!roles.some(role => role.name === 'Administrator');
			} catch (error) {
				console.error(error);
			}
		},
		setAppearance (appearance: AuthState['user']['appearance']) {
			this.user.appearance = appearance;
		},
	},
});
