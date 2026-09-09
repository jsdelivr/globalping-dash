<template>
	<section class="flex flex-col gap-4">
		<div class="flex flex-wrap items-end gap-3">
			<div class="mr-auto min-w-0">
				<h3 class="text-lg font-bold">Sponsor accounts</h3>
				<p class="mt-1 text-sm text-bluegray-500">Current and historical sponsors with activity in the selected period.</p>
			</div>
			<div class="ml-auto flex items-center gap-2 max-md:w-full">
				<InputGroup class="!w-auto max-md:min-w-0 max-md:flex-1">
					<IconField>
						<InputIcon class="pi pi-search"/>
						<InputText v-model="search" class="m-0 h-9 min-w-80 max-md:w-full max-md:min-w-0" placeholder="Search accounts" aria-label="Search sponsor accounts"/>
					</IconField>
				</InputGroup>
				<Button class="relative h-9 shrink-0" label="Filters" severity="secondary" outlined @click="filtersPanel?.toggle($event)">
					<template #icon><i class="pi pi-sliders-h"/><i v-if="anyCategoricalFilterApplied" class="pi pi-circle-fill absolute left-7 top-1.5 text-[0.4rem] text-primary"/></template>
				</Button>
			</div>
			<Popover ref="filtersPanel" class="w-fit max-w-[calc(100vw-2rem)] p-4 [&>*]:border-none" role="dialog" aria-label="Filter sponsor accounts">
				<div class="flex flex-col gap-3">
					<label for="sponsorStatuses" class="font-bold">Status</label>
					<Select
						id="sponsorStatuses"
						v-model="status"
						:options="statusOptions"
						option-label="label"
						option-value="value"
						aria-label="Sponsor statuses"
						class="!w-full min-w-44"/>
					<label for="dashboardLinkage" class="font-bold">Dashboard account</label>
					<Select
						id="dashboardLinkage"
						v-model="linked"
						:options="linkedOptions"
						option-label="label"
						option-value="value"
						aria-label="Dashboard account linkage"
						class="!w-full min-w-44"/>
					<Button
						label="Reset"
						aria-label="Reset account filters"
						severity="secondary"
						text
						:disabled="!anyCategoricalFilterApplied"
						@click="resetFilters"/>
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
			:loading="initialLoading"
			:sort-field="sortField"
			:sort-order="sortOrder"
			data-key="githubId"
			@sort="onSort"
		>
			<Column field="sponsor" header="Sponsor" sortable class="w-[28%] min-w-36 xl:w-[24%]">
				<template #body="{ data }">
					<AsyncCell :loading="pending" preserve-height>
						<div class="min-w-0">
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
							<div class="mt-1 text-xs text-bluegray-500 xl:hidden">Latest: {{ formatUtcDateForTable(data.latestEvent) }}</div>
						</div>
					</AsyncCell>
				</template>
			</Column>
			<Column field="status" header="Status" sortable class="w-1/5 min-w-32 xl:w-[17%]">
				<template #body="{ data }">
					<AsyncCell :loading="pending" preserve-height>
						<span class="inline-flex items-center gap-2 whitespace-nowrap font-semibold">
							<i class="pi pi-circle-fill text-2xs" :class="statusColor(data.status)"/>
							{{ statusLabel(data.status) }}
						</span>
					</AsyncCell>
				</template>
			</Column>
			<Column field="currentMonthly" header="Monthly amount" sortable class="w-[22%] min-w-36 xl:w-[19%]">
				<template #body="{ data }"><AsyncCell :loading="pending" preserve-height>{{ data.currentMonthlyAmount === null ? '—' : formatMoney(data.currentMonthlyAmount) }}</AsyncCell></template>
			</Column>
			<Column field="periodValue" header="Period amount" sortable class="w-1/5 min-w-32 xl:w-[17%]">
				<template #body="{ data }"><AsyncCell :loading="pending" preserve-height>{{ formatMoney(data.periodSponsorshipValue) }}</AsyncCell></template>
			</Column>
			<Column header="Events" field="events" sortable class="w-[10%] min-w-16 xl:w-[9%]">
				<template #body="{ data }"><AsyncCell :loading="pending" preserve-height>{{ formatNumber(data.periodEvents) }}</AsyncCell></template>
			</Column>
			<Column field="latestEvent" header="Latest event" sortable class="w-[14%] min-w-36 max-xl:hidden">
				<template #body="{ data }"><AsyncCell :loading="pending" preserve-height>{{ formatUtcDateForTable(data.latestEvent) }}</AsyncCell></template>
			</Column>
			<template #empty><div class="p-6 text-center">{{ emptyMessage }}</div></template>
		</DataTable>
		<div class="relative flex w-full flex-col gap-2 md:hidden">
			<div v-if="initialLoading" class="flex h-32 items-center justify-center"><i class="pi pi-spin pi-spinner text-xl"/></div>
			<template v-else-if="result.items.length">
				<AsyncRow v-for="account in result.items" :key="account.githubId" :loading="pending">
					<article class="rounded-xl border bg-white p-4 dark:bg-dark-800">
						<div class="flex items-start justify-between gap-3">
							<span class="flex min-w-0 flex-1 items-center gap-1.5">
								<a
									v-if="account.githubLogin"
									class="min-w-0 truncate font-semibold text-inherit underline transition-none hover:text-inherit"
									:href="`https://github.com/${account.githubLogin}`"
									:title="account.githubLogin"
									target="_blank"
									rel="noopener">{{ account.githubLogin }}</a>
								<span v-else class="min-w-0 truncate font-semibold">GitHub ID {{ account.githubId }}</span>
								<i v-if="account.dashboardUserId" v-tooltip.top="'Dashboard account linked'" class="pi pi-user shrink-0 text-xs text-bluegray-400" aria-label="Dashboard account linked"/>
							</span>
							<span class="inline-flex shrink-0 items-center gap-2 whitespace-nowrap font-semibold">
								<i class="pi pi-circle-fill text-2xs" :class="statusColor(account.status)"/>
								{{ statusLabel(account.status) }}
							</span>
						</div>
						<dl class="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm">
							<dt class="text-bluegray-500">Monthly amount</dt><dd>{{ account.currentMonthlyAmount === null ? '—' : formatMoney(account.currentMonthlyAmount) }}</dd>
							<dt class="text-bluegray-500">Period amount</dt><dd>{{ formatMoney(account.periodSponsorshipValue) }}</dd>
							<dt class="text-bluegray-500">Events</dt><dd>{{ formatNumber(account.periodEvents) }}</dd>
							<dt class="text-bluegray-500">Latest event</dt><dd>{{ formatUtcDateForTable(account.latestEvent) }}</dd>
						</dl>
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

	type AccountsTableData = {
		result: PageResult<SponsorAccount>;
		first: number;
		rows: number;
		anyFilterApplied: boolean;
	};

	const props = defineProps<{ period: SponsorsPeriod }>();
	const { $directus } = useNuxtApp();

	const itemsPerPage = ref(10);
	const { page, first, pageLinkSize, template } = usePagination({
		defaultItemsPerPage: 10,
		itemsPerPage,
		pageKey: 'accountsPage',
		limitKey: 'accountsLimit',
	});

	const search = ref('');
	const status = ref<'all' | SponsorStatus>('all');
	const linked = ref<'all' | 'linked' | 'unlinked'>('all');
	const filtersPanel = ref();

	const accountSortFields = [ 'sponsor', 'status', 'currentMonthly', 'periodValue', 'events', 'latestEvent' ] as const;
	const { sortField, sortOrder, setSort } = useUrlSort<SponsorAccountSort>({
		defaultField: 'periodValue',
		defaultOrder: -1,
		fieldKey: 'accountsSort',
		directionKey: 'accountsOrder',
		fields: accountSortFields,
		pageKey: 'accountsPage',
	});

	const debouncedSearch = computedDebounced(() => search.value.trim(), 350);
	const statusOptions: Array<{ label: string; value: 'all' | SponsorStatus }> = [
		{ label: 'All', value: 'all' },
		{ label: 'Active recurring', value: 'active' },
		{ label: 'Former recurring', value: 'former' },
		{ label: 'One-time only', value: 'one-time' },
	];

	const linkedOptions = [
		{ label: 'All', value: 'all' },
		{ label: 'Linked', value: 'linked' },
		{ label: 'Not linked', value: 'unlinked' },
	];

	const requestKey = computedDebounced(() => [ props.period, first.value, itemsPerPage.value, debouncedSearch.value, status.value, linked.value, sortField.value, sortOrder.value ]);
	const initialLoading = ref(true);

	const { data: response, pending, error } = await useLazyAsyncData(
		async () => {
			const requestedPeriod = props.period;
			const requestedFirst = first.value;
			const requestedRows = itemsPerPage.value;
			const requestedSearch = debouncedSearch.value;
			const requestedStatus = status.value;
			const requestedLinked = linked.value;
			const requestedSortField = sortField.value;
			const requestedSortOrder = sortOrder.value;
			const result = await minDelay($directus.request<PageResult<SponsorAccount>>(customEndpoint({
				path: '/admin-sponsors/accounts',
				params: {
					period: requestedPeriod,
					offset: requestedFirst,
					limit: requestedRows,
					...requestedSearch && { search: requestedSearch },
					...requestedStatus !== 'all' && { statuses: requestedStatus },
					...requestedLinked !== 'all' && { linked: requestedLinked === 'linked' },
					sort: requestedSortField,
					direction: requestedSortOrder === -1 ? 'desc' : 'asc',
				},
			})));

			return {
				result,
				first: requestedFirst,
				rows: requestedRows,
				anyFilterApplied: Boolean(requestedSearch || requestedStatus !== 'all' || requestedLinked !== 'all'),
			};
		},
		{ default: (): AccountsTableData => ({ result: { items: [], total: 0 }, first: 0, rows: itemsPerPage.value, anyFilterApplied: false }), watch: [ requestKey ] },
	);
	const result = computed(() => response.value.result);
	const displayedFirst = computed(() => response.value.first);
	const displayedRows = computed(() => response.value.rows);

	const anyCategoricalFilterApplied = computed(() => Boolean(status.value !== 'all' || linked.value !== 'all'));
	const emptyMessage = computed(() => response.value.anyFilterApplied ? 'No results match the current filters' : 'No sponsor accounts in this period');

	watch([ debouncedSearch, status, linked ], () => { page.value = 0; });

	watch(pending, (isPending) => {
		if (!isPending) { initialLoading.value = false; }
	});

	useErrorToast(error);

	const statusLabel = (status: SponsorStatus) => statusOptions.find(option => option.value === status)?.label || status;
	const statusColor = (status: SponsorStatus) => status === 'active' ? 'text-blue-500' : status === 'one-time' ? 'text-orange-500' : 'text-bluegray-400';
	const resetFilters = () => {
		status.value = 'all';
		linked.value = 'all';
	};

	const onSort = (event: DataTableSortEvent) => {
		if (typeof event.sortField !== 'string' || !accountSortFields.includes(event.sortField as SponsorAccountSort)) { return; }

		setSort(event.sortField as SponsorAccountSort, event.sortOrder === -1 ? -1 : 1);
	};
</script>
