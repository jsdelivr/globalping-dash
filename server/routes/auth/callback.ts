export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig();
	const serverRootUrl = new URL(config.serverUrl);
	const query = getQuery(event);
	const redirect = query.redirect?.toString() || '/';
	let redirectUrl = new URL(redirect, config.serverUrl);

	if (redirectUrl.origin !== serverRootUrl.origin) {
		redirectUrl = serverRootUrl;
	}

	await sendRedirect(event, redirectUrl.toString());
});
