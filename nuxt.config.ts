// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	devtools: {
		enabled: true,
	},
	devServer: {
		port: 13010,
	},
	modules: [
		[ 'nuxt-primevue', {

		}],
	],
});
