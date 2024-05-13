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
	// css: [ '~/assets/theme/themes/lara/lara-light/green/theme.scss', 'primeicons/primeicons.css', '~/assets/css/global.css' ],
	css: [ 'primeicons/primeicons.css', '~/assets/theme/themes/aura/aura-light/green/theme.scss', '~/assets/css/global.css' ],
});
