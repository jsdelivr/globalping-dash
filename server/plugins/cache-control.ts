export default defineNitroPlugin((nitroApp) => {
	nitroApp.hooks.hook('render:response', (response) => {
		const contentType = response.headers?.['content-type'];

		if (typeof contentType === 'string' && contentType.startsWith('text/html')) {
			response.headers ||= {};
			response.headers['cache-control'] = 'public, max-age=300';
		}
	});
});
