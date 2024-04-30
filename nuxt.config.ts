// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	devtools: {
		enabled: false,
	},
	devServer: {
		port: 13010,
	},
	directus: {
		url: 'http://localhost:18055',
	},
	modules: [ [ 'nuxt-primevue', {

	}], 'nuxt-directus' ],
	css: [ 'primevue/resources/themes/aura-light-green/theme.css', 'primeicons/primeicons.css' ],
});
