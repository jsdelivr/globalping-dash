import type { DataTableSortEvent } from 'primevue/datatable';
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { useUserFilter } from '~/composables/useUserFilter';
import { ONLINE_STATUSES, OFFLINE_STATUSES } from '~/constants/probes';

export type StatusCode = 'all' | 'online' | 'ping-test-failed' | 'offline';
export interface StatusOption {
	name: string;
	code: StatusCode;
	options: Status[];
}

export const useProbeFilters = () => {
	const route = useRoute();
	const { getUserFilter } = useUserFilter();

	const SORTABLE_FIELDS = [ 'default', 'location', 'tags', 'name' ];
	const sortState = ref({ by: 'default', desc: false });

	const inputFilter = ref('');
	const appliedFilter = ref('');

	const statusOptions = ref<StatusOption[]>([
		{ name: 'All', code: 'all', options: [ ...ONLINE_STATUSES, ...OFFLINE_STATUSES ] },
		{ name: 'Online', code: 'online', options: ONLINE_STATUSES },
		{ name: 'Online - ping test failed', code: 'ping-test-failed', options: [ 'ping-test-failed' ] },
		{ name: 'Offline', code: 'offline', options: OFFLINE_STATUSES },
	]);
	const selectedStatus = ref(statusOptions.value[0]);

	const onSortChange = (event: DataTableSortEvent) => {
		const { sortField = '', sortOrder = 1 } = event;

		if (!sortOrder || typeof sortField !== 'string' || !SORTABLE_FIELDS.includes(sortField)) {
			sortState.value = { by: 'default', desc: false };
		} else {
			sortState.value = { by: sortField, desc: sortOrder === -1 };
		}

		onParamChange();
	};

	const onFilterChange = () => {
		appliedFilter.value = inputFilter.value;
		onParamChange();
	};

	const constructQuery = () => ({
		...appliedFilter.value && { filter: appliedFilter.value },
		...sortState.value.by !== 'default' && { by: sortState.value.by },
		...sortState.value.desc && { desc: 'true' },
		...selectedStatus.value.code !== 'all' && { status: selectedStatus.value.code },
	});

	const onParamChange = async () => {
		navigateTo({
			query: constructQuery(),
		});
	};

	const getSortSettings = () => {
		const { by, desc } = sortState.value;

		switch (by) {
			case 'name':
				return [ desc ? '-name' : 'name', 'status' ];
			case 'tags':
				if (desc) {
					return [ '-count(tags)', '-count(systemTags)', 'status', 'name' ];
				}

				return [ 'count(tags)', 'count(systemTags)', 'status', 'name' ];

			case 'location': {
				const fields = [ 'country', 'city', 'network' ];
				return desc ? fields.map(f => `-${f}`) : fields;
			}

			default: {
				return [ 'status', 'name' ];
			}
		}
	};

	const getCurrentFilter = (includeStatus: boolean = false) => ({
		...getUserFilter('userId'),
		...appliedFilter.value && { searchIndex: { _icontains: appliedFilter.value } },
		...includeStatus && selectedStatus.value.code !== 'all' && { status: { _in: selectedStatus.value.options } },
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
			sortState.value = { by, desc: desc === 'true' };
		} else {
			sortState.value = { by: 'default', desc: false };
		}

		const usedOption = statusOptions.value.find(opt => opt.code === status);

		if (usedOption) {
			selectedStatus.value = usedOption;
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
		// handlers
		onSortChange,
		onFilterChange,
		onStatusChange: () => onParamChange(),
		// builders
		getSortSettings,
		getCurrentFilter,
	};
};
