export default {
	root: ({ props, context, parent }) => ({
		class: [
			// Font
			'leading-none',

			// Flex
			{ 'flex-1 w-[1%]': parent.instance.$name == 'InputGroup' },

			// Spacing
			'm-0',
			{
				'py-3 px-3.5': props.size == 'large',
				'py-1.5 px-2': props.size == 'small',
				'py-2 px-3': props.size == null,
			},

			// Shape
			{ 'rounded-md': parent.instance.$name !== 'InputGroup' },
			{ 'first:rounded-l-md rounded-none last:rounded-r-md': parent.instance.$name == 'InputGroup' },
			{ 'border-0 border-y border-l last:border-r': parent.instance.$name == 'InputGroup' },
			{ 'first:ml-0 -ml-px': parent.instance.$name == 'InputGroup' && !props.showButtons },

			// Colors
			'placeholder:text-bluegray-400 dark:placeholder:text-surface-500',
			{ 'text-surface-800 dark:text-surface-0 bg-surface-0 dark:bg-dark-900': !context.disabled },
			'border',
			{ 'border-surface-300 dark:border-dark-600': !props.invalid },

			// Invalid State
			'invalid:focus:ring-red-200',
			'invalid:hover:border-red-500',
			{ 'border-red-500 dark:border-red-400': props.invalid },

			// States
			{
				'hover:border-surface-400 dark:hover:border-surface-600': !context.disabled && !props.invalid,
				'focus:outline-none focus:outline-offset-0 focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-400 focus:z-10': !context.disabled,
				'text-bluegray-700 bg-surface-50 dark:bg-dark-500 select-none pointer-events-none cursor-default': context.disabled,
			},

			// Filled State *for FloatLabel
			{ filled: parent.instance?.$name == 'FloatLabel' && context.filled },

			// Misc
			'appearance-none',
			'transition-colors duration-200',
		],
	}),
};
