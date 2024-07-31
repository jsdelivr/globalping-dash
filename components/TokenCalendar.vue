<template>
	<div>
		<DatePicker
			:min-date="new Date()"
			:model-value="value"
			inline
			prev-icon="pi pi-arrow-left"
			next-icon="pi pi-arrow-right"
			@update:model-value="(date: Date) => emit('change', date)"
		/>
	</div>
</template>

<script setup lang="ts">
	defineProps({
		value: {
			type: [ Date, null, undefined ],
			default: null,
		},
	});

	const emit = defineEmits([ 'change' ]);
</script>
