<template>
	<div class="flex min-h-[400px] flex-1 flex-col pb-6">
		<div class="relative flex min-h-[300px] flex-1 flex-col overflow-hidden rounded-md border bg-surface-0 dark:bg-dark-950">
			<ProbeLogControls
				v-model:search-input="searchInput"
				v-model:scope-input="scopeInput"
				v-model:enabled="enabled"
				:rendered-count="Math.min(loadedLogCount, MAX_DISPLAYED_LOGS)"
				:loaded-count="loadedLogCount"
				:filters-active="filtersActive"
				:filter-replacement-pending="filterReplacementPending"
				:request-pending="pending"
				:initial-load-pending="initialLoadPending"
				:load-failed="logsLoadFailed"
				:empty-state-text="emptyStateText"
				@search-input="onSearchInput"
				@scopes-updated="onScopesUpdated"
			/>
			<div v-if="loadedLogCount" class="h-4 max-lg:h-2"/>
			<ProbeLogViewport
				v-model:following-live-tail="followingLiveTail"
				:loaded-logs="loadedLogs"
				:request-pending="pending"
				:initial-load-pending="initialLoadPending"
				:filter-replacement-pending="filterReplacementPending"
				:load-failed="logsLoadFailed"
				:history-load-pending="historyLoadPending"
				:history-load-failed="historyLoadFailed"
				:detached-from-live-edge="detachedFromLiveEdge"
				:empty-state-text="emptyStateText"
				:enabled="enabled"
				:can-load-older-logs="canLoadOlderLogs"
				:request-older-logs="requestOlderLogs"
				:request-latest-bootstrap="requestLatestBootstrap"
				:tail-revision="tailRevision"
			/>
		</div>
	</div>

</template>

<script setup lang="ts">
	// This component coordinates the log controls, data stream, and viewport.
	//
	// useProbeLogFilters keeps the inputs, active filters, and URL query in sync.
	// Once the debounced filters are applied, TabLogs passes them to useProbeLogStream.
	//
	// useProbeLogStream loads the latest logs, polls for new ones, loads older history,
	// and keeps a limited cache in memory.
	//
	// ProbeLogViewport decides which cached logs to render. It also handles scrolling,
	// asks the stream for older logs, and returns to the live tail when needed.
	import { useProbeLogFilters } from '~/composables/useProbeLogFilters';
	import { useProbeLogStream } from '~/composables/useProbeLogStream';
	import { MAX_DISPLAYED_LOGS } from '~/composables/useProbeLogViewport';

	const props = defineProps({
		probeId: {
			type: String,
			required: true,
		},
	});

	const enabled = ref(true);
	const followingLiveTail = ref(true);

	// Owns the filter inputs, validation, debounce, and URL query updates.
	const {
		filter,
		searchInput,
		scopeInput,
		filterUpdatePending,
		filtersActive,
		onSearchInput,
		onScopesUpdated,
		onApplied,
	} = useProbeLogFilters();

	// Owns API requests, live polling, history pages, and the in-memory log cache.
	const {
		loadedLogs,
		loadedLogCount,
		pending,
		initialLoadPending,
		logsLoadFailed,
		filterReplacementPending,
		historyLoadPending,
		historyLoadFailed,
		detachedFromLiveEdge,
		canLoadOlderLogs,
		tailRevision,
		onFiltersApplied,
		requestOlderLogs,
		requestLatestBootstrap,
	} = useProbeLogStream({
		probeId: () => props.probeId,
		filter,
		filterUpdatePending,
		enabled,
		followingLiveTail,
	});

	// Tell the stream only after the debounced filter values become active.
	onApplied(onFiltersApplied);

	const emptyStateText = computed(() => {
		if (!enabled.value) {
			return 'Live tail is paused. Resume it to load logs.';
		}

		if (filtersActive.value) {
			return 'No logs match the active filters.';
		}

		return 'No logs available. A newly adopted probe may take a few minutes to sync the logs.';
	});
</script>
