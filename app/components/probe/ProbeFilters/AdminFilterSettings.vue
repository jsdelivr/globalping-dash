<template>
	<div class="flex flex-col gap-4">
		<div class="flex flex-col gap-2">
			<span class="flex items-center font-bold">Adoption status:</span>
			<Select
				v-model="usedFilter.adoption"
				:options="ADOPTION_OPTIONS"
				class="min-w-48"
				@change="onChange"
			>
				<template #value="{value}">
					{{upperFirst(value)}}
				</template>
				<template #option="{option}">
					{{upperFirst(option)}}
				</template>
			</Select>
		</div>
		<div class="flex flex-col gap-2">
			<span class="flex items-center font-bold">Probe type:</span>
			<Select
				v-model="usedFilter.probeType"
				:options="PROBE_TYPE_OPTIONS"
				class="min-w-48"
				@change="onChange"
			>
				<template #value="{value}">
					{{upperFirst(value)}}
				</template>
				<template #option="{option}">
					{{upperFirst(option)}}
				</template>
			</Select>
		</div>
	</div>
</template>

<script setup lang="ts">
	import upperFirst from 'lodash/upperFirst';
	import { useProbeFilters, ADOPTION_OPTIONS, type Filter, PROBE_TYPE_OPTIONS } from '~/composables/useProbeFilters';

	const filter = defineModel('filter', { required: false, type: Object as PropType<Filter> });

	const { filter: appliedFilter, onParamChange } = useProbeFilters();
	const usedFilter = computed(() => filter.value ?? appliedFilter.value);

	// only apply changes if the default (shared) filter is used
	const onChange = filter.value ? () => {} : onParamChange;
</script>
