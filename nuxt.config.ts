export default defineNuxtConfig({
	compatibilityDate: '2024-07-01',
	runtimeConfig: {
		serverUrl: process.env.DASH_URL || 'https://dash.globalping.io',
		public: {
			gpAuthUrl: process.env.GP_API_URL || 'https://auth.globalping.io',
			directusUrl: process.env.DIRECTUS_URL || 'https://dash-directus.globalping.io',
			googleMapsKey: process.env.GOOGLE_MAPS_KEY,
			itemsPerTablePage: 10,
			creditsPerAdoptedProbePerDay: 150,
			creditsPerDollar: 2000,
		},
	},
	$development: {
		runtimeConfig: {
			serverUrl: process.env.DASH_URL || 'http://localhost:13010',
			public: {
				gpAuthUrl: process.env.GP_API_URL || 'http://localhost:13110',
				directusUrl: process.env.DIRECTUS_URL || 'http://localhost:18055',
			},
		},
		devtools: { enabled: true },
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
	sourcemap: true,
	devtools: { enabled: false },
	devServer: { port: 13010 },
	modules: [
		'@nuxtjs/google-fonts',
		'@nuxtjs/tailwindcss',
		'@primevue/nuxt-module',
		'@pinia/nuxt',
		'@vueuse/nuxt',
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
			Inter: [ 400, 700 ],
		},
	},
	tailwindcss: {},
	typescript: {
		typeCheck: 'build',
	},
});
