export default {
	root: {
		class: [
			'relative',

			// Alignment
			'inline-flex',
			'align-bottom',

			// Size
			'w-5',
			'h-5',

			// Misc
			'cursor-pointer',
			'select-none',
		],
	},
	box: ({ props, context }) => ({
		class: [
			// Alignment
			'flex',
			'items-center',
			'justify-center',

			// Size
			'w-5',
			'h-5',

			// Shape
			'rounded',
			'border',

			// Colors
			'text-white',
			{
				'border-surface-300 dark:border-dark-400': !context.checked && !props.invalid,
				'bg-surface-0 dark:bg-dark-950': !context.checked && !props.invalid && !props.disabled,
				'border-primary bg-primary': context.checked,
			},

			// Invalid State
			'invalid:focus:ring-red-200',
			'invalid:hover:border-red-500',
			{ 'border-red-500 dark:border-red-400': props.invalid },

			// States
			{
				'peer-hover:border-surface-400 dark:peer-hover:border-dark-300': !props.disabled && !context.checked && !props.invalid,
				'peer-hover:bg-primary-emphasis peer-hover:border-primary-emphasis': !props.disabled && context.checked,
				'peer-focus-visible:z-10 peer-focus-visible:outline-none peer-focus-visible:outline-offset-0 peer-focus-visible:ring-1 peer-focus-visible:ring-primary-500 dark:peer-focus-visible:ring-primary-400': !props.disabled,
				'bg-surface-200 dark:bg-surface-700 select-none pointer-events-none cursor-default': props.disabled,
			},

			// Transitions
			'transition-colors',
			'duration-200',
		],
	}),
	input: {
		class: [
			'peer',

			// Size
			'w-full ',
			'h-full',

			// Position
			'absolute',
			'top-0 left-0',
			'z-10',

			// Spacing
			'p-0',
			'm-0',

			// Shape
			'opacity-0',
			'rounded',
			'outline-none',
			'border border-surface-300 dark:border-surface-700',

			// Misc
			'appearance-none',
			'cursor-pointer',
		],
	},
	icon: ({ context, state }) => ({
		class: [
			// Size
			'w-[0.875rem]',
			'h-[0.875rem]',

			// Colors
			{
				'text-white dark:text-surface-950': context.checked,
				'text-primary': state.d_indeterminate,
			},

			// Transitions
			'transition-all',
			'duration-200',
		],
	}),
};
