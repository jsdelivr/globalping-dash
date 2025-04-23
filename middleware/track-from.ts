/**
	Middleware to track the previous route's full path.
	Used to support back navigation.
*/
export default defineNuxtRouteMiddleware((to, from) => {
	const fromPath = useState<string | null>('fromPath', () => null);

	if (from.fullPath !== to.fullPath && from.fullPath !== '') {
		fromPath.value = from.fullPath;
	}
});
