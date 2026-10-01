<template>
	<PeriodPicker
		v-model="selectedOption"
		:options="periodOptions"
		:trigger-label="typeof filter.period.month !== 'undefined' ? 'Month' : 'Year'"
		accessibility-label="Credits period"
		searchable
	/>
</template>

<script setup lang="ts">
	import { type PeriodOption, useCreditsFilters } from '~/composables/useCreditsFilters';

	const { filter, onParamChange, directusDateQuery, periodOptions } = useCreditsFilters();

	const getInitialOption = (): PeriodOption => {
		return periodOptions.value
			.find(opt => (opt.value.year === filter.value.period.year) && (opt.value.month === filter.value.period.month)) || periodOptions.value[0]!;
	};

	const selectedOption = ref(getInitialOption());

	watch(directusDateQuery, () => {
		selectedOption.value = getInitialOption();
	}, { immediate: true });

	watch(selectedOption, () => {
		filter.value.period = { ...selectedOption.value.value };
		onParamChange([ 'period' ], false);
	});
</script>
