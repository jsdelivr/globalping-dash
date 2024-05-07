import { defineStore } from 'pinia';
import { readMe } from '@directus/sdk';

interface AuthState {
  isLoggedIn: boolean,
	expiresAt: number,
  user: {
    id?: string,
    first_name?: string | null,
    last_name?: string | null,
		github_username?: string,
		github_organizations?: string[],
    email?: string | null,
    last_page?: string | null,
    external_identifier?: string | null,
	}
}

export const useAuth = defineStore('auth', {
	state: (): AuthState => ({
		isLoggedIn: false,
		expiresAt: 0,
		user: {},
	}),

	getters: {
		getIsLoggedIn: state => state.isLoggedIn,
		getExpiresAt: state => state.expiresAt,
		getUser: state => state.user,
	},

	actions: {
		async login () {
			const redirect = `${window.location.origin}${'/'}`;
			await navigateTo(`http://127.0.0.1:18055/auth/login/github?redirect=${encodeURIComponent(redirect)}`, { external: true });
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
	},
});
