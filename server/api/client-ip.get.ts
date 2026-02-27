export default defineEventHandler(async (event) => {
	const ip = getRequestIP(event, { xForwardedFor: true });

	if (import.meta.dev && (ip === '::1' || ip === '127.0.0.1')) {
		return null;
	}

	return ip;
});
