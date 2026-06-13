const trustedOrigins = [
	/^https:\/\/(?:[\w-]+\.)*globalping\.io$/,
	/^http:\/\/localhost:(?:13000|13010)$/,
];

export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig();
	const serverRootUrl = new URL(config.public.serverUrl);
	const query = getQuery(event);
	const redirect = query.redirect?.toString() || '/';
	let redirectUrl = new URL(redirect, config.public.serverUrl);

	if (!trustedOrigins.some(origin => origin.test(redirectUrl.origin))) {
		redirectUrl = serverRootUrl;
	}

	await sendRedirect(event, redirectUrl.toString());
});
