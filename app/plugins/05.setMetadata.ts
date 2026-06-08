import { PUBLIC_ROUTES } from '~/constants/routes';
import { useAuth } from '~/store/auth';
import { useMetadata } from '~/store/metadata';

export default defineNuxtPlugin(async () => {
	const auth = useAuth();
	const route = useRoute();
	const metadata = useMetadata();

	try {
		const response = await $fetch<Metadata>('/api/metadata');
		metadata.setMetadata(response);
	} catch (error) {
		// avoid throwing on login redirects to prevent Google from indexing an "error 500" page
		if (!auth.isLoggedIn && !PUBLIC_ROUTES.includes(route.path)) {
			return;
		}

		throw error;
	}
});
