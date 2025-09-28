import { customEndpoint } from '@directus/sdk';
import { useMetadata } from '~/store/metadata.js';

export default defineNuxtPlugin(async () => {
	const metadata = useMetadata();
	const { $directus } = useNuxtApp();

	try {
		const response = await $directus.request<Metadata>(customEndpoint({ method: 'GET', path: '/metadata' }));
		metadata.setMetadata(response);
	} catch (e) {
		console.error(e);
	}
});
