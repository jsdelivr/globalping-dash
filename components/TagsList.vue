<template>
	<div class="flex h-full flex-wrap items-center">
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
	defineProps({
		tags: {
			type: Array as PropType<string[]>,
			default: () => [],
		},
		numberOfTagsToShow: {
			type: Number,
			default: 5,
		},
	});
</script>
