import { createDirectus, authentication, rest } from '@directus/sdk';

export default defineNuxtPlugin(async () => {
	const directus = createDirectus<DirectusSchema>('http://localhost:18055')
		.with(authentication('session', { credentials: 'include' }))
		.with(rest({ credentials: 'include' }));

	return {
		provide: { directus },
	};
});
