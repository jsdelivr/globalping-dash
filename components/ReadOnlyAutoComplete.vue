<template>
	<AutoComplete
		class="pointer-events-auto cursor-auto select-auto bg-transparent dark:bg-transparent"
		chip-icon="hidden"
		multiple
		disabled
		:pt="merge(pt, {
			// Tabindex should be unset, otherwise Copying of the selected value is not working.
			inputMultiple: {tabindex: ''},
		})"
		:pt-options="{ mergeProps: true }"
		:typeahead="false"
	/>
</template>

<script setup lang="ts">
	import merge from 'lodash/merge';

	defineProps({
		pt: {
			type: Object as PropType<{
				inputMultiple?: Record<string, unknown>,
				[field: string]: unknown
			}>,
			default: () => ({}),
		},
	});
</script>
