<template>
	<div ref="wrapperRef" class="flex h-full flex-wrap items-center">
		<Tag v-for="tag in tags.slice(0, numberOfTagsToShow)" :key="tag" class="my-0.5 mr-1 flex text-nowrap bg-surface-0 py-0.5 font-normal dark:bg-dark-800" severity="secondary" :value="tag"/>
		<Tag
			v-if="tags.length > numberOfTagsToShow"
			key="other"
			v-tooltip.top="tags.slice(numberOfTagsToShow).join(', ')"
			class="my-0.5 mr-1 flex text-nowrap bg-surface-0 py-0.5 font-normal dark:bg-dark-800"
			severity="secondary"
			:value="`+${tags.length - numberOfTagsToShow}`"
		/>
	</div>
</template>

<script setup lang="ts">
	const props = defineProps({
		tags: {
			type: Array as PropType<string[]>,
			required: true,
		},
		wrapper: {
			type: Object as PropType<HTMLElement | SVGElement | null | undefined>,
			default: null,
		},
	});

	// Calculate the number of tags to show, based on the expected average character width <= 8 px (in two rows).
	const getNumberOfTagsToShow = (elem: HTMLElement | SVGElement | null | undefined) => {
		const { width } = useElementSize(elem || useParentElement(wrapperRef));

		return computed(() => {
			const charWidth = 8;
			const maxChars = width.value * 2 / charWidth;
			let length = 0;

			for (let i = 0; i < props.tags.length; i++) {
				if (length + props.tags[i].length > maxChars) {
					return Math.max(1, i);
				}

				length += props.tags[i].length;
			}

			return props.tags.length;
		});
	};

	const wrapperRef = ref();
	const numberOfTagsToShow = getNumberOfTagsToShow(props.wrapper);
</script>
