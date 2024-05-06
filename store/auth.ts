import { defineStore } from 'pinia';
import { readMe } from '@directus/sdk';

interface AuthState {
  isLoggedIn: boolean
  user: object
}

export const useAuth = defineStore('auth', {
	state: (): AuthState => ({
		isLoggedIn: false,
		user: {},
	}),

	getters: {
		getIsLoggedIn: state => state.isLoggedIn,
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
		async fetchUser () {
			const { $directus } = useNuxtApp();

			try {
				await $directus.refresh();
				const user = await $directus.request(readMe());
				this.isLoggedIn = true;
				this.user = user;
			} catch (error) {
				console.error(error);
			}
		},
	},
});
