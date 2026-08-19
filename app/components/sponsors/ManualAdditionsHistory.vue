<template>
	<section class="flex flex-col gap-4 border-t p-5">
		<div>
			<p class="text-sm text-bluegray-500">Manual payments and other credit adjustments added by administrators.</p>
		</div>
		<div class="flex items-center gap-2 max-md:w-full">
			<InputGroup class="!w-auto min-w-0 flex-1">
				<IconField class="w-full">
					<InputIcon class="pi pi-search"/>
					<InputText v-model="search" class="m-0 h-9 w-full" placeholder="Search additions" aria-label="Search manual additions"/>
				</IconField>
			</InputGroup>
			<Button class="relative h-9 shrink-0" label="Filters" severity="secondary" outlined @click="filtersPanel?.toggle($event)">
				<template #icon><i class="pi pi-sliders-h"/><i v-if="type !== 'all'" class="pi pi-circle-fill absolute left-7 top-1.5 text-[0.4rem] text-primary"/></template>
			</Button>
			<Popover ref="filtersPanel" class="w-80 p-4 [&>*]:border-none" role="dialog">
				<div class="flex flex-col gap-3">
					<h4 class="font-bold">Filter manual additions</h4>
					<label for="manualAdditionType" class="font-bold">Type</label>
					<Select
						id="manualAdditionType"
						v-model="type"
						:options="typeOptions"
						option-label="label"
						option-value="value"
						aria-label="Manual addition types"
						class="!w-full min-w-0"/>
				</div>
			</Popover>
		</div>

		<DataTable
			class="max-md:hidden"
			:value="result.items"
			lazy
			:first="first"
			:rows="itemsPerPage"
			:total-records="result.total"
			:loading="pending"
			:sort-field="sortField"
			:sort-order="sortOrder"
			data-key="id"
			@sort="onSort"
		>
			<Column field="date" header="Date" sortable class="min-w-28">
				<template #body="{ data }">{{ formatUtcDateForTable(data.date) }}</template>
			</Column>
			<Column field="sponsor" header="Recipient" sortable class="min-w-32">
				<template #body="{ data }">
					<span class="inline-flex items-center gap-1.5">
						<a v-if="data.githubLogin" class="font-semibold text-primary hover:underline" :href="`https://github.com/${data.githubLogin}`" target="_blank" rel="noopener">{{ data.githubLogin }}</a>
						<span v-else>GitHub ID {{ data.githubId }}</span>
						<i v-if="data.dashboardUserId" v-tooltip.top="'Dashboard account linked'" class="pi pi-user text-xs text-bluegray-400" aria-label="Dashboard account linked"/>
					</span>
				</template>
			</Column>
			<Column field="type" header="Type and details" sortable class="min-w-52">
				<template #body="{ data }">
					<div class="flex flex-col items-start gap-1">
						<Tag :value="typeLabel(data.type)" :severity="data.type === 'payment' ? 'warn' : 'secondary'"/>
						<small class="text-bluegray-500">{{ data.type === 'payment' ? `${formatMoney(data.amountInDollars || 0)} payment` : data.comment || '—' }}</small>
					</div>
				</template>
			</Column>
			<Column field="credits" header="Credits" sortable class="min-w-24">
				<template #body="{ data }">{{ formatNumber(data.credits) }}</template>
			</Column>
			<Column field="addedBy" header="Added by" sortable class="min-w-28">
				<template #body="{ data }">{{ data.addedBy || 'System' }}</template>
			</Column>
			<template #empty><div class="p-6 text-center">{{ emptyMessage }}</div></template>
		</DataTable>

		<div class="relative flex w-full flex-col gap-2 md:hidden">
			<div v-if="pending" class="flex h-32 items-center justify-center"><i class="pi pi-spin pi-spinner text-xl"/></div>
			<template v-else-if="result.items.length">
				<article v-for="addition in result.items" :key="addition.id" class="rounded-xl border bg-white p-4 dark:bg-dark-800">
					<div class="flex items-start justify-between gap-3">
						<div>
							<div class="text-sm text-bluegray-500">{{ formatUtcDateForTable(addition.date) }}</div>
							<a v-if="addition.githubLogin" class="mt-1 inline-block font-semibold text-primary hover:underline" :href="`https://github.com/${addition.githubLogin}`" target="_blank" rel="noopener">{{ addition.githubLogin }}</a>
							<span v-else class="mt-1 inline-block font-semibold">GitHub ID {{ addition.githubId }}</span>
						</div>
						<div class="text-right font-semibold">{{ formatNumber(addition.credits) }} credits</div>
					</div>
					<div class="mt-3 flex items-center gap-2"><Tag :value="typeLabel(addition.type)" :severity="addition.type === 'payment' ? 'warn' : 'secondary'"/><span class="text-sm">{{ addition.type === 'payment' ? `${formatMoney(addition.amountInDollars || 0)} payment` : addition.comment }}</span></div>
					<div class="mt-2 text-xs text-bluegray-500">Added by {{ addition.addedBy || 'System' }}</div>
				</article>
			</template>
			<div v-else class="rounded-xl border bg-white p-6 text-center dark:bg-dark-800">{{ emptyMessage }}</div>
		</div>
		<Paginator
			v-if="result.total > itemsPerPage"
			:first="first"
			:rows="itemsPerPage"
			:total-records="result.total"
			:page-link-size="pageLinkSize"
			:template="template"
			@page="page = $event.page"
		/>
	</section>
