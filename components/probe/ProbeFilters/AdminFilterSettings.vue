<template>
	<div class="flex flex-col gap-2">
		<span class="flex items-center font-bold">Adoption status:</span>
		<Select
			v-model="usedFilter.adoption"
			:options="ADOPTION_OPTIONS"
			class="min-w-48"
			@change="onChange"
		>
			<template #value="{value}">
				{{ value[0].toUpperCase() + value.slice(1) }}
			</template>
			<template #option="{option}">
				{{ option[0].toUpperCase() + option.slice(1) }}
			</template>
		</Select>
	</div>
</template>

<script setup lang="ts">
	import { useProbeFilters, ADOPTION_OPTIONS, type Filter } from '~/composables/useProbeFilters';

	const filter = defineModel('filter', { required: false, type: Object as PropType<Filter> });

	const { filter: appliedFilter, onParamChange } = useProbeFilters();
	const usedFilter = computed(() => filter.value ?? appliedFilter.value);

	// only apply changes if the default (shared) filter is used
	const onChange = filter.value ? () => {} : onParamChange;
</script>
