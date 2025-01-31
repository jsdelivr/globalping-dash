export default {
	content: {
		class: [
			'pt-2 text-sm font-normal leading-[18px] text-bluegray-900',
			'overflow-hidden',
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
};
