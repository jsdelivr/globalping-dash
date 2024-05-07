import { useAuth } from '~/store/auth';

export default defineNuxtPlugin(async () => {
	setInterval(async () => {
		const auth = useAuth();
		const expiresAt = auth.getExpiresAt;

		if (expiresAt && expiresAt - new Date().getTime() < 3 * 60 * 1000) {
			auth.refresh();
		}
	}, 60 * 1000);
});
