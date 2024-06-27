export default {
	root: {
		class: [
			// Shape
			'rounded-md',

			// Size
			'min-w-[12rem]',
			// 'p-1',

			// Colors
			'bg-surface-0 dark:bg-dark-700',
			'border border-surface-200 dark:border-dark-300',
		],
	},
	menu: {
		class: [
			// Spacings and Shape
			'list-none',
			'm-0',
			'p-0',
			'outline-none',
		],
	},
	menuitem: {
		class: 'text-bluegray-700 dark:text-white relative my-[2px] [&:first-child]:mt-0 [&:last-child]:mb-0',
	},
	content: ({ context }) => ({
		class: [
			// Shape
			'rounded-[4px]',

			// Transitions
			'transition-shadow',
			'duration-200',

			// States
			{
				'hover:bg-surface-100 dark:hover:bg-[rgba(255,255,255,0.03)]': !context.active,
				'hover:bg-primary-highlight-hover text-primary-highlight-inverse': context.active,
			},

			// Disabled
			{ 'opacity-60 pointer-events-none cursor-default': context.disabled },
		],
	}),
	action: {
		class: [
			'relative',
			// Flexbox

			'flex',
			'items-center',

			// Spacing
			'py-3',
			'px-4',

			// Misc
			'no-underline',
			'overflow-hidden',
			'cursor-pointer',
			'select-none',
		],
	},
	icon: {
		class: [
			// Spacing
			'mr-2',
		],
	},
	label: {
		class: [ 'leading-none' ],
	},
	submenuicon: {
		class: [
			// Position
			'ml-auto',
		],
	},
	submenu: {
		class: [
			// Spacing
			// 'p-1',
			'm-0',
			'list-none',
			'min-w-[12.5rem]',

			// Shape
			'shadow-none sm:shadow-md',
			'border border-surface-200 dark:border-dark-300',

			// Position
			'static sm:absolute',
			'z-10',

			// Color
			'bg-surface-0 dark:bg-dark-700',
		],
	},
	separator: {
		class: 'border-t border-surface-200 dark:border-dark-300 my-[2px]',
	},
};
