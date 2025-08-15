/**
 * Ensures the returned promise settles no earlier than `delay` ms after this function is called.
 * @param promise - The promise to mirror.
 * @param delay - Minimum total time (in ms) before the returned promise settles (default 250ms).
 */
export const minDelay = async <T>(promise: Promise<T>, delay: number = 250): Promise<T> => {
	const start = Date.now();

	try {
		return await promise;
	} finally {
		const end = Date.now();
		const diff = end - start;

		if (diff < delay) {
			await new Promise(resolve => setTimeout(resolve, delay - diff));
		}
	}
};
