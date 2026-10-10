import type { ProbeLogFilter } from '~/composables/useProbeLogFilters';
import { sendToast } from '~/utils/send-toast';

const REFRESH_INTERVAL = 2000; // ms
const REQUEST_TIMEOUT = 15_000; // ms
const MAX_STORED_LOGS = 20_000;

// The local key stays stable when API pages are added or removed.
export type StoredProbeLog = ProbeLog & { _key: number };

// A response-time snapshot protects visible rows and restores their position after an update.
export interface ProbeLogHistorySnapshot {
	visibleKeys: number[];
	restore: (prependedCount: number) => void;
}

export type CaptureProbeLogHistoryViewport = () => ProbeLogHistorySnapshot;

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
	followingLiveTail: Ref<boolean>;
}

export const useProbeLogStream = ({
	probeId,
	filter,
	filterUpdatePending,
	followingLiveTail,
}: ProbeLogStreamOptions) => {
	const config = useRuntimeConfig();
	const refreshTimeout = ref<ReturnType<typeof setTimeout>>();
	// Immutable log pages are ordered oldest to newest; replace the array to update the cache.
	const chunks = shallowRef<LogChunk[]>([]);
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
	let queuedHistoryCapture: CaptureProbeLogHistoryViewport | undefined;
	let nextLogKey = 0;
	// A bootstrap does not use the live cursor and replaces the current cache.
	let needsBootstrap = true;
	// Queue a return to live tail when another request is active.
	let returnToLiveRequested = false;

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
		const evictedChunks: LogChunk[] = [];
		let count = getLoadedCount(retained);

		while (count > MAX_STORED_LOGS && retained.length) {
			const chunk = retained.pop()!;
			count -= chunk.logs.length;
			evictedChunks.push(chunk);
		}

		return { chunks: retained, evictedChunks };
	};

	const abortActiveRequest = () => {
		if (!activeRequest) {
			return;
		}

		const request = activeRequest;
		activeRequest = undefined;
		request.controller.abort();
		pending.value = false;

		if (request.kind === 'history') {
			historyLoadPending.value = false;
		}
	};

	function scheduleRefresh () {
		clearTimeout(refreshTimeout.value);

		// Poll only while live tail is active and connected to the newest data.
		if (((!followingLiveTail.value || detachedFromLiveEdge.value) && !returnToLiveRequested)
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

		arbitrateNextRequest(request.kind);
	}

	// Pick the next queued action after the current request finishes.
	function arbitrateNextRequest (completedRequestKind?: RequestKind) {
		if (activeRequest) {
			return;
		}

		if (returnToLiveRequested) {
			// A queued return starts immediately, while a failed return bootstrap retries on the normal interval.
			if (completedRequestKind === 'bootstrap') {
				scheduleRefresh();
			} else {
				void refreshLogs();
			}

			return;
		}

		if (queuedHistoryCapture && canLoadOlderLogs.value) {
			const captureViewport = queuedHistoryCapture;
			queuedHistoryCapture = undefined;

			void loadOlderLogs(captureViewport);
			return;
		}

		queuedHistoryCapture = undefined;
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

	const fetchLogs = async (request: ActiveRequest, params: Record<string, string>) => {
		const requestTimeout = setTimeout(() => request.controller.abort(), REQUEST_TIMEOUT);

		try {
			return await $fetch<ProbeLogsResponse>(`${config.public.gpApiUrl}/v1/probes/${toValue(probeId)}/logs`, {
				params,
				credentials: 'include',
				signal: request.controller.signal,
			});
		} finally {
			clearTimeout(requestTimeout);
		}
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
		if (toValue(filterUpdatePending)
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

		const after = bootstrap ? null : lastFetchedId.value;
		const params = buildFilterParams();

		if (after !== null) {
			params.after = after;
		}

		try {
			const response = await fetchLogs(request, params);

			if (!isRequestCurrent(request)) {
				return;
			}

			if (bootstrap || after === null) {
				logsLoadFailed.value = false;
				commitBootstrap(response);
			} else {
				const collected = await collectLiveChunks(request, response, after);

				if (!isRequestCurrent(request)) {
					return;
				}

				logsLoadFailed.value = false;
				commitLive(response, collected);
			}
		} catch {
			if (activeRequest === request) {
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

	function requestOlderLogs (captureViewport: CaptureProbeLogHistoryViewport) {
		if (!canLoadOlderLogs.value) {
			return;
		}

		if (activeRequest) {
			// Remember one history request and start it when the current request releases the slot.
			if (activeRequest.kind !== 'history' && !queuedHistoryCapture) {
				queuedHistoryCapture = captureViewport;
			}

			return;
		}

		void loadOlderLogs(captureViewport);
	}

	async function loadOlderLogs (captureViewport: CaptureProbeLogHistoryViewport) {
		if (!canLoadOlderLogs.value || activeRequest) {
			return;
		}

		clearTimeout(refreshTimeout.value);
		queuedHistoryCapture = undefined;
		const before = oldestStoredId();

		if (!before) {
			return;
		}

		const request = beginRequest('history');

		if (!request) {
			return;
		}

		try {
			const response = await fetchLogs(request, {
				...buildFilterParams(),
				before,
			});

			if (!isRequestCurrent(request)) {
				return;
			}

			historyLoadFailed.value = false;
			const chunk = createChunk(response);

			if (chunk) {
				const retained = trimNewestChunks([ chunk, ...chunks.value ]);
				const snapshot = captureViewport();

				if (retained.evictedChunks.length) {
					const visibleKeys = new Set(snapshot.visibleKeys);

					// The user may have scrolled into newer pages while this request was in flight.
					// Keep the cache and cursor intact so history can be retried when they return to the top.
					if (retained.evictedChunks.some(item => item.logs.some(log => visibleKeys.has(log._key)))) {
						// Queue the loader removal before restoring the unchanged viewport.
						finishRequest(request);
						snapshot.restore(0);
						return;
					}
				}

				chunks.value = retained.chunks;

				if (retained.evictedChunks.length) {
					// We removed newer pages to keep history, so this cache is no longer at the live edge.
					detachedFromLiveEdge.value = true;
					needsBootstrap = true;
					clearTimeout(refreshTimeout.value);
				}

				snapshot.restore(chunk.logs.length);
			}

			hasOlderLogs.value = Boolean(chunk) && response.hasOlder;
		} catch {
			if (activeRequest === request) {
				if (!historyLoadFailed.value) {
					sendToast('error', 'Unable to load older logs', 'Scroll to the top to retry.');
				}

				historyLoadFailed.value = true;
			}
		} finally {
			finishRequest(request);
		}
	}

	// Clear every request and queued action before changing the stream's meaning.
	const invalidateRequests = () => {
		abortActiveRequest();
		clearTimeout(refreshTimeout.value);
		pending.value = false;
		historyLoadPending.value = false;
		queuedHistoryCapture = undefined;
		returnToLiveRequested = false;
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

		if (!toValue(filterUpdatePending)) {
			void refreshLogs();
		}
	};

	// The viewport calls this after reaching the bottom of a detached cache.
	const requestLatestBootstrap = () => {
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

		if (changed || needsBootstrap) {
			void refreshLogs();
		}
	};

	// Load immediately and restart polling when scrolling back near the bottom.
	watch(followingLiveTail, (isFollowing) => {
		clearTimeout(refreshTimeout.value);

		if (isFollowing && !toValue(filterUpdatePending)) {
			void refreshLogs();
		}
	}, { flush: 'sync', immediate: true });

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
		detachedFromLiveEdge,
		canLoadOlderLogs,
		tailRevision,
		onFiltersApplied,
		requestOlderLogs,
		requestLatestBootstrap,
	};
};
