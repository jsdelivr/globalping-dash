import { createDirectus, authentication, rest } from '@directus/sdk';
import { useAuth } from '~/store/auth';

export default defineNuxtPlugin(async () => {
	// const config = useRuntimeConfig();

	const directus = createDirectus('http://localhost:18055')
		.with(authentication('cookie', { credentials: 'include' }))
		.with(rest({ credentials: 'include' }));

	// const { access_token: token } = await directus.refresh();
	const token = null;
	const auth = useAuth();

	// If there's a token but we don't have a user, fetch the user
	if (!auth.isLoggedIn && token) {
		console.log('Token found, fetching user');
		console.log('Token is', token);

		try {
			await auth.fetchUser();
			console.log('User fetched succeessfully');
		} catch (e) {
			console.log('Failed to fetch user');
			console.log(e);
		}
	}

	// If the user is logged in but there's no token, reset the auth store {
	if (auth.getIsLoggedIn && !token) {
		console.log('Token not found, resetting auth store');
		auth.$reset();
	}

	return {
		provide: { directus },
	};
});
