export default defineNuxtRouteMiddleware((to, from) => {
	const fromPath = useState<string | null>('fromPath', () => null);

	if (from.fullPath !== to.fullPath && from.fullPath !== '') {
		fromPath.value = from.fullPath;
	}
});
