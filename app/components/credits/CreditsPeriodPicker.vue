<template>
	<div class="relative">
		<Select
			v-model="selectedOption"
			:options="filteredOptions"
			class="group flex cursor-pointer rounded-xl border bg-surface-200 p-0 font-bold text-surface-900 ring-primary ease-out focus-within:ring-1 hover:bg-surface-300 dark:bg-dark-700 dark:text-white dark:hover:bg-dark-600"
			:pt="{
				root: { class: 'duration-200' },
				label: { class: 'p-1 focus:outline-none' },
				listContainer: { tabindex: -1 },
			}"
			option-label="label"
			append-to="self"
			panel-class="pv-select-panel min-w-[12rem] !left-auto !right-0 font-normal"
			@before-hide="filterInput = ''"
		>
			<template #value="slotProps">
				<div class="flex min-h-7 items-center gap-2 max-md:-mr-3">
					<span class="flex items-center gap-1 rounded-lg border bg-white px-2 py-1 text-sm duration-200 max-md:hidden dark:bg-dark-500 dark:group-hover:bg-dark-400">
						<i class="pi pi-calendar"/>
						{{ typeof filter.period.month !== 'undefined' ? 'Month' : 'Year' }}
					</span>
					<span class="pl-3 md:hidden">
						<i class="pi pi-calendar"/>
					</span>
					<span class="flex-1 text-center md:pl-4">{{ slotProps.value.label }}</span>
				</div>
			</template>

			<template #header>
				<div class="flex flex-col">
					<div class="m-2 flex items-center gap-2 rounded-md border px-3 py-2 ring-primary focus-within:ring-1 dark:bg-dark-800">
						<i class="pi pi-search"/>
						<input
							ref="filterRef"
							v-model="filterInput"
							class="flex-1 bg-transparent text-sm outline-none focus:ring-0"
							placeholder="Filter periods">
					</div>
					<div class="mb-0.5 h-px w-full bg-surface-200 dark:bg-dark-500"/>
				</div>
			</template>

			<template #option="slotProps">
				<span
					class="ml-auto block w-full py-1 text-end"
					:class="{
						'text-surface-600 dark:text-surface-400': selectedOption.label !== slotProps.option.label,
						'font-bold text-black dark:text-white': selectedOption.label === slotProps.option.label,
						'with-separator': slotProps.option.withSeparator
					}">
					{{ slotProps.option.label }}
				</span>
			</template>
		</Select>
	</div>
</template>

<script setup lang="ts">
	import { type PeriodOption, useCreditsFilters } from '~/composables/useCreditsFilters';

	const { filter, onParamChange, directusDateQuery, periodOptions } = useCreditsFilters();
	const filterInput = ref('');

	const filteredOptions = computed(() => {
		if (filterInput.value) {
			const search = filterInput.value.toLowerCase();
			return periodOptions.value.filter(opt => opt.label.toLowerCase().includes(search)).map(opt => ({ ...opt, withSeparator: false }));
		}

		return periodOptions.value;
	});

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

<style>
	.pv-select-panel li:has(.with-separator):not(:last-child) {
		@apply mb-3 relative overflow-visible my-[1px];
	}

	.pv-select-panel li:has(.with-separator):not(:last-child):before {
		@apply content-[""] absolute -bottom-1.5 left-0 w-full h-px bg-surface-200 dark:bg-dark-500;
	}
</style>
