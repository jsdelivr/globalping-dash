export default {
	root: {
		class: [
			// Flex & Alignment
			'flex items-center justify-center flex-wrap',

			// Spacing
			'px-4 py-2',

			// Shape
			'border-0 rounded-md',

			// Color
			// 'bg-surface-0 dark:bg-dark-700',
			// 'text-surface-500 dark:text-white/60',
		],
	},
	first: ({ context }) => ({
		class: [
			'relative',

			// Flex & Alignment
			'inline-flex items-center justify-center',

			// Shape
			'border-0 rounded-full',

			// Size
			'min-w-10 h-10 m-[1px]',
			'leading-none',

			// Color
			// 'text-surface-500 dark:text-white/60',

			// State
			{
				'hover:bg-surface-50 dark:hover:bg-[rgba(255,255,255,0.03)]': !context.disabled,
				'focus:outline-none focus:outline-offset-0 focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-400': !context.disabled,
			},

			// Transition
			'transition duration-200',

			// Misc
			'user-none overflow-hidden',
			{ 'text-surface-400 cursor-default pointer-events-none opacity-60': context.disabled },
		],
	}),
	prev: ({ context }) => ({
		class: [
			'relative',

			// Flex & Alignment
			'inline-flex items-center justify-center',

			// Shape
			'border-0 rounded-full',

			// Size
			'min-w-10 h-10 m-[1px]',
			'leading-none',

			// Color
			// 'text-surface-500 dark:text-white/60',

			// State
			{
				'hover:bg-surface-50 dark:hover:bg-[rgba(255,255,255,0.03)]': !context.disabled,
				'focus:outline-none focus:outline-offset-0 focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-400': !context.disabled,
			},

			// Transition
			'transition duration-200',

			// Misc
			'user-none overflow-hidden',
			{ 'text-surface-400 cursor-default pointer-events-none opacity-60': context.disabled },
		],
	}),
	next: ({ context }) => ({
		class: [
			'relative',

			// Flex & Alignment
			'inline-flex items-center justify-center',

			// Shape
			'border-0 rounded-full',

			// Size
			'min-w-10 h-10 m-[1px]',
			'leading-none',

			// Color
			// 'text-surface-500 dark:text-white/60',

			// State
			{
				'hover:bg-surface-50 dark:hover:bg-[rgba(255,255,255,0.03)]': !context.disabled,
				'focus:outline-none focus:outline-offset-0 focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-400': !context.disabled,
			},

			// Transition
			'transition duration-200',

			// Misc
			'user-none overflow-hidden',
			{ 'text-surface-400 cursor-default pointer-events-none opacity-60': context.disabled },
		],
	}),
	last: ({ context }) => ({
		class: [
			'relative',

			// Flex & Alignment
			'inline-flex items-center justify-center',

			// Shape
			'border-0 rounded-full',

			// Size
			'min-w-10 h-10 m-[1px]',
			'leading-none',

			// Color
			// 'text-surface-500 dark:text-white/60',

			// State
			{
				'hover:bg-surface-50 dark:hover:bg-[rgba(255,255,255,0.03)]': !context.disabled,
				'focus:outline-none focus:outline-offset-0 focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-400': !context.disabled,
			},

			// Transition
			'transition duration-200',

			// Misc
			'user-none overflow-hidden',
			{ 'text-surface-400 cursor-default pointer-events-none opacity-60': context.disabled },
		],
	}),
	page: ({ context }) => ({
		class: [
			'relative',

			// Flex & Alignment
			'inline-flex items-center justify-center',

			// Shape
			'border-0 rounded-full',

			// Size
			'min-w-10 h-10 m-[1px]',
			'leading-none',

			// Color
			// 'text-surface-500 dark:text-white/60',

			// State
			{
				'hover:bg-surface-50 dark:hover:bg-[rgba(255,255,255,0.03)]': !context.disabled,
				'focus:outline-none focus:outline-offset-0 focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-400': !context.disabled,
				'bg-primary !text-primary-contrast hover:!bg-primary-hover hover:!border-primary-hover': context.active,
			},

			// Transition
			'transition duration-200',

			// Misc
			'user-none overflow-hidden',
			{ 'text-surface-400 cursor-default pointer-events-none opacity-60': context.disabled },
		],
	}),
	contentStart: 'mr-auto',
	contentEnd: 'ml-auto',
};
