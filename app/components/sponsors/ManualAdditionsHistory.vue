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
			<Popover ref="filtersPanel" class="w-fit max-w-[calc(100vw-2rem)] p-4 [&>*]:border-none" role="dialog" aria-label="Filter manual additions">
				<div class="flex flex-col gap-3">
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
			table-class="table-fixed"
			:value="result.items"
			lazy
			:first="displayedFirst"
			:rows="displayedRows"
			:total-records="result.total"
			:loading="loadingWithoutRows"
			:sort-field="sortField"
			:sort-order="sortOrder"
			data-key="id"
			@sort="onSort"
		>
			<Column field="date" header="Date" sortable class="min-w-28" style="width: 17%;">
				<template #body="{ data }"><AsyncCell :loading="pending" preserve-height>{{ formatUtcDateForTable(data.date) }}</AsyncCell></template>
			</Column>
			<Column field="sponsor" header="Recipient" sortable class="min-w-32" style="width: 23%;">
				<template #body="{ data }">
					<AsyncCell :loading="pending" preserve-height>
						<span class="flex min-w-0 max-w-full items-center gap-1.5">
							<a
								v-if="data.githubLogin"
								class="min-w-0 truncate font-semibold text-inherit underline transition-none hover:text-inherit"
								:href="`https://github.com/${data.githubLogin}`"
								:title="data.githubLogin"
								target="_blank"
								rel="noopener">{{ data.githubLogin }}</a>
							<span v-else class="min-w-0 truncate">GitHub ID {{ data.githubId }}</span>
							<i v-if="data.dashboardUserId" v-tooltip.top="'Dashboard account linked'" class="pi pi-user shrink-0 text-xs text-bluegray-400" aria-label="Dashboard account linked"/>
						</span>
					</AsyncCell>
				</template>
			</Column>
			<Column field="type" header="Type and details" sortable class="min-w-52" style="width: 30%;">
				<template #body="{ data }">
					<AsyncCell :loading="pending" preserve-height>
						<div class="flex flex-col items-start gap-1">
							<Tag :value="typeLabel(data.type)" :severity="data.type === 'payment' ? 'warn' : 'secondary'"/>
							<small class="text-bluegray-500">{{ data.type === 'payment' ? `${formatMoney(data.amountInDollars || 0)} payment` : data.comment || '—' }}</small>
						</div>
					</AsyncCell>
				</template>
			</Column>
			<Column field="credits" header="Credits" sortable class="min-w-24" style="width: 12%;">
				<template #body="{ data }"><AsyncCell :loading="pending" preserve-height>{{ formatNumber(data.credits) }}</AsyncCell></template>
			</Column>
			<Column field="addedBy" header="Added by" sortable class="min-w-28" style="width: 18%;">
				<template #body="{ data }"><AsyncCell :loading="pending" preserve-height>{{ data.addedBy || 'System' }}</AsyncCell></template>
			</Column>
			<template #empty><div class="p-6 text-center">{{ emptyMessage }}</div></template>
		</DataTable>

		<div class="relative flex w-full flex-col gap-2 md:hidden">
			<div v-if="loadingWithoutRows" class="flex h-32 items-center justify-center"><i class="pi pi-spin pi-spinner text-xl"/></div>
			<template v-else-if="result.items.length">
				<AsyncRow v-for="addition in result.items" :key="addition.id" :loading="pending">
					<article class="rounded-xl border bg-white p-4 dark:bg-dark-800">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<div class="text-sm text-bluegray-500">{{ formatUtcDateForTable(addition.date) }}</div>
								<span class="mt-1 flex min-w-0 max-w-full items-center gap-1.5">
									<a
										v-if="addition.githubLogin"
										class="min-w-0 truncate font-semibold text-inherit underline transition-none hover:text-inherit"
										:href="`https://github.com/${addition.githubLogin}`"
										:title="addition.githubLogin"
										target="_blank"
										rel="noopener">{{ addition.githubLogin }}</a>
									<span v-else class="min-w-0 truncate font-semibold">GitHub ID {{ addition.githubId }}</span>
									<i v-if="addition.dashboardUserId" v-tooltip.top="'Dashboard account linked'" class="pi pi-user shrink-0 text-xs text-bluegray-400" aria-label="Dashboard account linked"/>
								</span>
							</div>
							<div class="shrink-0 text-right font-semibold">{{ formatNumber(addition.credits) }} credits</div>
						</div>
						<div class="mt-3 flex items-center gap-2"><Tag :value="typeLabel(addition.type)" :severity="addition.type === 'payment' ? 'warn' : 'secondary'"/><span class="text-sm">{{ addition.type === 'payment' ? `${formatMoney(addition.amountInDollars || 0)} payment` : addition.comment }}</span></div>
						<div class="mt-2 text-xs text-bluegray-500">Added by {{ addition.addedBy || 'System' }}</div>
					</article>
				</AsyncRow>
			</template>
			<div v-else class="rounded-xl border bg-white p-6 text-center dark:bg-dark-800">{{ emptyMessage }}</div>
		</div>
		<Paginator
			v-if="result.total > displayedRows"
			:first="first"
			:rows="displayedRows"
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
	import { formatMoney } from '~/utils/format-money';
	import { formatNumber } from '~/utils/format-number';
	import { minDelay } from '~/utils/min-delay';

	type AdditionsTableData = {
		result: PageResult<ManualAddition>;
		first: number;
		rows: number;
		anyFilterApplied: boolean;
	};

	const { $directus } = useNuxtApp();

	const itemsPerPage = ref(10);
	const { page, first, pageLinkSize, template } = usePagination({
		defaultItemsPerPage: 10,
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
		directionKey: 'manualAdditionsOrder',
		fields: additionSortFields,
		pageKey: 'manualAdditionsPage',
	});

	const debouncedSearch = computedDebounced(() => search.value.trim(), 350);
	const typeOptions: Array<{ label: string; value: 'all' | ManualAdditionType }> = [
		{ label: 'All', value: 'all' },
		{ label: 'Manual one-time payment', value: 'payment' },
		{ label: 'Other credits', value: 'other' },
	];

	const requestKey = computedDebounced(() => [ first.value, itemsPerPage.value, debouncedSearch.value, type.value, sortField.value, sortOrder.value ]);
	const initialLoading = ref(true);

	const { data: response, pending, error } = await useLazyAsyncData(
		async () => {
			const params = {
				offset: first.value,
				limit: itemsPerPage.value,
				...debouncedSearch.value && { search: debouncedSearch.value },
				...type.value !== 'all' && { types: type.value },
				sort: sortField.value,
				direction: sortOrder.value === -1 ? 'desc' : 'asc',
			};
			const result = await minDelay($directus.request<PageResult<ManualAddition>>(customEndpoint({
				path: '/admin-sponsors/manual-additions',
				params,
			})));

			return {
				result,
				first: params.offset,
				rows: params.limit,
				anyFilterApplied: Boolean(params.search || params.types),
			};
		},
		{ default: (): AdditionsTableData => ({ result: { items: [], total: 0 }, first: 0, rows: itemsPerPage.value, anyFilterApplied: false }), watch: [ requestKey ] },
	);
	const result = computed(() => response.value.result);
	const displayedFirst = computed(() => response.value.first);
	const displayedRows = computed(() => response.value.rows);
	const loadingWithoutRows = computed(() => initialLoading.value || (pending.value && !result.value.items.length));

	const emptyMessage = computed(() => response.value.anyFilterApplied ? 'No results match the current filters' : 'No manual additions yet');

	watch([ debouncedSearch, type ], () => { page.value = 0; });

	watch(pending, (isPending) => {
		if (!isPending) { initialLoading.value = false; }
	});

	useErrorToast(error);

	const typeLabel = (value: ManualAdditionType) => typeOptions.find(option => option.value === value)?.label || value;

	const onSort = (event: DataTableSortEvent) => {
		if (typeof event.sortField !== 'string' || !additionSortFields.includes(event.sortField as ManualAdditionSort)) { return; }

		setSort(event.sortField as ManualAdditionSort, event.sortOrder === -1 ? -1 : 1);
	};
</script>
