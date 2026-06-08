import { customEndpoint } from '@directus/sdk';
import { PUBLIC_ROUTES } from '~/middleware/auth.global';
import { useAuth } from '~/store/auth';
import { useMetadata } from '~/store/metadata';

export default defineNuxtPlugin(async () => {
	const auth = useAuth();
	const route = useRoute();
	const metadata = useMetadata();
	const { $directus } = useNuxtApp();

	try {
		const response = await $directus.request<Metadata>(customEndpoint({ method: 'GET', path: '/metadata' }));
		metadata.setMetadata(response);
	} catch (error) {
		// avoid throwing on login redirects to prevent Google from indexing an "error 500" page
		if (!auth.isLoggedIn && !PUBLIC_ROUTES.includes(route.path)) {
			return;
		}

		throw error;
	}
});
