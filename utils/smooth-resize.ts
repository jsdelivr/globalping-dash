/**
 * Smoothly transitions height of the wrapper from height of currentChild to height of newChild.
 * @param wrapper - Parent HTML element, should have `box-content overflow-hidden transition-[height] duration-500` properties.
 * @param currentChild - Current child of the wrapper. should be the only visible child.
 * @param newChild - New child of the wrapper, it can be currentChild itself, but resized. Should be the only visible child.
 */
export const smoothResize = (wrapper: Element, currentChild: Element, newChild: Element) => {
	const parent = wrapper as HTMLElement;
	parent.style.height = currentChild.scrollHeight + 'px';

	requestAnimationFrame(() => {
		// Remove "height" from the wrapper's inline styles, so it's height doesn't remain fixed.
		wrapper.addEventListener('transitionend', () => {
			parent.style.height = '';
		}, { once: true });

		parent.style.height = newChild.scrollHeight + 'px';
	});
};
