import { createDirectus, authentication, rest } from '@directus/sdk';

export default defineNuxtPlugin(async () => {
	const directus = createDirectus<DirectusSchema>('http://127.0.0.1:18055')
		.with(authentication('cookie', { credentials: 'include' }))
		// .with(rest({ credentials: 'include' }));
		.with(rest());


	return {
		provide: { directus },
	};
});
