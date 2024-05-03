export default defineNuxtPlugin(async () => {
	setInterval(async () => {
		await refreshToken();
	}, 60 * 1000);
});
