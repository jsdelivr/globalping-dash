import { useAuth } from '~/store/auth';

export default defineNuxtRouteMiddleware(async (to) => {
	const auth = useAuth();

	if (!auth.isLoggedIn) {
		await auth.refresh();
	}

	if (auth.isLoggedIn && to?.name === 'login') {
		abortNavigation();
		return navigateTo(auth.getRedirectUrl(), { external: true });
	}

	if (!auth.isLoggedIn && to?.name !== 'login') {
		auth.clearAdminConfig();
		abortNavigation();
		return navigateTo(`/login?redirect=${encodeURIComponent(location.href)}`);
	}
});
