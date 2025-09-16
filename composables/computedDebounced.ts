export const computedDebounced = (source: MaybeRefOrGetter<unknown>, ms: number = 1, maxWait: number = 1000) => {
	const dependency = computed(() => toValue(source));

	return refDebounced(dependency, ms, {
		maxWait,
	});
};
