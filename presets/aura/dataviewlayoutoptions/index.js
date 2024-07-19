export default {
	listbutton: ({ props }) => ({
		class: [
			// Font
			'leading-none',

			// Flex Alignment
			'inline-flex items-center align-bottom text-center',

			// Shape
			'border rounded-md rounded-r-none',

			// Spacing
			'px-4 py-3',

			// Color
			props.modelValue === 'list' ? 'bg-primary border-primary text-primary-inverse' : 'bg-surface-0 dark:bg-dark-700 border-surface-200 dark:border-dark-300 text-surface-700 dark:text-white/80',

			// States
			'focus:outline-none focus:outline-offset-0 focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-400',
			props.modelValue === 'list' ? 'hover:bg-primary-hover' : 'hover:bg-surface-50 dark:hover:bg-surface-800',

			// Transition
			'transition duration-200',

			// Misc
			'cursor-pointer select-none overflow-hidden',
		],
	}),
	gridbutton: ({ props }) => ({
		class: [
			// Font
			'leading-none',

			// Flex Alignment
			'inline-flex items-center align-bottom text-center',

			// Shape
			'border rounded-md rounded-l-none',

			// Spacing
			'px-4 py-3',

			// Color
			props.modelValue === 'grid' ? 'bg-primary border-primary text-primary-inverse' : 'bg-surface-0 dark:bg-dark-700 border-surface-200 dark:border-dark-300 text-surface-700 dark:text-white/80',

			// States
			'focus:outline-none focus:outline-offset-0 focus:ring-1 focus:ring-primary-500 dark:focus:ring-primary-400',
			props.modelValue === 'grid' ? 'hover:bg-primary-hover' : 'hover:bg-surface-50 dark:hover:bg-surface-800',

			// Transition
			'transition duration-200',

			// Misc
			'cursor-pointer select-none overflow-hidden',
		],
	}),
};
