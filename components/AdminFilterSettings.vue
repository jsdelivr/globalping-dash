<template>
	<div class="flex flex-col gap-2">
		<span class="flex items-center font-bold">Ownership status:</span>
		<Select
			v-model="usedFilter.adoption"
			:options="ADOPTION_OPTIONS"
			:pt="{ listContainer: { class: '!max-h-64' } }"
			class="min-w-48"
			@change="onParamChange"
		>
			<template #value="{value}: {value: AdoptionOption}">
				<span class="flex h-full items-center gap-2">
					<span class="text-bluegray-400">
						{{ value[0]!.toUpperCase() + value.slice(1) }}
					</span>
					<Tag v-if="adoptedCounts" class="-my-0.5 border border-surface-300 bg-surface-0 text-bluegray-900 dark:border-dark-600 dark:bg-dark-800 dark:text-surface-0">
						{{ adoptedCounts[value] }}
					</Tag>
				</span>
			</template>
			<template #option="{option}: {option: AdoptionOption}">
				<span class="flex h-full items-center gap-2">
					<span
						:class="{
							'font-bold text-bluegray-900 dark:text-white': option === usedFilter.adoption,
							'text-bluegray-400': option !== usedFilter.adoption
						}">
						{{ option[0]!.toUpperCase() + option.slice(1) }}
					</span>
					<Tag
						v-if="adoptedCounts"
						class="-my-0.5"
						:class="{
							'bg-primary text-white dark:bg-white dark:text-bluegray-900 ': option === usedFilter.adoption,
							'border border-surface-300 bg-surface-0 text-bluegray-900 dark:border-dark-600 dark:bg-dark-800 dark:text-surface-0': option !== usedFilter.adoption
						}">
						{{ adoptedCounts[option] }}
					</Tag>
				</span>
			</template>
		</Select>
	</div>
</template>

<script setup lang="ts">
	import { aggregate } from '@directus/sdk';
	import {
		useProbeFilters,
		ADOPTION_OPTIONS,
		type AdoptionOption,
		type Filter,
	} from '~/composables/useProbeFilters';

	const { filter: propFilter } = defineProps({
		filter: {
			required: false,
			type: Object as PropType<Filter>,
			default: null,
		},
	});

	const { $directus } = useNuxtApp();
	const active = ref(true);

	const { filter: appliedFilter, onParamChange, getCurrentFilter } = useProbeFilters({ active });
	const filterDeps = computed(() => ({ ...appliedFilter.value }));

	const usedFilter = computed(() => propFilter ?? appliedFilter.value);

	const { data: adoptedCounts } = await useLazyAsyncData(
		() => $directus.request<[{ count: number; userId: string }]>(aggregate('gp_probes', {
			query: {
				filter: {
					...getCurrentFilter([ 'adoption' ]),
				},
				groupBy: [ 'userId' ],
			},
			aggregate: { count: '*' },
		})),
		{
			watch: [ filterDeps ],
			transform: (data) => {
				const { adopted, nonAdopted } = data.reduce((acc, res) => {
					if (res.userId) {
						acc.adopted += res.count;
					} else {
						acc.nonAdopted += res.count;
					}

					return acc;
				}, { adopted: 0, nonAdopted: 0 });

				return { adopted, 'non-adopted': nonAdopted, 'all': adopted + nonAdopted };
			},
		},
	);

	onBeforeRouteLeave(() => {
		active.value = false;
	});
</script>
