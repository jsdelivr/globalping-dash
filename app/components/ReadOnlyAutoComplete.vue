<template>
	<AutoComplete
		class="pointer-events-auto cursor-auto select-auto bg-transparent dark:bg-transparent"
		chip-icon="hidden"
		multiple
		disabled
		:pt="merge({
			inputChip: { class: 'hidden' },
			inputMultiple: {
				class: 'pb-1 pr-9 min-h-10',
				// Tabindex should be unset; otherwise, Copying of the selected value is not working.
				tabindex: ''
			},
			chipItem: { class: 'mt-1' },
		}, pt)"
		:pt-options="{ mergeProps: true }"
		:typeahead="false"
	/>
</template>

<script setup lang="ts">
	import merge from 'lodash/merge';

	defineProps({
		pt: {
			type: Object as PropType<{
				inputMultiple?: Record<string, unknown>;
				inputChip?: Record<string, unknown>;
				chipItem?: Record<string, unknown>;
				[field: string]: unknown;
			}>,
			default: () => ({}),
		},
	});
</script>
