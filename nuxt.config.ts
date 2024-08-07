export default defineNuxtConfig({
	compatibilityDate: '2024-07-01',
	runtimeConfig: {
		public: {
			directusUrl: process.env.DIRECTUS_URL,
			googleMapsKey: process.env.GOOGLE_MAPS_KEY,
			itemsPerTablePage: 10,
		},
	},
	app: {
		head: {
			titleTemplate: '%s Globalping Dashboard',
			htmlAttrs: {
				lang: 'en-us',
			},
		},
	},
	imports: {
		scan: false,
	},
	ssr: false,
	devtools: { enabled: false },
	devServer: { port: 13010 },
	modules: [
		'@nuxtjs/google-fonts',
		'@nuxtjs/tailwindcss',
		'@primevue/nuxt-module',
		'@pinia/nuxt',
		'nuxt-icons',
	],
	css: [ 'primeicons/primeicons.css', '~/assets/css/base.css', '~/assets/css/global.css' ],
	primevue: {
		options: {
			unstyled: true,
		},
		importPT: { as: 'Aura', from: '~/presets/aura' },
	},
	googleFonts: {
		subsets: [
			'latin',
		],
		families: {
			Inter: true,
		},
	},
	tailwindcss: {

	},
	typescript: {
		// TODO: P2: fix and uncomment.
		// typeCheck: 'build',
	},
	$development: {
		runtimeConfig: {
			public: {
				directusUrl: process.env.DIRECTUS_URL || 'http://localhost:18055',
			},
		},
		devtools: { enabled: true },
	},
});
