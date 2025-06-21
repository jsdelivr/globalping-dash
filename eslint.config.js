import typescript from '@martin-kolarik/eslint-config/typescript.js';
import { createConfigForNuxt } from '@nuxt/eslint-config';
import tailwindcss from 'eslint-plugin-tailwindcss';

export default createConfigForNuxt().prepend(
	tailwindcss.configs['flat/recommended'],
	typescript.forFiles([ '**/*.ts', '**/*.vue' ]),
).append(
	{
		ignores: [
			'.nuxt/**',
			'.output/**',
			'dist/**',
			'test/e2e/globalping-dash-directus',
		],
	},
	{
		rules: {
			'import/order': [ 'error', {
				distinctGroup: false,
				pathGroups: [
					{
						pattern: '#**',
						group: 'external',
						position: 'before',
					},
				],
				alphabetize: {
					order: 'asc',
				},
			}],

			// Preset overrides.
			'camelcase': 'off',
			'jsonc/no-comments': 'off',
			'n/no-missing-import': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					args: 'all',
					argsIgnorePattern: '^_',
					caughtErrors: 'all',
					caughtErrorsIgnorePattern: '^_',
					destructuredArrayIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					ignoreRestSiblings: true,
				},
			],
		},
	},
	{
		files: [
			'**/*.vue',
		],
		rules: {
			'@stylistic/indent': 'off',
			'vue/component-tags-order': 'off',
			'vue/block-order': [ 'error', {
				order: [ 'template', 'script', 'style' ],
			}],
			'vue/html-indent': [
				'error',
				'tab',
				{
					baseIndent: 1,
				},
			],
			'vue/script-indent': [
				'error',
				'tab',
				{
					baseIndent: 1,
				},
			],
			'vue/html-closing-bracket-spacing': [
				'error',
				{
					selfClosingTag: 'never',
				},
			],
			'vue/max-attributes-per-line': [ 'error', {
				singleline: {
					max: 5,
				},
				multiline: {
					max: 1,
				},
			}],
			'vue/singleline-html-element-content-newline': 'off',
			'tailwindcss/no-custom-classname': 'off',
		},
	},
	{
		files: [ 'test/**' ],

		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-non-null-assertion': 'off',

			'no-restricted-properties': [ 'error',
				{
					object: 'sinon',
					property: 'spy',
				},
				{
					object: 'sinon',
					property: 'stub',
				},
				{
					object: 'sinon',
					property: 'mock',
				},
				{
					object: 'sinon',
					property: 'fake',
				},
				{
					object: 'sinon',
					property: 'restore',
				},
				{
					object: 'sinon',
					property: 'reset',
				},
				{
					object: 'sinon',
					property: 'resetHistory',
				},
				{
					object: 'sinon',
					property: 'resetBehavior',
				}],
		},
	},
);
