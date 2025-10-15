import type { DataTableSortEvent } from 'primevue/datatable';
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { useUserFilter } from '~/composables/useUserFilter';
import { ONLINE_STATUSES, OFFLINE_STATUSES } from '~/constants/probes';
import { useAuth } from '~/store/auth';

export type StatusCode = 'all' | 'online' | 'ping-test-failed' | 'offline' | 'online-outdated';
export type AdoptionOption = 'all' | 'adopted' | 'non-adopted';
export type ProbeTypeOption = 'all' | 'hardware' | 'software';

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
	adoption: AdoptionOption;
	probeType: ProbeTypeOption;
}

const DEFAULT_FILTER: Filter = { search: '', status: 'all', by: 'name', desc: false, adoption: 'all', probeType: 'all' } as const;

export const SORTABLE_FIELDS: string[] = [ 'name', 'location', 'tags' ] as const;

export const STATUS_MAP: Record<StatusCode, StatusOption> = {
	'all': { name: 'All', options: [ ...ONLINE_STATUSES, ...OFFLINE_STATUSES ] },
	'online': { name: 'Online', options: ONLINE_STATUSES },
	'online-outdated': { name: 'Online - outdated', options: ONLINE_STATUSES, outdatedOnly: true },
	'ping-test-failed': { name: 'Online - ping test failed', options: [ 'ping-test-failed' ] },
	'offline': { name: 'Offline', options: OFFLINE_STATUSES },
} as const;

export const ADOPTION_OPTIONS: string[] = [ 'all', 'adopted', 'non-adopted' ] as const;
export const PROBE_TYPE_OPTIONS: string[] = [ 'all', 'hardware', 'software' ] as const;
const ADMIN_FILTERS: (keyof Filter)[] = [ 'adoption', 'probeType' ] as const;

interface ProbeFiltersOptions {
	active?: MaybeRefOrGetter<boolean>;
}

export const useProbeFilters = ({ active = () => true }: ProbeFiltersOptions = {}) => {
	const route = useRoute();
	const auth = useAuth();
	const { getUserFilter } = useUserFilter();

	const filter = ref<Filter>({ ...DEFAULT_FILTER });
	const anyFilterApplied = computed(() => (Object.keys(DEFAULT_FILTER) as Array<keyof Filter>).some(key => filter.value[key] !== DEFAULT_FILTER[key]));
	const anyAdminFilterApplied = computed(() => ADMIN_FILTERS.some(key => !isDefault(key)));

	const onSortChange = (event: DataTableSortEvent) => {
		const { sortField = '', sortOrder = 1 } = event;

		if (!sortOrder || typeof sortField !== 'string' || !SORTABLE_FIELDS.includes(sortField)) {
			filter.value.by = DEFAULT_FILTER.by;
			filter.value.desc = DEFAULT_FILTER.desc;
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
		...!isDefault('by') && { by: filter.value.by },
		...filter.value.desc && { desc: 'true' },
		...!isDefault('status') && { status: filter.value.status },
		...auth.adminMode && !isDefault('adoption') && { adoption: filter.value.adoption },
		...auth.adminMode && !isDefault('probeType') && { type: filter.value.probeType },
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

	const getCurrentFilter = (ignoredFields: Array<keyof Filter> = []) => getDirectusFilter(filter, ignoredFields);

	const getDirectusFilter = (filter: MaybeRefOrGetter<Filter>, ignoredFields: Array<keyof Filter> = []) => {
		const filterValue = toValue(filter);

		return {
			...getUserFilter('userId'),
			...filterValue.search && { searchIndex: { _icontains: filterValue.search } },
			...!ignoredFields.includes('status') && !isDefault('status', filter) && { status: { _in: STATUS_MAP[filterValue.status].options } },
			...!ignoredFields.includes('status') && filterValue.status === 'online-outdated' && { isOutdated: { _eq: true } },
			...!ignoredFields.includes('adoption') && auth.adminMode && !isDefault('adoption', filter) && {
				userId: filterValue.adoption === 'adopted' ? { _neq: null } : { _eq: null },
			},
			...!ignoredFields.includes('probeType') && auth.adminMode && !isDefault('probeType', filter) && {
				hardwareDevice: filterValue.probeType === 'hardware' ? { _neq: null } : { _eq: null },
			},
		};
	};

	const isDefault = (field: keyof Filter, filterObj: MaybeRefOrGetter<Filter> = filter) => {
		return toValue(filterObj)[field] === DEFAULT_FILTER[field];
	};

	watch([
		() => route.query.filter,
		() => route.query.by,
		() => route.query.desc,
		() => route.query.status,
		() => route.query.adoption,
		() => route.query.type,
	], async ([ search, by, desc, status, adoption, probeType ]) => {
		if (!toValue(active)) {
			return;
		}

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

		if (typeof status === 'string' && Object.hasOwn(STATUS_MAP, status)) {
			filter.value.status = status as StatusCode;
		} else {
			filter.value.status = DEFAULT_FILTER.status;
		}

		if (typeof adoption === 'string' && ADOPTION_OPTIONS.includes(adoption) && auth.adminMode) {
			filter.value.adoption = adoption as AdoptionOption;
		} else {
			filter.value.adoption = DEFAULT_FILTER.adoption;
		}

		if (typeof probeType === 'string' && PROBE_TYPE_OPTIONS.includes(probeType) && auth.adminMode) {
			filter.value.probeType = probeType as ProbeTypeOption;
		} else {
			filter.value.probeType = DEFAULT_FILTER.probeType;
		}
	}, { immediate: true });

	return {
		// state
		filter,
		anyFilterApplied,
		anyAdminFilterApplied,
		// handlers
		onSortChange,
		onFilterChange,
		onParamChange,
		onBatchChange,
		// builders
		getSortSettings,
		getCurrentFilter,
		getDirectusFilter,
		// helpers
		isDefault,
	};
};
