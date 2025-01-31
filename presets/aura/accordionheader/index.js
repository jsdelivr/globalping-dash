export default {
	root: ({ context }) => ({
		class: [
			'relative flex items-center justify-between text-bluegray-600 dark:text-surface-0 pr-4 font-semibold outline-transparent',
			{
				'focus-visible:outline-offset-2 focus-visible:ring-1 focus-visible:ring-primary-500 dark:focus-visible:ring-primary-400': !context.disabled,
			},
		],
	}),
	toggleIcon: 'absolute top-1 right-1 text-bluegray-900 dark:text-surface-0 w-4 h-4',
};
