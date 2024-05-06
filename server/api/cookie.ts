export default defineEventHandler(async (event) => {
	const cookies = parseCookies(event);

	const expires = new Date();
	expires.setDate(expires.getDate() + 7);

	setCookie(event, 'dash_directus_refresh_token', cookies.directus_refresh_token, {
		expires,
		sameSite: 'lax',
		secure: true,
	});

	await sendRedirect(event, '/', 302);
});
