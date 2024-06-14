<template>
	<div>
		<Calendar :model-value="value" inline @update:model-value="(date: Date) => emit('change', date)"/>
	</div>
</template>

<script setup lang="ts">
	defineProps({
		value: {
			type: Date,
			default: null,
		},
	});

	const emit = defineEmits([ 'change' ]);
</script>
