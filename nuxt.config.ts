import path from 'path';

export default defineNuxtConfig({
	ssr: false,
	devtools: { enabled: true },
	devServer: { port: 13010 },
	modules: [ '@nuxtjs/tailwindcss', 'nuxt-primevue', '@pinia/nuxt', 'nuxt-icons' ],
	css: [ 'primeicons/primeicons.css', '~/assets/css/base.css', '~/assets/css/global.css' ],
	primevue: {
		options: {
			unstyled: true,
		},
		importPT: { from: path.resolve(__dirname, './presets/aura/') },
	},
	tailwindcss: {
		config: {
			darkMode: 'class', // This enables dark mode based on the presence of the "dark" class in the HTML tag
			content: [
				'presets/**/*.{js,vue,ts}',
			],
			theme: {
				extend: {
					colors: {
						'primary': 'var(--primary)',
						'primary-inverse': 'var(--primary-inverse)',
						'primary-hover': 'var(--primary-hover)',
						'primary-active-color': 'var(--primary-active-color)',

						'primary-highlight': 'var(--primary)/var(--primary-highlight-opacity)',
						'primary-highlight-inverse': 'var(--primary-highlight-inverse)',
						'primary-highlight-hover': 'var(--primary)/var(--primary-highlight-hover-opacity)',

						'primary-50': 'var(--primary-50)',
						'primary-100': 'var(--primary-100)',
						'primary-200': 'var(--primary-200)',
						'primary-300': 'var(--primary-300)',
						'primary-400': 'var(--primary-400)',
						'primary-500': 'var(--primary-500)',
						'primary-600': 'var(--primary-600)',
						'primary-700': 'var(--primary-700)',
						'primary-800': 'var(--primary-800)',
						'primary-900': 'var(--primary-900)',
						'primary-950': 'var(--primary-950)',

						'surface-0': 'var(--surface-0)',
						'surface-50': 'var(--surface-50)',
						'surface-100': 'var(--surface-100)',
						'surface-200': 'var(--surface-200)',
						'surface-300': 'var(--surface-300)',
						'surface-400': 'var(--surface-400)',
						'surface-500': 'var(--surface-500)',
						'surface-600': 'var(--surface-600)',
						'surface-700': 'var(--surface-700)',
						'surface-800': 'var(--surface-800)',
						'surface-900': 'var(--surface-900)',
						'surface-950': 'var(--surface-950)',

						'bluegray-50': 'var(--bluegray-50)',
						'bluegray-100': 'var(--bluegray-100)',
						'bluegray-200': 'var(--bluegray-200)',
						'bluegray-300': 'var(--bluegray-300)',
						'bluegray-400': 'var(--bluegray-400)',
						'bluegray-500': 'var(--bluegray-500)',
						'bluegray-600': 'var(--bluegray-600)',
						'bluegray-700': 'var(--bluegray-700)',
						'bluegray-800': 'var(--bluegray-800)',
						'bluegray-900': 'var(--bluegray-900)',
						'bluegray-950': 'var(--bluegray-950)',
					},
					borderColor: {
						DEFAULT: 'var(--surface-300)',
					},
					fontSize: {
						'2xs': [ '0.7rem', '0.85rem' ],
					},
				},
			},
		},
	},
});
