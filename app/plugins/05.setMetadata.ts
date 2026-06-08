import { customEndpoint } from '@directus/sdk';
import { useAuth } from '~/store/auth';
import { useMetadata } from '~/store/metadata';

const INFO_PAGES = [ 'emails', 'authorize' ];

export default defineNuxtPlugin(async () => {
	const auth = useAuth();
	const route = useRoute();
	const metadata = useMetadata();
	const { $directus } = useNuxtApp();

	try {
		const response = await $directus.request<Metadata>(customEndpoint({ method: 'GET', path: '/metadata' }));
		metadata.setMetadata(response);
	} catch (error) {
		if (!auth.isLoggedIn && !INFO_PAGES.some(page => (route.name as string).startsWith(page))) {
			return;
		}

		throw error;
	}
});
