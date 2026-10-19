export default {
	root: ({ context, props, parent }) => ({
		class: [
			// Font
			'leading-normal',

			// Spacing
			'm-0',
			'py-2 px-3',

			// Shape
			'rounded-md',

			// Colors
			'placeholder:text-bluegray-400',
			{ 'text-bluegray-900 dark:text-surface-0 bg-surface-0 dark:bg-dark-900': !context.disabled },
			'border',
			{ 'border-surface-300 dark:border-dark-600': !props.invalid },

			// Invalid State
			'invalid:focus:ring-red-200',
			'invalid:hover:border-red-500',
			{ 'border-red-500 dark:border-red-400 focus:ring-red-200 dark:focus:ring-red-400': props.invalid },

			// States
			{
				'hover:[&:not(:focus)]:border-surface-400 dark:hover:[&:not(:focus)]:border-dark-400 focus:ring-primary-500 dark:focus:ring-primary-400': !context.disabled && !props.invalid,
				'focus:outline-none focus:outline-offset-0 focus:ring-1 focus:z-10': !context.disabled,
				'text-bluegray-500 bg-surface-100 dark:bg-dark-500 select-none pointer-events-none cursor-default': context.disabled,
			},

			// Filled State *for FloatLabel
			{ filled: parent.instance?.$name === 'FloatLabel' && props.modelValue !== null && props.modelValue?.length !== 0 },

			// Misc
			{ 'overflow-hidden': props.autoResize },
			'appearance-none',
			'transition-colors duration-200',
		],
	}),
};
