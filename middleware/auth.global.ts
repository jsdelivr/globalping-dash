import { useAuth } from '~/store/auth';

export default defineNuxtRouteMiddleware((to) => {
	const user = useAuth();

	console.log('user.isLoggedIn', user.isLoggedIn);
	console.log(`to?.name === 'login'`, to?.name === 'login');

	// if token exists and url is /login redirect to homepage
	if (user.isLoggedIn && to?.name === 'login') {
		return navigateTo('/');
	}

	// if token doesn't exist redirect to log in
	if (!user.isLoggedIn && to?.name !== 'login') {
		abortNavigation();
		return navigateTo('/login');
	}
});
