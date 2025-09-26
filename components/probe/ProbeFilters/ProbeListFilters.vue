<template>
	<div class="ml-auto flex h-9 items-stretch gap-x-2 self-end font-normal">
		<span class="flex items-center font-bold">Status:</span>
		<Select
			v-model="filter.status"
			:options="STATUS_CODES"
			:pt="{ listContainer: { class: '!max-h-64' } }"
			option-label="code"
			class="min-w-64"
			@change="onParamChange"
		>
			<template #option="{option}: {option: StatusCode}">
				<span class="flex h-full items-center gap-2">
					<span
						:class="{
							'font-bold text-bluegray-900 dark:text-white': option === filter.status,
							'text-bluegray-400': option !== filter.status
						}">
						{{ STATUS_MAP[option].name }}
					</span>
					<Tag
						class="-my-0.5"
						:class="{
							'bg-primary text-white dark:bg-white dark:text-bluegray-900 ': option === filter.status,
							'border border-surface-300 bg-surface-0 text-bluegray-900 dark:border-dark-600 dark:bg-dark-800 dark:text-surface-0': option !== filter.status
						}">
						{{ statusCounts[option] }}
					</Tag>
				</span>
			</template>

			<template #value="{value}: {value: StatusCode}">
				<span class="flex h-full items-center gap-2">
					<span class="text-bluegray-400">{{ STATUS_MAP[value].name }}</span>
					<Tag class="-my-1 border ">{{ statusCounts[value] }}</Tag>
				</span>
			</template>
		</Select>
		<InputGroup class="!w-auto">
			<IconField>
				<InputIcon class="pi pi-search"/>
				<InputText v-model="searchInput" class="m-0 h-full min-w-[280px]" placeholder="Filter by name, location, or tags" @input="onFilterChangeDebounced"/>
			</IconField>
		</InputGroup>

		<div v-if="auth.isAdmin" class="flex size-9 items-stretch justify-between rounded-md border border-surface-300 text-bluegray-700 focus-within:border-primary hover:border-surface-400 dark:border-dark-600 dark:bg-dark-900 dark:text-dark-0 dark:hover:border-dark-400">
			<Button
				class="relative hover:bg-white focus:ring-primary dark:hover:bg-dark-900 dark:focus:ring-primary"
				severity="secondary"
				size="small"
				text
				@click="adminOptsRef.toggle($event)">
				<i class="pi pi-sliders-h"/>
				<i v-if="!isDefault('adoption')" class="pi pi-circle-fill absolute right-2 top-2 text-[0.4rem] text-primary"/>
			</Button>

			<Popover ref="adminOptsRef" class="w-fit gap-4 p-4 [&>*]:border-none" role="dialog">
				<AdminFilterSettings/>
			</Popover>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { aggregate } from '@directus/sdk';
	import debounce from 'lodash/debounce';
	import AdminFilterSettings from '~/components/probe/ProbeFilters/AdminFilterSettings.vue';
	import { useErrorToast } from '~/composables/useErrorToast';
	import { STATUS_MAP, type StatusCode, useProbeFilters } from '~/composables/useProbeFilters';
	import { useAuth } from '~/store/auth';

	const auth = useAuth();
	const { $directus } = useNuxtApp();

	const active = ref(true);
	const { filter, onParamChange, onFilterChange, getDirectusFilter, isDefault } = useProbeFilters({ active });
	const searchInput = ref(filter.value.search);
	const onFilterChangeDebounced = debounce(() => onFilterChange(searchInput.value), 500);
	const filterDeps = computed(() => ({ ...filter.value }));

	const adminOptsRef = ref();
	const STATUS_CODES = Object.keys(STATUS_MAP) as StatusCode[];

	const { data: statusCounts, error: statusCntError } = await useLazyAsyncData(
		() => $directus.request<[{ count: number; status: Status; isOutdated: boolean }]>(aggregate('gp_probes', {
			query: {
				filter: getDirectusFilter(filter, [ 'status' ]),
				groupBy: [ 'status', 'isOutdated' ],
			},
			aggregate: { count: '*' },
		})),
		{
			watch: [ filterDeps ],
			default: () => Object.fromEntries(STATUS_CODES.map(status => [ status, 0 ])),
			transform: (data) => {
				const counts = Object.fromEntries(STATUS_CODES.map(status => [ status, 0 ]));

				STATUS_CODES.forEach((code) => {
					counts[code] = data.reduce((sum, status) => {
						return STATUS_MAP[code].options.includes(status.status) && (status.isOutdated || !STATUS_MAP[code].outdatedOnly)
							? sum + status.count
							: sum;
					}, 0);
				});

				return counts;
			},
		},
	);

	useErrorToast(statusCntError);

	onBeforeUnmount(() => {
		onFilterChangeDebounced.cancel();
	});

	onBeforeRouteLeave(() => {
		active.value = false;
	});
</script>
