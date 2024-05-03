export default async function () {
	const { expires, refreshTokens } = useDirectusToken();

	if (expires.value && expires.value - new Date().getTime() < 3 * 60 * 1000) {
		// await refreshTokens();
	}
}
