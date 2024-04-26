// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	devtools: {
		enabled: false,
	},
	devServer: {
		port: 13010,
	},
	modules: [
		[ 'nuxt-primevue', {

		}],
	],
	css: [ 'primevue/resources/themes/aura-light-green/theme.css', 'primeicons/primeicons.css' ],
});
