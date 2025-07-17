import type { DataTableSortEvent } from 'primevue/datatable';
import { ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserFilter } from '~/composables/useUserFilter';
import { ONLINE_STATUSES, OFFLINE_STATUSES } from '~/constants/probes';

type StatusCode = 'all' | 'online' | 'ping-test-failed' | 'offline';
interface StatusOption {
	name: string;
	count: number;
	code: StatusCode;
	options: Status[];
}

interface useProbeFiltersInterface {
	fetch: () => Promise<void>;
}

export const useProbeFilters = ({ fetch }: useProbeFiltersInterface) => {
	const router = useRouter();
	const route = useRoute();
	const { getUserFilter } = useUserFilter();

	const SORTABLE_FIELDS = [ 'default', 'location', 'tags', 'name' ];
	const sortState = ref({ by: 'default', desc: true });

	const inputFilter = ref('');
	const appliedFilter = ref('');

	const statusOptions = ref<StatusOption[]>([
		{ name: 'All', count: 0, code: 'all', options: [ ...ONLINE_STATUSES, ...OFFLINE_STATUSES ] },
		{ name: 'Online', count: 0, code: 'online', options: ONLINE_STATUSES },
		{ name: 'Ping test failed', count: 0, code: 'ping-test-failed', options: [ 'ping-test-failed' ] },
		{ name: 'Offline', count: 0, code: 'offline', options: OFFLINE_STATUSES },
	]);
	const selectedStatus = ref(statusOptions.value[0]);

	// apply filters from URL params
	watch(
		() => route.query,
		(query) => {
			const { filter = '', by = 'default', desc = '', status = 'all' } = query;

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
		},
		{ immediate: true },
	);

	const onSortChange = (event: DataTableSortEvent) => {
		const { sortField = '', sortOrder = 1 } = event;

		if (!sortOrder || typeof sortField !== 'string' || !SORTABLE_FIELDS.includes(sortField)) {
			sortState.value = { by: 'default', desc: false };
		} else {
			sortState.value = { by: sortField, desc: sortOrder === -1 };
		}

		resetPage();
	};

	const onFilterChange = () => {
		appliedFilter.value = inputFilter.value;
		resetPage();
	};

	const constructQuery = () => {
		const { value, by, desc, status, page, ...queryRemainder } = route.query;

		return {
			...queryRemainder,
			...appliedFilter.value && { filter: appliedFilter.value },
			...sortState.value.by !== 'default' && { by: sortState.value.by },
			...sortState.value.desc && { desc: 'true' },
			...selectedStatus.value.code !== 'all' && { status: selectedStatus.value.code },
		};
	};

	const resetPage = async () => {
		const prevPage = route.query.page ?? '1';

		await router.push({
			query: constructQuery(),
		});

		// when navigating from a non-first page the refetch is performed automatically via the page watcher
		if (prevPage === '1') {
			await fetch();
		}
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
		onStatusChange: resetPage,
		// builders
		getSortSettings,
		getCurrentFilter,
	};
};
