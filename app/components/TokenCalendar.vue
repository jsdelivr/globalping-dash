<template>
	<div>
		<DatePicker
			:min-date="new Date()"
			:model-value="props.value"
			inline
			prev-icon="pi pi-arrow-left"
			next-icon="pi pi-arrow-right"
			@update:model-value="(date) => emit('change', date || null)"
		/>
	</div>
</template>

<script setup lang="ts">
	const props = defineProps({
		value: {
			type: Object as () => Date | null,
			default: null,
		},
	});

	const emit = defineEmits([ 'change' ]);
</script>
