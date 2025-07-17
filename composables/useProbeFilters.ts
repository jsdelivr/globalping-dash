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
	const sortState = ref({ sortField: 'default', sortOrder: 1 });

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
			if (typeof query.filterBy === 'string') {
				inputFilter.value = query.filterBy;
				appliedFilter.value = query.filterBy;
			}

			if (typeof query.sortField === 'string' && SORTABLE_FIELDS.includes(query.sortField)) {
				const order = Number(query.sortOrder);
				sortState.value = { sortField: query.sortField, sortOrder: order === -1 ? -1 : 1 };
			}

			const usedOption = statusOptions.value.find(opt => opt.code === query.status);

			if (usedOption) {
				selectedStatus.value = usedOption;
			}
		},
		{ immediate: true },
	);

	const onSortChange = (event: DataTableSortEvent) => {
		const { sortField = '', sortOrder = 1 } = event;


		if (!sortOrder || typeof sortField !== 'string' || !SORTABLE_FIELDS.includes(sortField)) {
			return;
		}

		sortState.value = { sortField, sortOrder };
		resetPage();
	};

	const onFilterChange = (event: KeyboardEvent) => {
		if (event.key === 'Enter') {
			appliedFilter.value = inputFilter.value;
			resetPage();
		}
	};

	const resetPage = async () => {
		const prevPage = route.query.page ?? '1';

		await router.replace({
			query: {
				...route.query,
				filterBy: appliedFilter.value,
				...sortState.value,
				status: selectedStatus.value.code,
				page: 1,
			},
		});

		// when navigating from a non-first page the refetch is performed automatically via the page watcher
		if (prevPage === '1') {
			await fetch();
		}
	};

	const getSortSettings = () => {
		const { sortField, sortOrder } = sortState.value;

		switch (sortField) {
			case 'name':
				return [ sortOrder === -1 ? '-name' : 'name', 'status' ];
			case 'tags':
				if (sortOrder === -1) {
					return [ '-count(tags)', '-count(systemTags)', 'status', 'name' ];
				}

				return [ 'count(tags)', 'count(systemTags)', 'status', 'name' ];

			case 'location': {
				const fields = [ 'country', 'city', 'network' ];
				return sortOrder === -1 ? fields.map(f => `-${f}`) : fields;
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
