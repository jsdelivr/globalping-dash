export default {
	root: ({ props }) => ({
		class: [
			// Font
			'leading-none',

			// Display and Position
			'inline-flex items-center',
			'relative',
			'max-w-full overflow-hidden',

			// Shape
			'rounded-md',
			'outline-none outline-offset-0',

			// Color and Background
			{ 'bg-surface-0 dark:bg-dark-900': !props.disabled },
			'border',
			{ 'border-surface-300 dark:border-dark-600': !props.invalid },

			// Invalid State
			'invalid:focus:ring-red-200',
			'invalid:hover:border-red-500',
			{ 'border-red-500 dark:border-red-400': props.invalid },

			// Transitions
			'transition-[border-color,box-shadow]',
			'duration-200',

			// States
			{ 'hover:border-surface-400 dark:hover:border-dark-400': !props.invalid },
			'active:z-10 active:ring-1 active:ring-primary-500 dark:active:ring-primary-400',
			'focus-within:z-10 focus-within:ring-1 focus-within:ring-primary-500 dark:focus-within:ring-primary-400',
			'has-[[aria-expanded=true]]:z-10 has-[[aria-expanded=true]]:ring-1 has-[[aria-expanded=true]]:ring-primary-500 dark:has-[[aria-expanded=true]]:ring-primary-400',

			// Misc
			'cursor-pointer',
			'select-none',
			{ 'bg-surface-200 dark:bg-dark-500 select-none pointer-events-none cursor-default': props.disabled },
		],
	}),
	labelContainer: 'min-w-0 overflow-hidden flex flex-auto items-center cursor-pointer',
	label: ({ props }) => ({
		class: [
			'text-base leading-2',
			{ 'flex h-full min-h-0 items-center gap-1': props.display === 'chip' },

			// Spacing
			{
				'py-2 px-3': props.display === 'comma' || (props.display === 'chip' && !props?.modelValue?.length),
				'py-1 px-1': props.display === 'chip' && props?.modelValue?.length > 0,
			},

			// Color
			{ 'text-surface-800 dark:text-white/80': props.modelValue?.length, 'text-surface-400 dark:text-surface-500': !props.modelValue?.length },
			'placeholder:text-surface-400 dark:placeholder:text-surface-500',

			// Transitions
			'transition duration-200',

			// Misc
			'overflow-hidden whitespace-nowrap cursor-pointer overflow-ellipsis',
		],
	}),
	chipItem: 'shrink-0',
	dropdown: {
		class: [
			// Flexbox
			'flex items-center justify-center',
			'shrink-0',

			// Color and Background
			'bg-transparent',
			'text-surface-500',

			// Size
			'w-12',

			// Shape
			'rounded-r-md',
		],
	},
	overlay: {
		class: [
			// Size
			'max-w-[calc(100vw-2rem)]',

			// Colors
			'bg-surface-0 dark:bg-dark-700',
			'text-surface-700 dark:text-white/80',

			// Shape
			'border border-surface-300 dark:border-dark-600',
			'rounded-md',
			'shadow-md',
			'mt-[2px]',
		],
	},
	header: {
		class: [
			// Flex
			'flex items-center justify-between',

			// Spacing
			'pt-2 px-4 pb-0 gap-2',
			'm-0',

			// Shape
			'border-b-0',
			'rounded-tl-md',
			'rounded-tr-md',

			// Color
			'text-surface-700 dark:text-white/80',
			'bg-surface-0 dark:bg-dark-700',
			'border-surface-300 dark:border-dark-600',

			'[&_[data-pc-name=pcfiltercontainer]]:!flex-auto',
			'[&_[data-pc-name=pcfilter]]:w-full',
		],
	},
	listContainer: {
		class: [
			// Sizing
			'max-h-[200px]',

			// Misc
			'overflow-auto',
		],
	},
	list: {
		class: 'p-1 list-none m-0',
	},
	option: ({ context }) => ({
		class: [
			'relative',
			'flex items-center',

			// Font
			'leading-none',

			// Spacing
			'm-0 px-3 py-2 gap-2',
			'first:mt-0 mt-[2px]',

			// Shape
			'border-0 rounded',

			// Colors and States
			{
				'bg-surface-100 dark:bg-dark-600': context.focused && !context.selected,
				'text-bluegray-900 hover:bg-surface-100 dark:text-surface-0 dark:hover:bg-dark-600': !context.selected,
				'text-bluegray-900 dark:text-surface-0': context.selected,
			},

			// Transition
			'transition-shadow duration-200',

			// Misc
			'cursor-pointer overflow-hidden whitespace-nowrap',
		],
	}),
	optionGroup: {
		class: [
			'font-semibold',

			// Spacing
			'm-0 py-2 px-3',

			// Colors
			'text-surface-400 dark:text-surface-500',

			// Misc
			'cursor-auto',
		],
	},
	emptyMessage: {
		class: [
			// Font
			'leading-none',

			// Spacing
			'py-2 px-3',

			// Color
			'text-surface-800 dark:text-white/80',
			'bg-transparent',
		],
	},
	loadingIcon: {
		class: 'text-surface-400 dark:text-surface-500 animate-spin',
	},
	transition: {
		enterFromClass: 'opacity-0 scale-y-[0.8]',
		enterActiveClass: 'transition-[transform,opacity] duration-[120ms] ease-[cubic-bezier(0,0,0.2,1)]',
		leaveActiveClass: 'transition-opacity duration-100 ease-linear',
		leaveToClass: 'opacity-0',
	},
};
