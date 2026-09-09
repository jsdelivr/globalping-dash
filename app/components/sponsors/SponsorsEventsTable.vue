<template>
	<section class="flex flex-col gap-4">
		<div class="flex flex-wrap items-end gap-3">
			<div class="mr-auto min-w-0">
				<h3 class="text-lg font-bold">Sponsorship events</h3>
				<p class="mt-1 text-sm text-bluegray-500">Individual recurring, one-time, and tier-change payments.</p>
			</div>
			<div class="ml-auto flex items-center gap-2 max-md:w-full">
				<InputGroup class="!w-auto max-md:min-w-0 max-md:flex-1">
					<IconField>
						<InputIcon class="pi pi-search"/>
						<InputText v-model="search" class="m-0 h-9 min-w-80 max-md:w-full max-md:min-w-0" placeholder="Search events" aria-label="Search sponsorship events"/>
					</IconField>
				</InputGroup>
				<Button
					class="relative h-9 shrink-0"
					label="Filters"
					severity="secondary"
					outlined
					@click="filtersPanel?.toggle($event)">
					<template #icon><i class="pi pi-sliders-h"/><i v-if="type !== 'all'" class="pi pi-circle-fill absolute left-7 top-1.5 text-[0.4rem] text-primary"/></template>
				</Button>
			</div>
			<Popover ref="filtersPanel" class="w-fit max-w-[calc(100vw-2rem)] p-4 [&>*]:border-none" role="dialog" aria-label="Filter sponsorship events">
				<div class="flex flex-col gap-3">
					<label for="eventTypes" class="font-bold">Type</label>
					<Select
						id="eventTypes"
						v-model="type"
						:options="typeOptions"
						option-label="label"
						option-value="value"
						aria-label="Event types"
						class="!w-full min-w-56"/>
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
			data-key="id"
			@sort="onSort"
		>
			<Column field="date" header="Date" sortable class="min-w-36" style="width: 18%;">
				<template #body="{ data }"><AsyncCell :loading="pending" preserve-height>{{ formatUtcDateForTable(data.date) }}</AsyncCell></template>
			</Column>
			<Column field="sponsor" header="Sponsor" sortable class="min-w-40" style="width: 20%;">
				<template #body="{ data }">
					<AsyncCell :loading="pending" preserve-height>
						<span class="flex min-w-0 max-w-full items-center gap-1.5">
							<a
								v-if="data.githubLogin"
								class="min-w-0 truncate font-semibold text-inherit underline transition-none hover:text-inherit"
								:href="`https://github.com/${data.githubLogin}`"
								:title="data.githubLogin"
								target="_blank"
								rel="noopener">
								{{ data.githubLogin }}
							</a>
							<span v-else class="min-w-0 truncate">GitHub ID {{ data.githubId }}</span>
							<i v-if="data.dashboardUserId" v-tooltip.top="'Dashboard account linked'" class="pi pi-user shrink-0 text-xs text-bluegray-400" aria-label="Dashboard account linked"/>
						</span>
					</AsyncCell>
				</template>
			</Column>
			<Column field="type" header="Type" sortable class="min-w-44" style="width: 34%;">
				<template #body="{ data }">
					<AsyncCell :loading="pending" preserve-height>
						<span class="flex h-[26px] flex-nowrap gap-1.5 whitespace-nowrap">
							<Tag :value="reasonLabel(data.reason)" :severity="reasonSeverity(data.reason)"/>
							<Tag v-if="data.manual" value="Manual" severity="secondary"/>
						</span>
					</AsyncCell>
				</template>
			</Column>
			<Column field="sponsorshipValue" header="Sponsorship amount" sortable class="min-w-48" style="width: 28%;">
				<template #body="{ data }">
					<AsyncCell :loading="pending" preserve-height>
						<div>{{ formatMoney(data.sponsorshipValue) }}</div>
						<small v-if="data.monthsCovered > 1" class="text-bluegray-500">
							{{ formatMoney(data.amountInDollars) }} × {{ formatNumber(data.monthsCovered) }} months
						</small>
					</AsyncCell>
				</template>
			</Column>
			<template #empty><div class="p-6 text-center">{{ emptyMessage }}</div></template>
		</DataTable>
		<div class="relative flex w-full flex-col gap-2 md:hidden">
			<div v-if="initialLoading" class="flex h-32 items-center justify-center"><i class="pi pi-spin pi-spinner text-xl"/></div>
			<template v-else-if="result.items.length">
				<AsyncRow v-for="event in result.items" :key="event.id" :loading="pending">
					<article class="rounded-xl border bg-white p-4 dark:bg-dark-800">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<div class="text-sm text-bluegray-500">{{ formatUtcDateForTable(event.date) }}</div>
								<span class="mt-1 flex min-w-0 max-w-full items-center gap-1.5">
									<a
										v-if="event.githubLogin"
										class="min-w-0 truncate font-semibold text-inherit underline transition-none hover:text-inherit"
										:href="`https://github.com/${event.githubLogin}`"
										:title="event.githubLogin"
										target="_blank"
										rel="noopener">{{ event.githubLogin }}</a>
									<span v-else class="min-w-0 truncate font-semibold">GitHub ID {{ event.githubId }}</span>
									<i v-if="event.dashboardUserId" v-tooltip.top="'Dashboard account linked'" class="pi pi-user shrink-0 text-xs text-bluegray-400" aria-label="Dashboard account linked"/>
								</span>
							</div>
							<div class="shrink-0 text-right">
								<div class="font-semibold">{{ formatMoney(event.sponsorshipValue) }}</div>
								<small v-if="event.monthsCovered > 1" class="text-bluegray-500">{{ formatMoney(event.amountInDollars) }} × {{ formatNumber(event.monthsCovered) }} months</small>
							</div>
						</div>
						<div class="mt-3 flex flex-wrap gap-1.5">
							<Tag :value="reasonLabel(event.reason)" :severity="reasonSeverity(event.reason)"/>
							<Tag v-if="event.manual" value="Manual" severity="secondary"/>
						</div>
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

	type EventsTableData = {
		result: PageResult<SponsorshipEvent>;
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
		pageKey: 'eventsPage',
		limitKey: 'eventsLimit',
	});

	const search = ref('');
	const type = ref<'all' | SponsorshipReason>('all');
	const filtersPanel = ref();

	const eventSortFields = [ 'date', 'sponsor', 'type', 'sponsorshipValue' ] as const;
	const { sortField, sortOrder, setSort } = useUrlSort<SponsorshipEventSort>({
		defaultField: 'date',
		defaultOrder: -1,
		fieldKey: 'eventsSort',
		directionKey: 'eventsOrder',
		fields: eventSortFields,
		pageKey: 'eventsPage',
	});

	const debouncedSearch = computedDebounced(() => search.value.trim(), 350);
	const typeOptions: Array<{ label: string; value: 'all' | SponsorshipReason }> = [
		{ label: 'All', value: 'all' },
		{ label: 'Recurring sponsorship', value: 'recurring_sponsorship' },
		{ label: 'One-time sponsorship', value: 'one_time_sponsorship' },
		{ label: 'Tier changed', value: 'tier_changed' },
	];

	const requestKey = computedDebounced(() => [ props.period, first.value, itemsPerPage.value, debouncedSearch.value, type.value, sortField.value, sortOrder.value ]);
	const initialLoading = ref(true);

	const { data: response, pending, error } = await useLazyAsyncData(
		async () => {
			const requestedPeriod = props.period;
			const requestedFirst = first.value;
			const requestedRows = itemsPerPage.value;
			const requestedSearch = debouncedSearch.value;
			const requestedType = type.value;
			const requestedSortField = sortField.value;
			const requestedSortOrder = sortOrder.value;
			const result = await minDelay($directus.request<PageResult<SponsorshipEvent>>(customEndpoint({
				path: '/admin-sponsors/events',
				params: {
					period: requestedPeriod,
					offset: requestedFirst,
					limit: requestedRows,
					...requestedSearch && { search: requestedSearch },
					...requestedType !== 'all' && { types: requestedType },
					sort: requestedSortField,
					direction: requestedSortOrder === -1 ? 'desc' : 'asc',
				},
			})));

			return {
				result,
				first: requestedFirst,
				rows: requestedRows,
				anyFilterApplied: Boolean(requestedSearch || requestedType !== 'all'),
			};
		},
		{ default: (): EventsTableData => ({ result: { items: [], total: 0 }, first: 0, rows: itemsPerPage.value, anyFilterApplied: false }), watch: [ requestKey ] },
	);
	const result = computed(() => response.value.result);
	const displayedFirst = computed(() => response.value.first);
	const displayedRows = computed(() => response.value.rows);

	const emptyMessage = computed(() => response.value.anyFilterApplied ? 'No results match the current filters' : 'No sponsorship events in this period');

	watch([ debouncedSearch, type ], () => { page.value = 0; });

	watch(pending, (isPending) => {
		if (!isPending) { initialLoading.value = false; }
	});

	useErrorToast(error);

	const reasonLabel = (reason: SponsorshipReason) => typeOptions.find(option => option.value === reason)?.label || reason;
	const reasonSeverity = (reason: SponsorshipReason) => reason === 'recurring_sponsorship' ? 'info' : reason === 'one_time_sponsorship' ? 'warn' : 'secondary';

	const onSort = (event: DataTableSortEvent) => {
		if (typeof event.sortField !== 'string' || !eventSortFields.includes(event.sortField as SponsorshipEventSort)) { return; }

		setSort(event.sortField as SponsorshipEventSort, event.sortOrder === -1 ? -1 : 1);
	};
</script>
