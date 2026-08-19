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
			<Popover ref="filtersPanel" class="w-80 p-4 [&>*]:border-none" role="dialog">
				<div class="flex flex-col gap-3">
					<h4 class="font-bold">Filter sponsorship events</h4>
					<label for="eventTypes" class="font-bold">Type</label>
					<Select
						id="eventTypes"
						v-model="type"
						:options="typeOptions"
						option-label="label"
						option-value="value"
						aria-label="Event types"
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
			<Column field="date" header="Date" sortable class="min-w-36">
				<template #body="{ data }">{{ formatUtcDateForTable(data.date) }}</template>
			</Column>
			<Column field="sponsor" header="Sponsor" sortable class="min-w-40">
				<template #body="{ data }">
					<a v-if="data.githubLogin" class="font-semibold text-primary hover:underline" :href="`https://github.com/${data.githubLogin}`" target="_blank" rel="noopener">
						{{ data.githubLogin }}
					</a>
					<span v-else>GitHub ID {{ data.githubId }}</span>
				</template>
			</Column>
			<Column field="type" header="Type" sortable class="min-w-44">
				<template #body="{ data }">
					<span class="flex flex-wrap gap-1.5">
						<Tag :value="reasonLabel(data.reason)" :severity="reasonSeverity(data.reason)"/>
						<Tag v-if="data.manual" value="Manual" severity="secondary"/>
					</span>
				</template>
			</Column>
			<Column field="sponsorshipValue" header="Sponsorship amount" sortable class="min-w-48">
				<template #body="{ data }">
					<div>{{ formatMoney(data.sponsorshipValue) }}</div>
					<small v-if="data.monthsCovered > 1" class="text-bluegray-500">
						{{ formatMoney(data.amountInDollars) }} × {{ formatNumber(data.monthsCovered) }} months
					</small>
				</template>
			</Column>
			<template #empty><div class="p-6 text-center">{{ emptyMessage }}</div></template>
		</DataTable>
		<div class="relative flex w-full flex-col gap-2 md:hidden">
			<div v-if="pending" class="flex h-32 items-center justify-center"><i class="pi pi-spin pi-spinner text-xl"/></div>
			<template v-else-if="result.items.length">
				<article v-for="event in result.items" :key="event.id" class="rounded-xl border bg-white p-4 dark:bg-dark-800">
					<div class="flex items-start justify-between gap-3">
						<div>
							<div class="text-sm text-bluegray-500">{{ formatUtcDateForTable(event.date) }}</div>
							<a v-if="event.githubLogin" class="mt-1 inline-block font-semibold text-primary hover:underline" :href="`https://github.com/${event.githubLogin}`" target="_blank" rel="noopener">{{ event.githubLogin }}</a>
							<span v-else class="mt-1 inline-block font-semibold">GitHub ID {{ event.githubId }}</span>
						</div>
						<div class="text-right">
							<div class="font-semibold">{{ formatMoney(event.sponsorshipValue) }}</div>
							<small v-if="event.monthsCovered > 1" class="text-bluegray-500">{{ formatMoney(event.amountInDollars) }} × {{ formatNumber(event.monthsCovered) }} months</small>
						</div>
					</div>
					<div class="mt-3 flex flex-wrap gap-1.5">
						<Tag :value="reasonLabel(event.reason)" :severity="reasonSeverity(event.reason)"/>
						<Tag v-if="event.manual" value="Manual" severity="secondary"/>
					</div>
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
		pageKey: 'sponsorEventsPage',
		limitKey: 'sponsorEventsLimit',
	});
	const search = ref('');
	const type = ref<'all' | SponsorshipReason>('all');
	const filtersPanel = ref();
	const eventSortFields = [ 'date', 'sponsor', 'type', 'sponsorshipValue' ] as const;
	const { sortField, sortOrder, setSort } = useUrlSort<SponsorshipEventSort>({
		defaultField: 'date',
		defaultOrder: -1,
		fieldKey: 'sponsorEventsSort',
		directionKey: 'sponsorEventsDirection',
		fields: eventSortFields,
		pageKey: 'sponsorEventsPage',
	});
	const debouncedSearch = computedDebounced(() => search.value.trim(), 350);
	const typeOptions: Array<{ label: string; value: 'all' | SponsorshipReason }> = [
		{ label: 'All', value: 'all' },
		{ label: 'Recurring sponsorship', value: 'recurring_sponsorship' },
		{ label: 'One-time sponsorship', value: 'one_time_sponsorship' },
		{ label: 'Tier changed', value: 'tier_changed' },
	];
	const requestKey = computed(() => [ props.period, first.value, itemsPerPage.value, debouncedSearch.value, type.value, sortField.value, sortOrder.value ]);
	const { data: response, pending, error } = await useLazyAsyncData(
		() => $directus.request<PageResult<SponsorshipEvent>>(customEndpoint({
			path: '/admin-sponsors/events',
			params: {
				period: props.period,
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
	const emptyMessage = computed(() => anyFilterApplied.value ? 'No results match the current filters' : 'No sponsorship events in this period');

	watch([ debouncedSearch, type, () => props.period ], () => { page.value = 0; });
	useErrorToast(error);

	const formatMoney = (value: number) => `$${formatNumber(value)}`;
	const reasonLabel = (reason: SponsorshipReason) => typeOptions.find(option => option.value === reason)?.label || reason;
	const reasonSeverity = (reason: SponsorshipReason) => reason === 'recurring_sponsorship' ? 'info' : reason === 'one_time_sponsorship' ? 'warn' : 'secondary';
	const onSort = (event: DataTableSortEvent) => {
		if (typeof event.sortField !== 'string' || !eventSortFields.includes(event.sortField as SponsorshipEventSort)) { return; }

		setSort(event.sortField as SponsorshipEventSort, event.sortOrder === -1 ? -1 : 1);
	};
</script>
