<template>
	<div
		ref="wrapperRef"
		class="ease-in-out"
		:class="{ 'transition-all': isExpanding, [`duration-${props.duration}`]: isExpanding, 'overflow-hidden': isExpanding }"
		:style="{ height: wrapperHeight, maxHeight: wrapperHeight }"
	>
		<slot/>
	</div>
</template>

<script setup lang="ts">
	const wrapperRef = ref<HTMLDivElement | null>(null);
	const wrapperHeight = ref('auto');
	const initialWrapperHeight = ref('auto');
	const isExpanding = ref(false);

	const props = defineProps({
		duration: {
			type: Number,
			default: 500,
		},
	});

	const expanded = defineModel('expanded', {
		type: Boolean,
		default: false,
	});

	onMounted(() => {
		if (wrapperRef.value) {
			const initialHeight = `${wrapperRef.value.scrollHeight}px`;
			initialWrapperHeight.value = initialHeight;
			wrapperHeight.value = initialHeight;
		}
	});

	watch(expanded, () => {
		isExpanding.value = true;

		setTimeout(() => {
			isExpanding.value = false;
		}, props.duration);
	});

	watch(expanded, () => {
		updateWrapperHeight();
	}, { flush: 'post' });

	const windowSize = useWindowSize();

	watch(windowSize.width, () => {
		updateWrapperHeight(true);
	}, { flush: 'post' });

	const updateWrapperHeight = async (onResize: boolean = false) => {
		if (!wrapperRef.value) {
			return;
		}

		// Reset the state on window resize as the initial content height might change.
		if (onResize) {
			expanded.value = false;
			initialWrapperHeight.value = 'auto';
			wrapperHeight.value = 'auto';
			await nextTick();
			initialWrapperHeight.value = `${wrapperRef.value.scrollHeight}px`;
		}

		if (expanded.value) {
			wrapperHeight.value = `${wrapperRef.value.scrollHeight}px`;
		} else {
			wrapperHeight.value = initialWrapperHeight.value;
		}
	};
</script>
