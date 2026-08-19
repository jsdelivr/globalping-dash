<template>
	<Select
		v-model="selectedPeriod"
		:options="periodOptions"
		option-label="label"
		option-value="value"
		append-to="self"
		panel-class="min-w-40 !left-auto !right-0"
		aria-label="Sponsorship period"
		class="group flex cursor-pointer rounded-xl border bg-surface-200 p-0 font-bold text-surface-900 ease-out hover:bg-surface-300 dark:bg-dark-700 dark:text-white dark:hover:bg-dark-600"
		:pt="{
			label: { class: '!p-1' },
			dropdown: { class: '!pr-2 !w-10' },
		}"
		:pt-options="{ mergeProps: true }"
	>
		<template #value="slotProps">
			<div class="flex min-h-7 items-center gap-4">
				<span class="flex items-center gap-1 rounded-lg border bg-white px-2 py-1 text-sm duration-200 max-md:hidden dark:bg-dark-500 dark:group-hover:bg-dark-400">
					<i class="pi pi-calendar"/>Period
				</span>
				<i class="pi pi-calendar pl-3 md:hidden"/>
				<span class="flex-1 text-center">{{ selectedLabel(slotProps.value) }}</span>
			</div>
		</template>
		<template #option="slotProps">
			<span class="ml-auto block w-full py-1 text-end">{{ slotProps.option.label }}</span>
		</template>
	</Select>
</template>

<script setup lang="ts">
	import { useSponsorsPeriod } from '~/composables/useSponsorsPeriod';

	const { period, periodOptions, setPeriod } = useSponsorsPeriod();
	const selectedPeriod = computed({
		get: () => period.value,
		set: (value: SponsorsPeriod) => setPeriod(value),
	});
	const selectedLabel = (value: SponsorsPeriod) => periodOptions.value.find(option => option.value === value)?.label || 'Past year';
</script>
