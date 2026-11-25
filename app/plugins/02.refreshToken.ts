import { ADMIN_CONFIG_KEY, useAuth } from '~/store/auth';

export default defineNuxtPlugin(async () => {
	useEventListener(window, 'storage', (event) => {
		if (event.storageArea === localStorage && event.key === ADMIN_CONFIG_KEY && event.newValue === null) {
			useAuth().finishLogout();
		}
	});

	setInterval(async () => {
		const auth = useAuth();
		const expiresAt = auth.expiresAt;

		if (expiresAt && expiresAt - new Date().getTime() < 60 * 60 * 1000) {
			auth.refresh();
		}
	}, 60 * 1000);
});
