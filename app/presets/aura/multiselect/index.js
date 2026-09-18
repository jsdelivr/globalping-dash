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
			'flex flex-col overflow-hidden max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-1rem)]',
			'bg-surface-0 dark:bg-dark-700',
			'text-surface-700 dark:text-white/80',
			'border border-surface-300 dark:border-dark-600 rounded-lg',
			'!mt-0 shadow-[0_10px_30px_rgb(23_35_58_/_0.10)]',
		],
	},
	header: {
		class: [
			'flex shrink-0 items-center gap-2 mx-2 mt-3 mb-2',
			'text-surface-700 dark:text-white/80',
		],
	},
	pcFilterContainer: {
		root: { class: 'min-w-0 flex-auto' },
	},
	pcFilter: ({ props }) => ({
		root: ({ global }) => ({
			...global,
			'aria-label': props.filterPlaceholder,
			'class': [
				global.class,
				'w-full !py-2 !pl-9 !pr-3 !text-sm !bg-surface-50 dark:!bg-dark-800',
				'[&[aria-activedescendant]]:!ring-0',
			],
		}),
	}),
	pcFilterIconContainer: {
		root: { class: '!left-3 !right-auto text-bluegray-400' },
	},
	listContainer: {
		class: 'dark-scrollbar min-h-0 overflow-auto overscroll-contain',
	},
	list: {
		class: 'list-none m-0 px-2 pb-2 pt-0',
	},
	option: ({ context }) => ({
		class: [
			'relative flex items-center min-h-9 gap-2.5 m-0 px-2.5 py-2',
			'leading-none border-0 rounded',
			'text-bluegray-900 dark:text-surface-0',
			{
				'bg-emerald-50 dark:bg-transparent': context.selected && !context.focused,
				'bg-emerald-100': context.selected && context.focused,
				'bg-surface-100': !context.selected && context.focused,
				'dark:bg-dark-600': context.focused,
				'hover:bg-emerald-100': context.selected && !context.disabled,
				'hover:bg-surface-100': !context.selected && !context.disabled,
				'dark:hover:bg-dark-600': !context.disabled,
				'opacity-50 cursor-default': context.disabled,
				'cursor-pointer': !context.disabled,
			},
			'overflow-hidden whitespace-nowrap select-none',
		],
	}),
	pcOptionCheckbox: {
		root: ({ global }) => ({ ...global, class: [ global.class, 'shrink-0' ] }),
	},
	optionLabel: {
		class: 'min-w-0 truncate',
	},
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
