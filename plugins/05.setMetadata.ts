import { customEndpoint } from '@directus/sdk';
import { useAuth } from '~/store/auth.js';
import { useMetadata } from '~/store/metadata.js';

export default defineNuxtPlugin(async () => {
	const auth = useAuth();
	const metadata = useMetadata();
	const { $directus } = useNuxtApp();

	if (!auth.isLoggedIn) {
		return;
	}

	const response = await $directus.request<Metadata>(customEndpoint({ method: 'GET', path: '/metadata' }));
	metadata.setMetadata(response);
});
