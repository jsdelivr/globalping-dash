export default defineNuxtConfig({
	compatibilityDate: '2024-07-01',
	runtimeConfig: {
		serverUrl: process.env.DASH_URL || 'https://dash.globalping.io',
		public: {
			gpAuthUrl: process.env.GP_AUTH_URL || 'https://auth.globalping.io',
			directusUrl: process.env.DIRECTUS_URL || 'https://dash-directus.globalping.io',
			gpApiUrl: process.env.GP_API_URL || 'https://api.globalping.io',
			itemsPerTablePage: 10,
		},
	},
	$development: {
		runtimeConfig: {
			serverUrl: process.env.DASH_URL || 'http://localhost:13010',
			public: {
				gpAuthUrl: process.env.GP_AUTH_URL || 'http://localhost:13110',
				directusUrl: process.env.DIRECTUS_URL || 'http://localhost:18055',
				gpApiUrl: process.env.GP_API_URL || 'http://localhost:3000',
			},
		},
		devtools: { enabled: true },
		ignore: [ 'node_modules' ],
	},
	app: {
		head: {
			titleTemplate: '%s Globalping Dashboard',
			htmlAttrs: {
				lang: 'en-us',
			},
			meta: [
				{ charset: 'utf-8' },
				{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
				{ name: 'description', content: 'Manage your Globalping probes, credits, and access tokens' },
			],
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
		'nuxt3-interpolation',
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
