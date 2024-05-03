// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	ssr: false,
	devtools: {
		enabled: true,
	},
	devServer: {
		port: 13010,
	},
	directus: {
		url: 'http://localhost:18055',
		autoRefresh: true,
		cookieNameToken: 'dash_directus_token',
		cookieNameRefreshToken: 'dash_directus_refresh_token',
	},
	modules: [ [ 'nuxt-primevue', {

	}], 'nuxt-directus' ],
	css: [ 'primevue/resources/themes/aura-light-green/theme.css', 'primeicons/primeicons.css' ],
});
