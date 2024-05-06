import { useAuth } from '~/store/auth';

export default defineNuxtRouteMiddleware(async (to) => {
	const user = useAuth();

	if (!user.isLoggedIn) {
		await user.fetchUser();
	}

	if (user.isLoggedIn && to?.name === 'login') {
		abortNavigation();
		return navigateTo('/');
	}

	if (!user.isLoggedIn && to?.name !== 'login') {
		abortNavigation();
		return navigateTo('/login');
	}
});
