const productionBranch = process.env.COOLIFY_PRODUCTION_BRANCH || 'master';
const coolifyDeploymentBranch = process.env.COOLIFY_BRANCH;
const isCoolifyPreview = process.env.ROBOTS_DISALLOW_ALL === '1'
	|| Boolean(coolifyDeploymentBranch && coolifyDeploymentBranch !== productionBranch);

const robotsDisallowedRoutes = [
	'/authorize',
	'/default-tag',
	'/emails',
];

export default defineNuxtConfig({
	compatibilityDate: '2026-05-15',
	runtimeConfig: {
		public: {
			serverUrl: process.env.DASH_URL || 'https://dash.globalping.io',
			gpAuthUrl: process.env.GP_AUTH_URL || 'https://auth.globalping.io',
			directusUrl: process.env.DIRECTUS_URL || 'https://dash-directus.globalping.io',
			gpApiUrl: process.env.GP_API_URL || 'https://api.globalping.io',
			probeAdoptionPort: Number(process.env.PROBE_ADOPTION_PORT) || 7201,
			gpSiteUrl: process.env.GP_SITE_URL || 'https://globalping.io',
			itemsPerTablePage: 10,
		},
	},
	$development: {
		runtimeConfig: {
			public: {
				serverUrl: process.env.DASH_URL || 'http://localhost:13010',
				gpAuthUrl: process.env.GP_AUTH_URL || 'http://localhost:13110',
				directusUrl: process.env.DIRECTUS_URL || 'http://localhost:18055',
				gpApiUrl: process.env.GP_API_URL || 'http://localhost:3000',
				probeAdoptionPort: Number(process.env.PROBE_ADOPTION_PORT) || 7201,
				gpSiteUrl: process.env.GP_SITE_URL || 'http://localhost:13000',
			},
		},
		devtools: { enabled: true },
		ignore: [ 'node_modules' ],
		// https://github.com/nuxt/nuxt/issues/34957#issuecomment-4388270459
		experimental: {
			viteEnvironmentApi: true,
		},
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
		'@nuxtjs/robots',
	],
	robots: {
		credits: false,
		groups: [
			{
				userAgent: '*',
				disallow: isCoolifyPreview ? [ '/' ] : robotsDisallowedRoutes,
			},
		],
	},
	routeRules: {
		'/favicon.ico': {
			headers: { 'cache-control': 'public, max-age=3600' },
		},
		'/**': {
			headers: { 'cache-control': 'no-cache, no-store' },
		},
	},
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
	tailwindcss: {
		cssPath: '~/assets/css/tailwind.css',
	},
	typescript: {
		typeCheck: 'build',
	},
});
