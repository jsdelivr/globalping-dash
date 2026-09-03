import { createEventHook } from '@vueuse/core';
import debounce from 'lodash/debounce';

export const SEARCH_MAX_LENGTH = 128;
export const SCOPE_MAX_LENGTH = 64;
export const SCOPES_MAX_SERIALIZED_LENGTH = 1024;

export const canAppendProbeLogScope = (scopes: string[], scope: string) => {
	const separatorLength = scopes.length ? 1 : 0;

	return scopes.join(',').length + separatorLength + scope.length <= SCOPES_MAX_SERIALIZED_LENGTH;
};

export interface ProbeLogFilter {
	search: string;
	scopes: string[];
}

const SEARCH_QUERY_KEY = 'search';
const SCOPES_QUERY_KEY = 'scopes';

const getQueryValues = (value: unknown) => {
	if (Array.isArray(value)) {
		return value.filter((item): item is string => typeof item === 'string');
	}

	return typeof value === 'string' ? [ value ] : [];
};

const normalizeSearch = (value: string) => value.slice(0, SEARCH_MAX_LENGTH);

const normalizeScopes = (values: string[]) => {
	const scopes: string[] = [];

	for (const value of values.flatMap(value => value.split(','))) {
		const scope = value.trim();

		if (!scope
			|| scope.length > SCOPE_MAX_LENGTH
			|| scopes.includes(scope)
			|| !canAppendProbeLogScope(scopes, scope)) {
			continue;
		}

		scopes.push(scope);
	}

	return scopes;
};

const getFilterFromQuery = (search: unknown, scopes: unknown): ProbeLogFilter => ({
	search: normalizeSearch(getQueryValues(search)[0] ?? ''),
	scopes: normalizeScopes(getQueryValues(scopes)),
});

export const useProbeLogFilters = () => {
	const route = useRoute();
	const initialFilter = getFilterFromQuery(route.query[SEARCH_QUERY_KEY], route.query[SCOPES_QUERY_KEY]);
	const filtersApplied = createEventHook<boolean>();
	const filter = ref(initialFilter);
	const searchInput = ref(initialFilter.search);
	const scopeInput = ref([ ...initialFilter.scopes ]);
	const filterUpdatePending = ref(false);
	const filtersActive = computed(() => Boolean(filter.value.search || filter.value.scopes.length));
	const pendingQueryUpdates = new Set<string>();

	const filtersEqual = (search: string, scopes: string[]) => {
		return filter.value.search === search
			&& filter.value.scopes.length === scopes.length
			&& filter.value.scopes.every(scope => scopes.includes(scope));
	};

	const getQueryUpdateKey = (search: string, scopes: string[]) => JSON.stringify([ search, scopes.join(',') ]);

	const queryMatchesFilters = (search: string, scopes: string[]) => {
		return route.query[SEARCH_QUERY_KEY] === (search || undefined)
			&& route.query[SCOPES_QUERY_KEY] === (scopes.length ? scopes.join(',') : undefined);
	};

	const updateQuery = (search: string, scopes: string[]) => {
		const queryUpdateKey = getQueryUpdateKey(search, scopes);
		pendingQueryUpdates.add(queryUpdateKey);

		const navigation = navigateTo({
			query: {
				...route.query,
				[SEARCH_QUERY_KEY]: search || undefined,
				[SCOPES_QUERY_KEY]: scopes.length ? scopes.join(',') : undefined,
			},
		}, { replace: true });

		void Promise.resolve(navigation).finally(() => {
			pendingQueryUpdates.delete(queryUpdateKey);
		});
	};

	const applyFilters = (search: string, scopes: string[], updateRoute: boolean) => {
		const normalizedSearch = normalizeSearch(search);
		const normalizedScopes = normalizeScopes(scopes);
		const changed = !filtersEqual(normalizedSearch, normalizedScopes);

		if (changed) {
			filter.value = {
				search: normalizedSearch,
				scopes: normalizedScopes,
			};
		}

		if (updateRoute && !queryMatchesFilters(normalizedSearch, normalizedScopes)) {
			updateQuery(normalizedSearch, normalizedScopes);
		}

		void filtersApplied.trigger(changed);
	};

	const applyFiltersDebounced = debounce(() => {
		filterUpdatePending.value = false;
		const search = normalizeSearch(searchInput.value);
		const scopes = normalizeScopes(scopeInput.value);

		applyFilters(search, scopes, true);
	}, 300);

	const scheduleFilterUpdate = () => {
		filterUpdatePending.value = true;
		applyFiltersDebounced();
	};

	const onSearchInput = scheduleFilterUpdate;

	const onScopesUpdated = (scopes: string[]) => {
		scopeInput.value = normalizeScopes(scopes);
		scheduleFilterUpdate();
	};

	watch(
		[ () => route.query[SEARCH_QUERY_KEY], () => route.query[SCOPES_QUERY_KEY] ],
		([ searchQuery, scopesQuery ]) => {
			const { search, scopes } = getFilterFromQuery(searchQuery, scopesQuery);

			if (pendingQueryUpdates.delete(getQueryUpdateKey(search, scopes))) {
				return;
			}

			applyFiltersDebounced.cancel();
			filterUpdatePending.value = false;
			searchInput.value = search;
			scopeInput.value = scopes;
			applyFilters(search, scopes, false);
		},
		{ flush: 'sync' },
	);

	onUnmounted(() => {
		applyFiltersDebounced.cancel();
	});

	return {
		filter,
		searchInput,
		scopeInput,
		filterUpdatePending,
		filtersActive,
		onSearchInput,
		onScopesUpdated,
		onApplied: filtersApplied.on,
	};
};
