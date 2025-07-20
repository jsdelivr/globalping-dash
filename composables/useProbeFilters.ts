import type { DataTableSortEvent } from 'primevue/datatable';
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { useUserFilter } from '~/composables/useUserFilter';
import { ONLINE_STATUSES, OFFLINE_STATUSES } from '~/constants/probes';

export type StatusCode = 'all' | 'online' | 'ping-test-failed' | 'offline' | 'online-outdated';

type StatusOption = {
	name: string;
	options: Status[];
	outdatedOnly?: boolean;
};
export interface Filter {
	search: string;
	status: StatusCode;
	by: string;
	desc: boolean;
}

const DEFAULT_FILTER: Filter = { search: '', status: 'all', by: 'name', desc: false } as const;

export const SORTABLE_FIELDS: string[] = [ 'name', 'location', 'tags' ] as const;

export const STATUS_MAP: Record<string, StatusOption> = {
	'all': { name: 'All', options: [ ...ONLINE_STATUSES, ...OFFLINE_STATUSES ] },
	'online': { name: 'Online', options: ONLINE_STATUSES },
	'online-outdated': { name: 'Online - outdated', options: ONLINE_STATUSES, outdatedOnly: true },
	'ping-test-failed': { name: 'Online - ping test failed', options: [ 'ping-test-failed' ] },
	'offline': { name: 'Offline', options: OFFLINE_STATUSES },
} as const;


export const useProbeFilters = () => {
	const route = useRoute();
	const { getUserFilter } = useUserFilter();

	const filter = ref<Filter>({ ...DEFAULT_FILTER });
	const anyFilterApplied = computed(() => (Object.keys(DEFAULT_FILTER) as Array<keyof Filter>).some(key => filter.value[key] !== DEFAULT_FILTER[key]));

	const onSortChange = (event: DataTableSortEvent) => {
		const { sortField = '', sortOrder = 1 } = event;

		if (!sortOrder || typeof sortField !== 'string' || !SORTABLE_FIELDS.includes(sortField)) {
			filter.value.by = 'name';
			filter.value.desc = false;
		} else {
			filter.value.by = sortField;
			filter.value.desc = sortOrder === -1;
		}

		onParamChange();
	};

	const onFilterChange = (val: string) => {
		filter.value.search = val;
		onParamChange();
	};

	const onBatchChange = (newValues: Filter) => {
		filter.value = newValues;
		onParamChange();
	};

	const constructQuery = () => ({
		...filter.value.search && { filter: filter.value.search },
		...filter.value.by !== 'name' && { by: filter.value.by },
		...filter.value.desc && { desc: 'true' },
		...filter.value.status !== 'all' && { status: filter.value.status },
	});

	const onParamChange = () => {
		navigateTo({
			query: constructQuery(),
		});
	};

	const getSortSettings = () => {
		const { by, desc } = filter.value;

		switch (by) {
			case 'name':
				return [ desc ? '-name' : 'name' ];

			case 'tags':
				if (desc) {
					return [ '-count(tags)', '-count(systemTags)', 'name' ];
				}

				return [ 'count(tags)', 'count(systemTags)', 'name' ];

			case 'location': {
				const fields = [ 'country', 'city', 'network' ];
				return desc ? fields.map(f => `-${f}`) : fields;
			}
		}
	};

	const getCurrentFilter = (includeStatus: boolean = false) => ({
		...getUserFilter('userId'),
		...filter.value.search && { searchIndex: { _icontains: filter.value.search } },
		...includeStatus && filter.value.status !== 'all' && { status: { _in: STATUS_MAP[filter.value.status].options } },
		...includeStatus && filter.value.status === 'online-outdated' && { isOutdated: { _eq: true } },
	});

	watch([
		() => route.query.filter,
		() => route.query.by,
		() => route.query.desc,
		() => route.query.status,
	], async ([ search, by, desc, status ]) => {
		if (typeof search === 'string') {
			filter.value.search = search;
		} else {
			filter.value.search = DEFAULT_FILTER.search;
		}

		if (typeof by === 'string' && SORTABLE_FIELDS.includes(by)) {
			filter.value.by = by;
		} else {
			filter.value.by = DEFAULT_FILTER.by;
		}

		if (typeof desc === 'string' && [ 'true', 'false' ].includes(desc)) {
			filter.value.desc = desc === 'true';
		} else {
			filter.value.desc = DEFAULT_FILTER.desc;
		}

		if (typeof status === 'string' && Object.keys(STATUS_MAP).includes(status)) {
			filter.value.status = status as StatusCode;
		} else {
			filter.value.status = DEFAULT_FILTER.status;
		}
	}, { immediate: true });

	return {
		// state
		filter,
		anyFilterApplied,
		// handlers
		onSortChange,
		onFilterChange,
		onStatusChange: () => onParamChange(),
		onBatchChange,
		// builders
		getSortSettings,
		getCurrentFilter,
	};
};
