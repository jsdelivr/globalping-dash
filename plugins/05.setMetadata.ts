import { customEndpoint } from '@directus/sdk';
import { useMetadata } from '~/store/metadata.js';
import { requestDirectus } from '~/utils/request-directus';

export default defineNuxtPlugin(async () => {
	const metadata = useMetadata();

	const response = await requestDirectus<Metadata>(customEndpoint({ method: 'GET', path: '/metadata' }));
	metadata.setMetadata(response);
});
