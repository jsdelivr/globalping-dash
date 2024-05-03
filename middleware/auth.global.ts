export default defineNuxtRouteMiddleware(async (to) => {
	const { fetchUser, setUser } = useDirectusAuth();

	refreshToken();

	const user = useDirectusUser();

	if (!user.value) {
		const user = await fetchUser();
		setUser(user.value);
	}

	if (user.value && to.path === '/login') {
		return navigateTo('/');
	}

	if (!user.value && to.path !== '/login') {
		return navigateTo('/login');
	}
});
