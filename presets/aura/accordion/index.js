export default {
	accordiontab: {
		root: {
			class: [ 'mb-0', 'border-b last:border-0 border-surface-200 dark:border-dark-300' ],
		},
		header: ({ props }) => ({
			class: [
				// State
				{ 'select-none pointer-events-none cursor-default opacity-60': props?.disabled },
			],
		}),
		headerAction: {
			class: [
				// Font
				// 'font-medium',
				'font-semibold',
				'leading-none',

				// Alignments
				'flex justify-between items-center',
				'flex-row-reverse',
				'relative',

				// Sizing
				// 'p-[1.125rem]',
				'px-6',
				'py-3',

				// Shape
				'rounded-md',
				'border-0',

				// Color
				'bg-surface-0 dark:bg-dark-700',
				'text-bluegray-600 dark:text-surface-0',

				// Transition
				'transition duration-200 ease-in-out',
				'transition-shadow duration-200',

				// States
				'focus:outline-none focus:outline-offset-0 focus-visible:ring-1 focus-visible:ring-primary-400 dark:focus-visible:ring-primary-300', // Focus

				// Misc
				'cursor-pointer no-underline select-none',
			],
		},
		headerIcon: ({ context }) => ({
			class: [ 'inline-block ml-2', { 'text-bluegray-900 dark:text-surface-0': context.active }],
		}),
		headerTitle: {
			class: 'leading-none',
		},
		content: {
			class: [
				// Spacing
				'p-[1.125rem] pt-0',

				// Shape
				'border-0 rounded-lg',

				// Color
				'bg-surface-0 dark:bg-dark-700',
				'text-bluegray-600 dark:text-surface-0',
			],
		},
		transition: {
			enterFromClass: 'max-h-0',
			enterActiveClass: 'overflow-hidden transition-[max-height] duration-1000 ease-[cubic-bezier(0.42,0,0.58,1)]',
			enterToClass: 'max-h-[1000px]',
			leaveFromClass: 'max-h-[1000px]',
			leaveActiveClass: 'overflow-hidden transition-[max-height] duration-[450ms] ease-[cubic-bezier(0,1,0,1)]',
			leaveToClass: 'max-h-0',
		},
	},
};
