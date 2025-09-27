import { createDirectus, authentication, rest } from '@directus/sdk';

export default defineNuxtPlugin(async () => {
	const config = useRuntimeConfig();
	const directus = createDirectus<DirectusSchema>(config.public.directusUrl)
		.with(authentication('session', { credentials: 'include' }))
		.with(rest({ credentials: 'include' }));

	return {
		provide: { directus },
	};
});