</template>

<script setup lang="ts">
	import { customEndpoint } from '@directus/sdk';
	import type { DataTableSortEvent } from 'primevue/datatable';
	import { computedDebounced } from '~/composables/computedDebounced';
	import { usePagination } from '~/composables/pagination';
	import { useErrorToast } from '~/composables/useErrorToast';
	import { useUrlSort } from '~/composables/useUrlSort';
	import { formatUtcDateForTable } from '~/utils/date-formatters';
	import { formatNumber } from '~/utils/format-number';

	const { $directus } = useNuxtApp();
	const itemsPerPage = ref(10);
	const { page, first, pageLinkSize, template } = usePagination({
		itemsPerPage,
		pageKey: 'manualAdditionsPage',
		limitKey: 'manualAdditionsLimit',
	});
	const search = ref('');
	const type = ref<'all' | ManualAdditionType>('all');
	const filtersPanel = ref();
	const additionSortFields = [ 'date', 'sponsor', 'type', 'credits', 'addedBy' ] as const;
	const { sortField, sortOrder, setSort } = useUrlSort<ManualAdditionSort>({
		defaultField: 'date',
		defaultOrder: -1,
		fieldKey: 'manualAdditionsSort',
		directionKey: 'manualAdditionsDirection',
		fields: additionSortFields,
		pageKey: 'manualAdditionsPage',
	});
	const debouncedSearch = computedDebounced(() => search.value.trim(), 350);
	const typeOptions: Array<{ label: string; value: 'all' | ManualAdditionType }> = [
		{ label: 'All', value: 'all' },
		{ label: 'Manual one-time payment', value: 'payment' },
		{ label: 'Other credits', value: 'other' },
	];
	const requestKey = computed(() => [ first.value, itemsPerPage.value, debouncedSearch.value, type.value, sortField.value, sortOrder.value ]);
	const { data: response, pending, error } = await useLazyAsyncData(
		() => $directus.request<PageResult<ManualAddition>>(customEndpoint({
			path: '/admin-sponsors/manual-additions',
			params: {
				offset: first.value,
				limit: itemsPerPage.value,
				...debouncedSearch.value && { search: debouncedSearch.value },
				...type.value !== 'all' && { types: type.value },
				sort: sortField.value,
				direction: sortOrder.value === -1 ? 'desc' : 'asc',
			},
		})),
		{ watch: [ requestKey ] },
	);
	const result = computed(() => response.value || { items: [], total: 0 });
	const anyFilterApplied = computed(() => Boolean(debouncedSearch.value || type.value !== 'all'));
	const emptyMessage = computed(() => anyFilterApplied.value ? 'No results match the current filters' : 'No manual additions yet');

	watch([ debouncedSearch, type ], () => { page.value = 0; });
	useErrorToast(error);

	const formatMoney = (value: number) => `$${formatNumber(value)}`;
	const typeLabel = (value: ManualAdditionType) => typeOptions.find(option => option.value === value)?.label || value;
	const onSort = (event: DataTableSortEvent) => {
		if (typeof event.sortField !== 'string' || !additionSortFields.includes(event.sortField as ManualAdditionSort)) { return; }

		setSort(event.sortField as ManualAdditionSort, event.sortOrder === -1 ? -1 : 1);
	};
</script>
