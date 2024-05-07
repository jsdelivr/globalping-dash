import { useAuth } from '~/store/auth';

export default defineNuxtRouteMiddleware(async (to) => {
	const auth = useAuth();

	if (!auth.isLoggedIn) {
		await auth.refresh();
	}

	if (auth.isLoggedIn && to?.name === 'login') {
		abortNavigation();
		return navigateTo('/');
	}

	if (!auth.isLoggedIn && to?.name !== 'login') {
		abortNavigation();
		return navigateTo('/login');
	}
});
