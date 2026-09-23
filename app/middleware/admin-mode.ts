import { useAuth } from '~/store/auth';

export default defineNuxtRouteMiddleware(() => {
	const auth = useAuth();

	if (!auth.isAdmin || !auth.adminMode) {
		return navigateTo('/');
	}
});
