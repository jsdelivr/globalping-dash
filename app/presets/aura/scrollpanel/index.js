export default {
	root: {
		class: 'group/scrollpanel relative flex min-h-0 flex-col overflow-hidden',
	},
	contentContainer: {
		class: [
			// Size & Position
			'flex min-h-0 flex-col',

			// Layering
			'z-[1]',

			// Spacing
			'overflow-hidden',

			// Misc
			'relative',
		],
	},
	content: {
		class: [
			// Size & Spacing
			'min-h-0',

			// Overflow & Scrollbar
			'overflow-auto overscroll-contain [scrollbar-width:none]',

			// Box Model
			'box-border',

			// Position
			'relative',

			// Webkit Specific
			'[&::-webkit-scrollbar]:hidden',
		],
	},
	barX: {
		class: [
			// Size & Position
			'h-3 bottom-0',

			// Appearance
			'rounded-full border-[3px] border-transparent bg-surface-300 bg-clip-padding hover:bg-surface-400 dark:bg-surface-600 dark:hover:bg-surface-500',

			// Interactivity
			'cursor-default',

			// Visibility & Layering
			'z-20 opacity-0 group-hover/scrollpanel:opacity-100 group-active/scrollpanel:opacity-100 focus:opacity-100 data-[p-scrollpanel-grabbed=true]:opacity-100 data-[p-scrollpanel-hidden=true]:hidden',

			// Transition
			'transition duration-150',

			// Misc
			'absolute !bottom-0',
			'focus:outline-none focus-visible:ring-1 focus-visible:ring-surface-500',
		],
	},
	barY: {
		class: [
			// Size & Position
			'w-3 top-0',

			// Appearance
			'rounded-full border-[3px] border-transparent bg-surface-300 bg-clip-padding hover:bg-surface-400 dark:bg-surface-600 dark:hover:bg-surface-500',

			// Interactivity
			'cursor-default',

			// Visibility & Layering
			'z-20 opacity-0 group-hover/scrollpanel:opacity-100 group-active/scrollpanel:opacity-100 focus:opacity-100 data-[p-scrollpanel-grabbed=true]:opacity-100 data-[p-scrollpanel-hidden=true]:hidden',

			// Transition
			'transition duration-150',

			// Misc
			'absolute !end-0',
			'focus:outline-none focus-visible:ring-1 focus-visible:ring-surface-500',
		],
	},
};
