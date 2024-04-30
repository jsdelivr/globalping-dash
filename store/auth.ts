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
		async login ({ email, password, redirect }) {
			const router = useRouter();
			const { $directus } = useNuxtApp();
			console.log('$directus', $directus);

			try {
				await $directus.login(email, password);
				const user = await $directus.request(readMe());
				this.isLoggedIn = true;
				this.user = user;

				router.push(redirect || '/');
			} catch (e) {
				console.log(e);
				throw new Error('Wrong email address or password');
			}
		},
		async logout () {
			const router = useRouter();
			const { $directus } = useNuxtApp();

			try {
				await $directus.logout();
				this.$reset();
				router.push('/login');
			} catch (e) {
				console.log(e);
				throw new Error('Issue logging out');
			}
		},
		async fetchUser () {
			const { $directus } = useNuxtApp();

			try {
				const user = await $directus.users.me.read({ fields: [ '*' ] });
				this.isLoggedIn = true;
				this.user = user;
			} catch (e) {
				console.log(e);
			}
		},
		async resetState () {
			this.$reset();
		},
	},
});
