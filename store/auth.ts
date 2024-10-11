import { readMe } from '@directus/sdk';
import { defineStore } from 'pinia';

interface AuthState {
	isLoggedIn: boolean,
	expiresAt: number,
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
	}
}

export const useAuth = defineStore('auth', {
	state: (): AuthState => ({
		isLoggedIn: false,
		expiresAt: 0,
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
		},
	}),

	getters: {
		getUser: state => state.user,
	},

	actions: {
		getRedirectUrl () {
			const url = new URL(location.href);
			const redirect = url.searchParams.get('redirect') || '/';
			const redirectUrl = new URL(redirect, url.origin);

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
				const user = await $directus.request(readMe()) as AuthState['user'];
				this.isLoggedIn = true;
				this.expiresAt = Number(expires_at);
				this.user = user;
			} catch (error) {
				console.error(error);
			}
		},
		setAppearance (appearance: AuthState['user']['appearance']) {
			this.user.appearance = appearance;
		},
	},
});
