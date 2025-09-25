<template>
	<div class="flex flex-col gap-2">
		<span class="flex items-center font-bold">Adoption status:</span>
		<Select
			v-model="usedFilter.adoption"
			:options="ADOPTION_OPTIONS"
			:pt="{ listContainer: { class: '!max-h-64' } }"
			class="min-w-48"
			@change="onChange"
		>
			<template #value="{value}: {value: AdoptionOption}">
				{{ value[0]!.toUpperCase() + value.slice(1) }}
			</template>
			<template #option="{option}: {option: AdoptionOption}">
				{{ option[0]!.toUpperCase() + option.slice(1) }}
			</template>
		</Select>
	</div>
</template>

<script setup lang="ts">
	import {
		useProbeFilters,
		ADOPTION_OPTIONS,
		type AdoptionOption,
		type Filter,
	} from '~/composables/useProbeFilters';

	const props = defineProps({
		filter: {
			required: false,
			type: Object as PropType<Filter>,
			default: null,
		},
	});

	const { filter: appliedFilter, onParamChange } = useProbeFilters();
	const usedFilter = computed(() => props.filter ?? appliedFilter.value);
	const onChange = props.filter ? () => {} : onParamChange;
</script>
