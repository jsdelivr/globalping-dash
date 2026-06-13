export default defineNitroPlugin((nitroApp) => {
	const config = useRuntimeConfig();

	nitroApp.hooks.hook('render:response', (response) => {
		const contentType = response.headers?.['content-type'];

		if (typeof contentType === 'string' && contentType.startsWith('text/html')) {
			response.headers ||= {};

			response.headers['cache-control'] = config.isCoolifyPreview
				? 'no-cache, no-store'
				: 'public, max-age=300';
		}
	});
});
