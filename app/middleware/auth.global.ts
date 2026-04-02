import { useAuth } from '~/store/auth';

const PUBLIC_ROUTES = [
	'/emails/success',
];

export default defineNuxtRouteMiddleware(async (to) => {
	const auth = useAuth();
	const isPublicRoute = PUBLIC_ROUTES.includes(to.path);

	if (!auth.isLoggedIn) {
		await auth.refresh();
	}

	if (auth.isLoggedIn && to?.name === 'login') {
		abortNavigation();
		return navigateTo(auth.getRedirectUrl(), { external: true });
	}

	if (!auth.isLoggedIn && to?.name !== 'login' && !isPublicRoute) {
		auth.clearAdminConfig();
		abortNavigation();
		return navigateTo(`/login?redirect=${encodeURIComponent(new URL(to.fullPath, location.origin).toString())}`);
	}
});
