export default {
	navContainer: ({ props }) => ({
		class: [
			// Position
			'relative',

			// Misc
			{ 'overflow-hidden': props.scrollable },
		],
	}),
	navContent: ({ instance }) => ({
		class: [
			// Overflow and Scrolling
			'overflow-y-hidden overscroll-contain',
			'overscroll-auto',
			'scroll-smooth',
			'[&::-webkit-scrollbar]:hidden',
		],
	}),
	previousButton: {
		class: [
			// Flexbox and Alignment
			'flex items-center justify-center',

			// Position
			'!absolute',
			'top-0 left-0',
			'z-20',

			// Size and Shape
			'h-full w-10',
			'rounded-none',

			// Colors
			'bg-surface-0 dark:bg-dark-700',
			'text-surface-700 dark:text-surface-0',
			'shadow-sm',
		],
	},
	nextButton: {
		class: [
			// Flexbox and Alignment
			'flex items-center justify-center',

			// Position
			'!absolute',
			'top-0 right-0',
			'z-20',

			// Size and Shape
			'h-full w-10',
			'rounded-none',

			// Colors
			'text-surface-700 dark:text-surface-0',
			'bg-surface-0 dark:bg-dark-700',
			'shadow-sm',
		],
	},
	nav: {
		class: [
			// Flexbox
			'flex flex-1',

			// Spacing
			'list-none',
			'p-0 m-0',

			// Colors
			'bg-surface-0 dark:bg-dark-700',
			'border-b dark:border-dark-300',
			'text-surface-900 dark:text-surface-0',
		],
	},
	tabpanel: {
		header: ({ props }) => ({
			class: [
				'flex-grow border-l first:border-l-0',
				// Spacing
				'mr-0',

				// Misc
				'outline-none',
				{
					'opacity-60 cursor-default user-select-none select-none pointer-events-none': props?.disabled,
				},
			],
		}),
		headerAction: ({ parent, context }) => ({
			class: [
				'justify-center',
				'relative',

				// Font
				'font-semibold',

				// Flexbox and Alignment
				'flex items-center',

				// Spacing
				'py-4 px-[1.125rem]',
				'-mb-px',

				// Shape
				'border-b-2',

				// Colors and Conditions
				{
					'dark:border-dark-300': parent.state.d_activeIndex !== context.index,
					'bg-surface-0 dark:bg-dark-700': parent.state.d_activeIndex !== context.index,
					'text-surface-700 dark:text-surface-0': parent.state.d_activeIndex !== context.index,

					'bg-surface-0 dark:bg-dark-700': parent.state.d_activeIndex === context.index,
					'border-primary': parent.state.d_activeIndex === context.index,
					'text-primary': parent.state.d_activeIndex === context.index,
				},

				// States
				// 'focus:outline-none focus:outline-offset-0 focus-visible:ring-1 ring-inset focus-visible:ring-primary-400 dark:focus-visible:ring-primary-300',
				{
					'hover:bg-surface-0 dark:hover:bg-dark-650': parent.state.d_activeIndex !== context.index,
					'hover:text-surface-900 dark:hover:text-surface-0': parent.state.d_activeIndex !== context.index,
				},

				// Transitions
				'transition-all duration-200',

				// Misc
				'cursor-pointer select-none text-decoration-none',
				'overflow-hidden',
				'user-select-none',
			],
		}),
		headerTitle: {
			class: [
				// Text
				'leading-none',
				'whitespace-nowrap',
			],
		},
	},
	panelcontainer: {
		class: [
			// Spacing
			'p-5',

			// Shape
			'border-0 rounded-none',
			'border-br-md border-bl-md',

			// Colors
			'bg-surface-0 dark:bg-dark-700',
			'text-surface-900 dark:text-surface-0',
		],
	},
};
