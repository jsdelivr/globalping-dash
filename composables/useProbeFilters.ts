import type { DataTableSortEvent } from 'primevue/datatable';
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { useUserFilter } from '~/composables/useUserFilter';
import { ONLINE_STATUSES, OFFLINE_STATUSES } from '~/constants/probes';

export type StatusCode = 'all' | 'online' | 'ping-test-failed' | 'offline' | 'online-outdated';
export interface StatusOption {
	name: string;
	code: StatusCode;
	options: Status[];
	outdatedOnly?: boolean;
}

export type SortOption = 'location' | 'tags' | 'name';

export const SORTABLE_FIELDS: string[] = [ 'name', 'location', 'tags' ] as const;

export const useProbeFilters = () => {
	const route = useRoute();
	const { getUserFilter } = useUserFilter();

	const sortState = ref<{ by: SortOption; desc: boolean }>({ by: 'name', desc: false });

	const inputFilter = ref('');
	const appliedFilter = ref('');

	const statusOptions = ref<StatusOption[]>([
		{ name: 'All', code: 'all', options: [ ...ONLINE_STATUSES, ...OFFLINE_STATUSES ] },
		{ name: 'Online', code: 'online', options: ONLINE_STATUSES },
		{ name: 'Online - outdated', code: 'online-outdated', options: ONLINE_STATUSES, outdatedOnly: true },
		{ name: 'Online - ping test failed', code: 'ping-test-failed', options: [ 'ping-test-failed' ] },
		{ name: 'Offline', code: 'offline', options: OFFLINE_STATUSES },
	]);
	const selectedStatus = ref(statusOptions.value[0]);

	const anyFilterApplied = computed(() => sortState.value.by !== 'name' || sortState.value.desc || !!appliedFilter.value || selectedStatus.value.code !== 'all');

	const onSortChange = (event: DataTableSortEvent) => {
		const { sortField = '', sortOrder = 1 } = event;

		if (!sortOrder || typeof sortField !== 'string' || !SORTABLE_FIELDS.includes(sortField)) {
			sortState.value = { by: 'name', desc: false };
		} else {
			sortState.value = { by: sortField as SortOption, desc: sortOrder === -1 };
		}

		onParamChange();
	};

	const onFilterChange = () => {
		appliedFilter.value = inputFilter.value;
		onParamChange();
	};

	const onBatchChange = (filter: string, by: SortOption, desc: boolean, status: StatusCode) => {
		appliedFilter.value = filter;
		inputFilter.value = filter;
		sortState.value = { by, desc };
		const changedStatus = statusOptions.value.find(el => el.code === status);

		if (changedStatus) {
			selectedStatus.value = changedStatus;
		}

		onParamChange();
	};

	const constructQuery = () => ({
		...appliedFilter.value && { filter: appliedFilter.value },
		...sortState.value.by !== 'name' && { by: sortState.value.by },
		...sortState.value.desc && { desc: 'true' },
		...selectedStatus.value.code !== 'all' && { status: selectedStatus.value.code },
	});

	const onParamChange = () => {
		navigateTo({
			query: constructQuery(),
		});
	};

	const getSortSettings = () => {
		const { by, desc } = sortState.value;

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
		...appliedFilter.value && { searchIndex: { _icontains: appliedFilter.value } },
		...includeStatus && selectedStatus.value.code !== 'all' && { status: { _in: selectedStatus.value.options } },
		...includeStatus && selectedStatus.value.code === 'online-outdated' && { isOutdated: { _eq: true } },
	});

	watch([
		() => route.query.filter,
		() => route.query.by,
		() => route.query.desc,
		() => route.query.status,
	], async ([ filter, by, desc, status ]) => {
		if (typeof filter === 'string') {
			inputFilter.value = filter;
			appliedFilter.value = filter;
		} else {
			inputFilter.value = '';
			appliedFilter.value = '';
		}

		if (typeof by === 'string' && SORTABLE_FIELDS.includes(by)) {
			sortState.value = { by: by as SortOption, desc: desc === 'true' };
		} else {
			sortState.value = { by: 'name', desc: desc === 'true' };
		}

		const statusFilter = statusOptions.value.find(opt => opt.code === status);

		if (statusFilter) {
			selectedStatus.value = statusFilter;
		} else {
			selectedStatus.value = statusOptions.value[0];
		}
	}, { immediate: true });

	return {
		// state
		sortState,
		inputFilter,
		appliedFilter,
		statusOptions,
		selectedStatus,
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
