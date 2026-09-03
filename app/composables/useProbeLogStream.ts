import type { ProbeLogFilter } from '~/composables/useProbeLogFilters';
import { sendToast } from '~/utils/send-toast';

const REFRESH_INTERVAL = 2000; // ms
const MAX_STORED_LOGS = 20_000;

// The local key stays stable when API pages are added or removed.
export type StoredProbeLog = ProbeLog & { _key: number };

// The viewport uses these callbacks to keep its scroll position during a history request.
export interface ProbeLogHistoryLifecycle {
	onStart: () => void;
	onCommit: (result: { prepended: boolean }) => void;
	onCancel: () => void;
}

// A bootstrap replaces the cache, live appends newer logs, and history prepends older logs.
type RequestKind = 'bootstrap' | 'live' | 'history';

interface LogChunk {
	// Keep each API page together so we can trim complete pages and retain their history cursor.
	logs: StoredProbeLog[];
	firstId: string | null;
}

interface ActiveRequest {
	controller: AbortController;
	kind: RequestKind;
}

interface ProbeLogStreamOptions {
	probeId: MaybeRefOrGetter<string>;
	filter: MaybeRefOrGetter<ProbeLogFilter>;
	filterUpdatePending: MaybeRefOrGetter<boolean>;
	enabled: Ref<boolean>;
	followingLiveTail: Ref<boolean>;
}

