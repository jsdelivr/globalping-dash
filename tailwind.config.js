import defaultTheme from 'tailwindcss/defaultTheme';
import primeui from 'tailwindcss-primeui';

export default {
	plugins: [
		primeui,
	],
	darkMode: 'selector',
	content: [
		'presets/**/*.{js,vue,ts}',
	],
	theme: {
		borderWidth: {
			...defaultTheme.borderWidth,
			1.5: '1.5px',
		},
		borderRadius: rem2px(defaultTheme.borderRadius),
		columns: rem2px(defaultTheme.columns),
		fontSize: rem2px(defaultTheme.fontSize),
		lineHeight: rem2px(defaultTheme.lineHeight),
		maxWidth: ({ theme, breakpoints }) => {
			return {
				...rem2px(defaultTheme.maxWidth({ theme, breakpoints })),
			};
		},
		spacing: rem2px(defaultTheme.spacing),
		extend: {
			colors: {
				'primary': 'var(--p-primary-color)',
				'primary-contrast': 'var(--p-primary-contrast-color)',
				'primary-hover': 'var(--p-primary-hover-color)',

				'bluegray-0': 'var(--bluegray-0)',
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

				'sidebar-border': 'var(--sidebar-border)',
				'table-border': 'var(--table-border)',
				'sidebar-item': 'var(--sidebar-item)',
				'sidebar-bg': 'var(--sidebar-bg)',
				'header-bg-table-bg': 'var(--header-bg-table-bg)',
				'main-bg': 'var(--main-bg)',

				'dark-0': 'var(--dark-0)',
				'dark-50': 'var(--dark-50)',
				'dark-100': 'var(--dark-100)',
				'dark-200': 'var(--dark-200)',
				'dark-300': 'var(--dark-300)',
				'dark-400': 'var(--dark-400)',
				'dark-500': 'var(--dark-500)',
				'dark-600': 'var(--dark-600)',
				'dark-700': 'var(--dark-700)',
				'dark-800': 'var(--dark-800)',
				'dark-900': 'var(--dark-900)',
				'dark-950': 'var(--dark-950)',

				'main-900': 'var(--main-900)',
			},
			fontFamily: {
				// Inter + the tailwind defaults
				sans: [ 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"' ],
			},
			fontSize: {
				'2xs': [ '0.7rem', '0.85rem' ],
				'3xs': [ '0.6rem', '0.7rem' ],
			},
		},
	},
};

// We use 1rem = 14px but still want to keep the default tailwind sizes (1rem = 16px) so we convert it to pixels here
function rem2px (input, fontSize = 16) {
	if (input == null) {
		return input;
	}

	const ret = {};

	switch (typeof input) {
		case 'object':
			if (Array.isArray(input)) {
				return input.map(val => rem2px(val, fontSize));
			}

			for (const key of Object.keys(input)) {
				if (input[key] && rem2px(input[key])) {
					ret[key] = rem2px(input[key]);
				}
			}

			return ret;

		case 'string':
			return input.replace(
				/(\d*\.?\d+)rem$/,
				(_, val) => parseFloat(val) * fontSize + 'px',
			);

		default:
			return input;
	}
}
