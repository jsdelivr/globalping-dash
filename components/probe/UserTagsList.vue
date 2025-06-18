<template>
	<div v-if="tags" class="flex w-full flex-wrap gap-1">
		<span
			v-for="(tag, index) in tags"
			:key="index"
			:class="[baseClass, customClass]"
			:title="`u-${tag.prefix}${tagFormat === 'v1' ? '-' : ':'}${tag.value}`"
		>
			<span class="block truncate">
				{{ `u-${tag.prefix}${tagFormat === 'v1' ? '-' : ':'}${tag.value}` }}
			</span>
		</span>

		<slot name="edit-button"/>
	</div>
</template>


<script setup lang="ts">
	type Tag = {
		prefix: string
		value?: string
		format?: string
	}

	const { tags, tagFormat, customClass } = defineProps({
		tags: {
			type: Array as PropType<Tag[]>,
			required: true,
		},
		tagFormat: {
			type: String,
			required: false,
			default: '',
		},
		customClass: {
			type: String,
			required: false,
			default: '',
		},
	});

	const baseClass = 'inline-flex h-6 max-w-full items-center overflow-hidden truncate rounded-md border border-surface-300 px-2 text-xs';
</script>
