<template>
	<PeriodPicker
		v-model="selectedOption"
		:options="periodOptions"
		trigger-label="Period"
		accessibility-label="Sponsorship period"
	/>
</template>

<script setup lang="ts">
	import { useSponsorsPeriod } from '~/composables/useSponsorsPeriod';

	const { period, periodOptions, setPeriod } = useSponsorsPeriod();

	const selectedOption = computed({
		get: () => periodOptions.value.find(option => option.value === period.value) || periodOptions.value[0]!,
		set: option => setPeriod(option.value),
	});
</script>
