export default defineCachedEventHandler(async (event) => {
	const config = useRuntimeConfig(event);

	return $fetch<Metadata>(`${config.public.directusUrl}/metadata`);
}, {
	maxAge: 60,
	name: 'directus-metadata',
	getKey: () => 'directus-metadata',
});