export const useProbeLogStream = ({
	probeId,
	filter,
	filterUpdatePending,
	enabled,
	followingLiveTail,
}: ProbeLogStreamOptions) => {
	const config = useRuntimeConfig();
	const refreshTimeout = ref<ReturnType<typeof setTimeout>>();
	// Logs are stored as API pages, ordered from oldest to newest.
	const chunks = ref<LogChunk[]>([]);
	const lastFetchedId = ref<string | null>(null);
	const initialLoadPending = ref(true);
	const pending = ref(false);
	const logsLoadFailed = ref(false);
	const filterReplacementPending = ref(false);
	const historyLoadPending = ref(false);
	const historyLoadFailed = ref(false);
	const hasOlderLogs = ref(false);
	// A detached cache no longer contains the real newest logs and needs a fresh bootstrap.
	const detachedFromLiveEdge = ref(false);
	// The viewport watches this counter to know when it should move to the bottom.
	const tailRevision = ref(0);

	// Only one API request may run at a time. The flags below remember what should run next.
	let activeRequest: ActiveRequest | undefined;
	let activeHistoryLifecycle: ProbeLogHistoryLifecycle | undefined;
	let queuedHistoryLifecycle: ProbeLogHistoryLifecycle | undefined;
	let nextLogKey = 0;
	// A bootstrap does not use the live cursor and replaces the current cache.
	let needsBootstrap = true;
	// These flags queue work that could not start because another request was active.
	let historyRequested = false;
	let returnToLiveRequested = false;
	// Remember to fetch once a pending filter update has settled.
	let refreshAfterPendingFilter = false;

	const loadedLogs = computed(() => chunks.value.flatMap(chunk => chunk.logs));
	const loadedLogCount = computed(() => loadedLogs.value.length);

	// Do not mix a history request with filters that are about to change.
	const canLoadOlderLogs = computed(() => hasOlderLogs.value
		&& !filterReplacementPending.value
		&& !toValue(filterUpdatePending)
		&& oldestStoredId() !== null);

	const getLoadedCount = (items: LogChunk[]) => items.reduce((count, chunk) => count + chunk.logs.length, 0);

	const createChunk = (response: ProbeLogsResponse): LogChunk | null => {
		if (!response.logs.length) {
			return null;
		}

		return {
			// Log rows have no ID, so give each one a stable key for Vue and scroll anchoring.
			logs: response.logs.map(log => ({ ...log, _key: nextLogKey++ })),
			firstId: response.firstId,
		};
	};

	// Live tail keeps the newest pages, so discard old pages when the cache is full.
	const trimOldestChunks = (items: LogChunk[]) => {
		const retained = [ ...items ];
		let count = getLoadedCount(retained);
		let evicted = false;

		while (count > MAX_STORED_LOGS && retained.length) {
			count -= retained.shift()!.logs.length;
			evicted = true;
		}

		return { chunks: retained, evicted };
	};

	// History keeps the oldest pages in view, so discard new pages when the cache is full.
	const trimNewestChunks = (items: LogChunk[]) => {
		const retained = [ ...items ];
		let count = getLoadedCount(retained);
		let evicted = false;

		while (count > MAX_STORED_LOGS && retained.length) {
			count -= retained.pop()!.logs.length;
			evicted = true;
		}

		return { chunks: retained, evicted };
	};

	const cancelActiveHistoryLifecycle = () => {
		const lifecycle = activeHistoryLifecycle;
		activeHistoryLifecycle = undefined;
		lifecycle?.onCancel();
	};

	const abortActiveRequest = (kinds?: RequestKind[]) => {
		if (!activeRequest || (kinds && !kinds.includes(activeRequest.kind))) {
			return;
		}

		const request = activeRequest;
		activeRequest = undefined;
		request.controller.abort();
		pending.value = false;

		if (request.kind === 'history') {
			// Let the viewport forget the scroll anchor saved for this request.
			historyLoadPending.value = false;
			cancelActiveHistoryLifecycle();
		}
	};

	function scheduleRefresh () {
		clearTimeout(refreshTimeout.value);

		// Poll only while live tail is active and connected to the newest data.
		if (!enabled.value
			|| ((!followingLiveTail.value || detachedFromLiveEdge.value) && !returnToLiveRequested)
			|| activeRequest) {
			return;
		}

		refreshTimeout.value = setTimeout(() => {
			// avoid polling with stale filters; reschedule in case the debounced update applies no change.
			if (toValue(filterUpdatePending)) {
				scheduleRefresh();
				return;
			}

			void refreshLogs();
		}, REFRESH_INTERVAL);
	}

	// All request types share one slot so their responses cannot race each other.
	const beginRequest = (kind: RequestKind) => {
		if (activeRequest) {
			return null;
		}

		const request: ActiveRequest = {
			controller: new AbortController(),
			kind,
		};

		activeRequest = request;
		pending.value = true;

		if (kind === 'history') {
			historyLoadPending.value = true;
			historyLoadFailed.value = false;
		}

		return request;
	};

	const isRequestCurrent = (request: ActiveRequest) => {
		return activeRequest === request && !request.controller.signal.aborted;
	};

	function finishRequest (request: ActiveRequest) {
		if (activeRequest !== request) {
			return;
		}

		activeRequest = undefined;
		pending.value = false;

		if (request.kind === 'history') {
			historyLoadPending.value = false;
		} else {
			initialLoadPending.value = false;
		}

		arbitrateNextRequest();
	}

	// Pick the next queued action after the current request finishes.
	function arbitrateNextRequest () {
		if (activeRequest) {
			return;
		}

		if (returnToLiveRequested && enabled.value) {
			// Returning to live wins because the user has moved back to the bottom.
			void refreshLogs();
			return;
		}

		if (historyRequested && canLoadOlderLogs.value) {
			const lifecycle = queuedHistoryLifecycle;
			historyRequested = false;
			queuedHistoryLifecycle = undefined;

			if (lifecycle) {
				void loadOlderLogs(lifecycle);
				return;
			}
		}

		historyRequested = false;
		queuedHistoryLifecycle = undefined;
		scheduleRefresh();
	}

	const buildFilterParams = () => {
		const params: Record<string, string> = {};
		const currentFilter = toValue(filter);

		if (currentFilter.scopes.length) {
			params.scopes = currentFilter.scopes.join(',');
		}

		if (currentFilter.search) {
			params.search = currentFilter.search;
		}

		return params;
	};

	const fetchLogs = (request: ActiveRequest, params: Record<string, string>) => {
		return $fetch<ProbeLogsResponse>(`${config.public.gpApiUrl}/v1/probes/${toValue(probeId)}/logs`, {
			params,
			credentials: 'include',
			signal: request.controller.signal,
		});
	};

	// Cursor values can be larger than JavaScript's safe integer range.
	const isExclusiveRange = (after: string, before: string) => {
		try {
			return BigInt(before) > BigInt(after);
		} catch {
			return false;
		}
	};

	const isCursorWithinExclusiveRange = (cursor: string, after: string, before: string) => {
		try {
			const cursorId = BigInt(cursor);

			return cursorId > BigInt(after) && cursorId < BigInt(before);
		} catch {
			return false;
		}
	};

	// A busy probe can produce more than one API page between polls. Fetch the missing pages now.
	const collectLiveChunks = async (request: ActiveRequest, response: ProbeLogsResponse, after: string) => {
		const tailChunk = createChunk(response);
		const collected = tailChunk ? [ tailChunk ] : [];
		let collectedCount = tailChunk?.logs.length ?? 0;
		let recoveryCapped = false;
		let currentResponse = response;

		while (currentResponse.hasOlder) {
			const before = currentResponse.firstId;

			if (!before || !isExclusiveRange(after, before)) {
				throw new Error('Invalid probe-log overflow range.');
			}

			if (collectedCount >= MAX_STORED_LOGS) {
				// Stop recovery at the cache limit instead of starting an unbounded request chain.
				recoveryCapped = true;
				break;
			}

			const boundedResponse = await fetchLogs(request, {
				...buildFilterParams(),
				after,
				before,
			});

			if (!isRequestCurrent(request)) {
				throw new DOMException('Request aborted.', 'AbortError');
			}

			const recoveredChunk = createChunk(boundedResponse);

			if (recoveredChunk) {
				collected.unshift(recoveredChunk);
				collectedCount += recoveredChunk.logs.length;
			}

			if (boundedResponse.hasOlder
				&& (!boundedResponse.firstId || !isCursorWithinExclusiveRange(boundedResponse.firstId, after, before))) {
				throw new Error('Probe-log overflow recovery made no progress.');
			}

			currentResponse = boundedResponse;
		}

		return { chunks: collected, recoveryCapped };
	};

	// A bootstrap is a fresh latest snapshot, so it replaces every cached page.
	const commitBootstrap = (response: ProbeLogsResponse) => {
		const chunk = createChunk(response);

		chunks.value = chunk ? [ chunk ] : [];
		lastFetchedId.value = response.lastId;
		hasOlderLogs.value = Boolean(chunk) && response.hasOlder;
		detachedFromLiveEdge.value = false;
		followingLiveTail.value = true;
		needsBootstrap = false;
		returnToLiveRequested = false;
		filterReplacementPending.value = false;
		historyLoadFailed.value = false;
		tailRevision.value++;
	};

	// Keep the current view still, but remember that its newest row is no longer the real tail.
	const detachFromLiveTail = (response: ProbeLogsResponse) => {
		if (response.lastId !== null) {
			lastFetchedId.value = response.lastId;
		}

		detachedFromLiveEdge.value = true;
		followingLiveTail.value = false;
		needsBootstrap = true;
		clearTimeout(refreshTimeout.value);
	};

	// Merge polled pages without losing the user's place or growing the cache forever.
	const commitLive = (response: ProbeLogsResponse, collected: { chunks: LogChunk[]; recoveryCapped: boolean }) => {
		const wasFollowingLiveTail = followingLiveTail.value && !detachedFromLiveEdge.value;
		const incomingCount = getLoadedCount(collected.chunks);

		if (response.lastId !== null) {
			lastFetchedId.value = response.lastId;
		}

		if (!incomingCount) {
			return;
		}

		if (!wasFollowingLiveTail && (collected.recoveryCapped || loadedLogCount.value + incomingCount > MAX_STORED_LOGS)) {
			// Do not evict the history the user is reading just to append newer logs.
			detachFromLiveTail(response);
			return;
		}

		if (collected.recoveryCapped) {
			const retained = trimOldestChunks(collected.chunks);

			chunks.value = retained.chunks;
			hasOlderLogs.value = true;
		} else {
			const combined = [ ...chunks.value, ...collected.chunks ];

			if (wasFollowingLiveTail) {
				const retained = trimOldestChunks(combined);

				chunks.value = retained.chunks;

				if (retained.evicted) {
					hasOlderLogs.value = true;
				}
			} else {
				chunks.value = combined;
			}
		}

		if (wasFollowingLiveTail) {
			followingLiveTail.value = true;
			tailRevision.value++;
		}
	};

	// Load a fresh snapshot when needed; otherwise continue from the last live cursor.
	async function refreshLogs () {
		if (!enabled.value
			|| toValue(filterUpdatePending)
			|| activeRequest
			|| (!followingLiveTail.value && !returnToLiveRequested)) {
			return;
		}

		if (detachedFromLiveEdge.value && !returnToLiveRequested) {
			return;
		}

		const bootstrap = needsBootstrap || detachedFromLiveEdge.value || lastFetchedId.value === null;
		const request = beginRequest(bootstrap ? 'bootstrap' : 'live');

		if (!request) {
			return;
		}

		refreshAfterPendingFilter = false;

		const after = bootstrap ? null : lastFetchedId.value;
		const params = buildFilterParams();

		if (after !== null) {
			params.after = after;
		}

		try {
			const response = await fetchLogs(request, params);

			if (!isRequestCurrent(request) || !enabled.value) {
				return;
			}

			if (bootstrap || after === null) {
				logsLoadFailed.value = false;
				commitBootstrap(response);
			} else {
				const collected = await collectLiveChunks(request, response, after);

				if (!isRequestCurrent(request) || !enabled.value) {
					return;
				}

				logsLoadFailed.value = false;
				commitLive(response, collected);
			}
		} catch {
			if (isRequestCurrent(request) && enabled.value) {
				if (loadedLogCount.value && !filterReplacementPending.value && !logsLoadFailed.value) {
					sendToast('error', 'Unable to load new logs', 'Live tail will retry automatically.');
				}

				logsLoadFailed.value = true;
			}
		} finally {
			finishRequest(request);
		}
	}

	function oldestStoredId () {
		return chunks.value[0]?.firstId ?? null;
	}

	function requestOlderLogs (lifecycle: ProbeLogHistoryLifecycle) {
		if (!canLoadOlderLogs.value) {
			return;
		}

		if (activeRequest) {
			// Remember one history request and start it when the current request releases the slot.
			if (activeRequest.kind !== 'history' && !historyRequested) {
				historyRequested = true;
				queuedHistoryLifecycle = lifecycle;
			}

			return;
		}

		void loadOlderLogs(lifecycle);
	}

	async function loadOlderLogs (lifecycle: ProbeLogHistoryLifecycle) {
		if (!canLoadOlderLogs.value || activeRequest) {
			return;
		}

		clearTimeout(refreshTimeout.value);
		historyRequested = false;
		queuedHistoryLifecycle = undefined;
		const before = oldestStoredId();

		if (!before) {
			return;
		}

		const request = beginRequest('history');

		if (!request) {
			return;
		}

		activeHistoryLifecycle = lifecycle;
		// The viewport captures its scroll anchor at the real request start, not while queued.
		lifecycle.onStart();

		try {
			const response = await fetchLogs(request, {
				...buildFilterParams(),
				before,
			});

			if (!isRequestCurrent(request)) {
				return;
			}

			const chunk = createChunk(response);
			hasOlderLogs.value = Boolean(chunk) && response.hasOlder;

			if (chunk) {
				const retained = trimNewestChunks([ chunk, ...chunks.value ]);

				chunks.value = retained.chunks;

				if (retained.evicted) {
					// We removed newer pages to keep history, so this cache is no longer at the live edge.
					detachedFromLiveEdge.value = true;
					needsBootstrap = true;
					clearTimeout(refreshTimeout.value);
				}
			}

			historyLoadFailed.value = false;
			lifecycle.onCommit({ prepended: Boolean(chunk) });
			activeHistoryLifecycle = undefined;
		} catch {
			if (isRequestCurrent(request)) {
				historyLoadFailed.value = true;
			}
		} finally {
			if (activeHistoryLifecycle === lifecycle) {
				cancelActiveHistoryLifecycle();
			}

			finishRequest(request);
		}
	}

	// Clear every request and queued action before changing the stream's meaning.
	const invalidateRequests = () => {
		abortActiveRequest();
		clearTimeout(refreshTimeout.value);
		pending.value = false;
		historyLoadPending.value = false;
		historyRequested = false;
		queuedHistoryLifecycle = undefined;
		returnToLiveRequested = false;
		refreshAfterPendingFilter = false;
	};

	// Keep the old rows visible while the new filtered snapshot loads.
	const resetForFilterReplacement = () => {
		invalidateRequests();
		logsLoadFailed.value = false;
		historyLoadFailed.value = false;
		lastFetchedId.value = null;
		filterReplacementPending.value = true;
		hasOlderLogs.value = false;
		detachedFromLiveEdge.value = false;
		followingLiveTail.value = true;
		needsBootstrap = true;
		initialLoadPending.value = loadedLogCount.value === 0;
	};

	// Logs from another probe must never remain visible during the next load.
	const resetForProbe = () => {
		invalidateRequests();
		chunks.value = [];
		lastFetchedId.value = null;
		initialLoadPending.value = true;
		logsLoadFailed.value = false;
		filterReplacementPending.value = false;
		historyLoadFailed.value = false;
		hasOlderLogs.value = false;
		detachedFromLiveEdge.value = false;
		followingLiveTail.value = true;
		needsBootstrap = true;

		if (enabled.value && !toValue(filterUpdatePending)) {
			void refreshLogs();
		}
	};

	// The viewport calls this after reaching the bottom of a detached cache.
	const requestLatestBootstrap = () => {
		if (!enabled.value) {
			return;
		}

		needsBootstrap = true;
		returnToLiveRequested = true;

		if (!activeRequest) {
			void refreshLogs();
		}
	};

	// A real filter change needs a replacement snapshot; an unchanged one may only resume pending work.
	const onFiltersApplied = (changed: boolean) => {
		if (changed) {
			resetForFilterReplacement();
		}

		if (enabled.value && (changed || needsBootstrap || refreshAfterPendingFilter)) {
			void refreshLogs();
		}
	};

	// The Live tail switch controls polling, but pausing does not block an older-history request.
	watch(enabled, (isEnabled) => {
		if (isEnabled) {
			if (toValue(filterUpdatePending)) {
				refreshAfterPendingFilter = true;

				if (detachedFromLiveEdge.value) {
					requestLatestBootstrap();
				}
			} else if (detachedFromLiveEdge.value) {
				requestLatestBootstrap();
			} else {
				void refreshLogs();
			}
		} else {
			clearTimeout(refreshTimeout.value);
			abortActiveRequest([ 'bootstrap', 'live' ]);
			initialLoadPending.value = loadedLogCount.value === 0;
			arbitrateNextRequest();
		}
	}, { immediate: true });

	// Scrolling back near the bottom restarts live polling immediately.
	watch(followingLiveTail, (isFollowing) => {
		clearTimeout(refreshTimeout.value);

		if (isFollowing && enabled.value && !toValue(filterUpdatePending)) {
			void refreshLogs();
		}
	}, { flush: 'sync' });

	// Reuse this composable safely when the route changes to another probe.
	watch(() => toValue(probeId), (currentProbeId, previousProbeId) => {
		if (currentProbeId !== previousProbeId) {
			resetForProbe();
		}
	});

	onUnmounted(() => {
		invalidateRequests();
	});

	return {
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
	};
};
