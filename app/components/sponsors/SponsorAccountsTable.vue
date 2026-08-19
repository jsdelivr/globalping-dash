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
			<Popover ref="filtersPanel" class="w-80 p-4 [&>*]:border-none" role="dialog">
				<div class="flex flex-col gap-3">
					<h4 class="font-bold">Filter sponsor accounts</h4>
					<label for="sponsorStatuses" class="font-bold">Status</label>
					<Select
						id="sponsorStatuses"
						v-model="status"
						:options="statusOptions"
						option-label="label"
						option-value="value"
						aria-label="Sponsor statuses"
						class="!w-full min-w-0"/>
					<label for="dashboardLinkage" class="font-bold">Dashboard account</label>
					<Select
						id="dashboardLinkage"
						v-model="linked"
						:options="linkedOptions"
						option-label="label"
						option-value="value"
						aria-label="Dashboard account linkage"
						class="!w-full min-w-0"/>
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
			:value="result.items"
			lazy
			:first="first"
			:rows="itemsPerPage"
			:total-records="result.total"
			:loading="pending"
			:sort-field="sortField"
			:sort-order="sortOrder"
			data-key="githubId"
			@sort="onSort"
		>
			<Column field="sponsor" header="Sponsor" sortable class="min-w-36">
				<template #body="{ data }">
					<div>
						<span class="inline-flex items-center gap-1.5">
							<a v-if="data.githubLogin" class="font-semibold text-primary hover:underline" :href="`https://github.com/${data.githubLogin}`" target="_blank" rel="noopener">{{ data.githubLogin }}</a>
							<span v-else>GitHub ID {{ data.githubId }}</span>
							<i v-if="data.dashboardUserId" v-tooltip.top="'Dashboard account linked'" class="pi pi-user text-xs text-bluegray-400" aria-label="Dashboard account linked"/>
						</span>
						<div class="mt-1 text-xs text-bluegray-500 xl:hidden">Latest: {{ formatUtcDateForTable(data.latestEvent) }}</div>
					</div>
				</template>
			</Column>
			<Column field="status" header="Status" sortable class="min-w-32">
				<template #body="{ data }">
					<span class="inline-flex items-center gap-2 whitespace-nowrap font-semibold">
						<i class="pi pi-circle-fill text-2xs" :class="statusColor(data.status)"/>
						{{ statusLabel(data.status) }}
					</span>
				</template>
			</Column>
			<Column field="currentMonthly" header="Monthly amount" sortable class="min-w-36">
				<template #body="{ data }">{{ data.currentMonthlyAmount === null ? '—' : formatMoney(data.currentMonthlyAmount) }}</template>
			</Column>
			<Column field="periodValue" header="Period amount" sortable class="min-w-32">
				<template #body="{ data }">{{ formatMoney(data.periodSponsorshipValue) }}</template>
			</Column>
			<Column header="Events" field="events" sortable class="min-w-16">
				<template #body="{ data }">{{ formatNumber(data.periodEvents) }}</template>
			</Column>
			<Column field="latestEvent" header="Latest event" sortable class="min-w-36 max-xl:hidden">
				<template #body="{ data }">{{ formatUtcDateForTable(data.latestEvent) }}</template>
			</Column>
			<template #empty><div class="p-6 text-center">{{ emptyMessage }}</div></template>
		</DataTable>
		<div class="relative flex w-full flex-col gap-2 md:hidden">
			<div v-if="pending" class="flex h-32 items-center justify-center"><i class="pi pi-spin pi-spinner text-xl"/></div>
			<template v-else-if="result.items.length">
				<article v-for="account in result.items" :key="account.githubId" class="rounded-xl border bg-white p-4 dark:bg-dark-800">
					<div class="flex items-start justify-between gap-3">
						<span class="inline-flex items-center gap-1.5">
							<a v-if="account.githubLogin" class="font-semibold text-primary hover:underline" :href="`https://github.com/${account.githubLogin}`" target="_blank" rel="noopener">{{ account.githubLogin }}</a>
							<span v-else class="font-semibold">GitHub ID {{ account.githubId }}</span>
							<i v-if="account.dashboardUserId" v-tooltip.top="'Dashboard account linked'" class="pi pi-user text-xs text-bluegray-400" aria-label="Dashboard account linked"/>
						</span>
						<span class="inline-flex items-center gap-2 whitespace-nowrap font-semibold">
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

	const props = defineProps<{ period: SponsorsPeriod }>();
	const { $directus } = useNuxtApp();
	const itemsPerPage = ref(10);
	const { page, first, pageLinkSize, template } = usePagination({
		itemsPerPage,
		pageKey: 'sponsorAccountsPage',
		limitKey: 'sponsorAccountsLimit',
	});
	const search = ref('');
	const status = ref<'all' | SponsorStatus>('all');
	const linked = ref<'all' | 'linked' | 'unlinked'>('all');
	const filtersPanel = ref();
	const accountSortFields = [ 'sponsor', 'status', 'currentMonthly', 'periodValue', 'events', 'latestEvent' ] as const;
	const { sortField, sortOrder, setSort } = useUrlSort<SponsorAccountSort>({
		defaultField: 'periodValue',
		defaultOrder: -1,
		fieldKey: 'sponsorAccountsSort',
		directionKey: 'sponsorAccountsDirection',
		fields: accountSortFields,
		pageKey: 'sponsorAccountsPage',
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
	const requestKey = computed(() => [ props.period, first.value, itemsPerPage.value, debouncedSearch.value, status.value, linked.value, sortField.value, sortOrder.value ]);
	const { data: response, pending, error } = await useLazyAsyncData(
		() => $directus.request<PageResult<SponsorAccount>>(customEndpoint({
			path: '/admin-sponsors/accounts',
			params: {
				period: props.period,
				offset: first.value,
				limit: itemsPerPage.value,
				...debouncedSearch.value && { search: debouncedSearch.value },
				...status.value !== 'all' && { statuses: status.value },
				...linked.value !== 'all' && { linked: linked.value === 'linked' },
				sort: sortField.value,
				direction: sortOrder.value === -1 ? 'desc' : 'asc',
			},
		})),
		{ watch: [ requestKey ] },
	);
	const result = computed(() => response.value || { items: [], total: 0 });
	const anyCategoricalFilterApplied = computed(() => Boolean(status.value !== 'all' || linked.value !== 'all'));
	const anyFilterApplied = computed(() => Boolean(debouncedSearch.value || status.value !== 'all' || linked.value !== 'all'));
	const emptyMessage = computed(() => anyFilterApplied.value ? 'No results match the current filters' : 'No sponsor accounts in this period');

	watch([ debouncedSearch, status, linked, () => props.period ], () => { page.value = 0; });
	useErrorToast(error);

	const formatMoney = (value: number) => `$${formatNumber(value)}`;
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
