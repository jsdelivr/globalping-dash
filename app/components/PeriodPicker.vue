<template>
	<div class="relative">
		<Select
			v-model="selectedOption"
			:options="filteredOptions"
			class="group flex cursor-pointer rounded-xl border bg-surface-200 p-0 font-bold text-surface-900 ease-out hover:bg-surface-300 dark:bg-dark-700 dark:text-white dark:hover:bg-dark-600"
			:pt="{
				label: { class: '!p-1' },
				listContainer: { tabindex: -1 },
				dropdown: { class: '!pr-2 !w-10' },
			}"
			:pt-options="{ mergeProps: true }"
			option-label="label"
			append-to="self"
			panel-class="period-picker-panel min-w-[12rem] !left-auto !right-0 font-normal"
			:aria-label="accessibilityLabel"
			@before-hide="filterInput = ''"
		>
			<template #value="slotProps">
				<div class="flex min-h-7 items-center gap-4">
					<span class="contents items-center gap-1 rounded-lg border bg-white px-2 py-1 text-sm duration-200 md:flex dark:bg-dark-500 dark:group-hover:bg-dark-400">
						<i class="pi pi-calendar max-md:pl-3"/>
						<span class="max-md:hidden">{{ triggerLabel }}</span>
					</span>
					<span class="flex-1 text-center">{{ slotProps.value.label }}</span>
				</div>
			</template>

			<template v-if="searchable" #header>
				<div class="flex flex-col">
					<div class="m-2 flex items-center gap-2 rounded-md border px-3 py-2 ring-primary focus-within:ring-1 dark:bg-dark-800">
						<i class="pi pi-search"/>
						<input
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
						'with-separator': slotProps.option.withSeparator,
					}">
					{{ slotProps.option.label }}
				</span>
			</template>
		</Select>
	</div>
</template>

<script setup lang="ts" generic="T">
	type PeriodPickerOption<T> = {
		label: string;
		value: T;
		withSeparator?: boolean;
	};

	const props = withDefaults(defineProps<{
		options: PeriodPickerOption<T>[];
		triggerLabel: string;
		accessibilityLabel: string;
		searchable?: boolean;
	}>(), {
		searchable: false,
	});
	const selectedOption = defineModel<PeriodPickerOption<T>>({ required: true });
	const filterInput = ref('');

	const filteredOptions = computed(() => {
		if (props.searchable && filterInput.value) {
			const search = filterInput.value.toLowerCase();
			return props.options.filter(option => option.label.toLowerCase().includes(search)).map(option => ({ ...option, withSeparator: false }));
		}

		return props.options;
	});
</script>

<style>
	.period-picker-panel li:has(.with-separator):not(:last-child) {
		@apply mb-3 relative overflow-visible my-[1px];
	}

	.period-picker-panel li:has(.with-separator):not(:last-child):before {
		@apply content-[""] absolute -bottom-1.5 left-0 w-full h-px bg-surface-200 dark:bg-dark-500;
	}
</style>
