import { useAuth } from '~/store/auth';

export default defineNuxtRouteMiddleware((to) => {
	const user = useAuth();

	if (user.isLoggedIn && to?.name === 'login') {
		abortNavigation();
		return navigateTo('/');
	}

	if (!user.isLoggedIn && to?.name !== 'login') {
		abortNavigation();
		return navigateTo('/login');
	}
});
