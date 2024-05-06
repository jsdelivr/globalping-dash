// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	ssr: false,
	devtools: {
		enabled: true,
	},
	devServer: {
		port: 13010,
	},
	modules: [
		[ 'nuxt-primevue', {

		}],
		'@pinia/nuxt',
	],
	css: [ 'primevue/resources/themes/aura-light-green/theme.css', 'primeicons/primeicons.css' ],
});
