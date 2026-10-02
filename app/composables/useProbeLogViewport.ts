import throttle from 'lodash/throttle';
import type { CaptureProbeLogHistoryViewport, StoredProbeLog } from '~/composables/useProbeLogStream';

export const MAX_DISPLAYED_LOGS = 5000;

const RENDER_WINDOW_STEP = 1000;
const SCROLL_EDGE_THRESHOLD = 10;
const LIVE_TAIL_RESUME_THRESHOLD = 100;
const LIVE_TAIL_PAUSE_THRESHOLD = 300;

interface ProbeLogViewportOptions {
	loadedLogs: MaybeRefOrGetter<StoredProbeLog[]>;
	detachedFromLiveEdge: MaybeRefOrGetter<boolean>;
	followingLiveTail: Ref<boolean>;
	canLoadOlderLogs: MaybeRefOrGetter<boolean>;
	requestOlderLogs: (captureViewport: CaptureProbeLogHistoryViewport) => void;
	requestLatestBootstrap: () => void;
	tailRevision: MaybeRefOrGetter<number>;
}

interface ViewportSnapshot {
	// The row key identifies the same log after Vue renders the updated list.
	key: number;
	// The top position tells us where that row was on the screen.
	top: number;
	// Keep the entire visible range in the render window after a prepend.
	lastVisibleIndex: number;
	visibleKeys: number[];
}

export const useProbeLogViewport = ({
	loadedLogs,
	detachedFromLiveEdge,
	followingLiveTail,
	canLoadOlderLogs,
	requestOlderLogs,
	requestLatestBootstrap,
	tailRevision,
}: ProbeLogViewportOptions) => {
	const logContainer = ref<HTMLDivElement | null>(null);
	const renderStart = ref(0);
	const loadedLogCount = computed(() => toValue(loadedLogs).length);
	// Keep the DOM small even when we have more logs saved in memory.
	const renderedLogs = computed(() => toValue(loadedLogs).slice(renderStart.value, renderStart.value + MAX_DISPLAYED_LOGS));
	const renderEnd = computed(() => Math.min(renderStart.value + MAX_DISPLAYED_LOGS, loadedLogCount.value));

	// Capture the visible range and its anchor before changing the displayed logs.
	const captureViewport = (): ViewportSnapshot | null => {
		const container = logContainer.value;

		if (!container) {
			return null;
		}

		const containerBounds = container.getBoundingClientRect();
		const rows = container.querySelectorAll<HTMLElement>('[data-log-key]');

		// Log rows are ordered vertically, including rows with multiline messages.
		const findBoundary = (isPastBoundary: (bounds: DOMRect) => boolean, start = 0) => {
			let end = rows.length;

			while (start < end) {
				const middle = Math.floor((start + end) / 2);

				if (isPastBoundary(rows[middle]!.getBoundingClientRect())) {
					end = middle;
				} else {
					start = middle + 1;
				}
			}

			return start;
		};

		const firstVisible = findBoundary(bounds => bounds.bottom > containerBounds.top);
		const visibleEnd = findBoundary(bounds => bounds.top >= containerBounds.bottom, firstVisible);

		if (firstVisible === visibleEnd) {
			return null;
		}

		const row = rows[firstVisible]!;
		const visibleKeys: number[] = [];

		for (let index = firstVisible; index < visibleEnd; index++) {
			visibleKeys.push(Number(rows[index]!.dataset.logKey));
		}

		return {
			key: visibleKeys[0]!,
			top: row.getBoundingClientRect().top,
			lastVisibleIndex: renderStart.value + visibleEnd - 1,
			visibleKeys,
		};
	};

	const restoreScrollAnchor = (anchor: ViewportSnapshot | null) => {
		void nextTick(() => {
			const container = logContainer.value;

			if (!container || !anchor) {
				return;
			}

			const row = container.querySelector<HTMLElement>(`[data-log-key="${anchor.key}"]`);

			if (row) {
				container.scrollTop += row.getBoundingClientRect().top - anchor.top;
			}
		});
	};

	const setRenderWindowToTail = () => {
		// Start the render window late enough to include the newest logs.
		renderStart.value = Math.max(0, loadedLogCount.value - MAX_DISPLAYED_LOGS);
	};

	const pinToBottom = () => {
		void nextTick(() => {
			if (logContainer.value) {
				logContainer.value.scrollTop = logContainer.value.scrollHeight;
			}
		});
	};

	// Share one response-time snapshot between the eviction check and scroll restoration.
	const captureHistoryViewport: CaptureProbeLogHistoryViewport = () => {
		const anchor = captureViewport();

		return {
			visibleKeys: anchor?.visibleKeys ?? [],
			restore: (prependedCount) => {
				if (prependedCount) {
					followingLiveTail.value = false;
					// Show as much older history as possible while keeping every visible row rendered.
					renderStart.value = Math.max(0, (anchor?.lastVisibleIndex ?? -1) + prependedCount + 1 - MAX_DISPLAYED_LOGS);
				}

				restoreScrollAnchor(anchor);
			},
		};
	};

	// Move through logs we already have in memory. This does not make an API request.
	const shiftRenderWindow = (direction: 'older' | 'newer') => {
		const maximumStart = Math.max(0, loadedLogCount.value - MAX_DISPLAYED_LOGS);
		const nextStart = direction === 'older'
			? Math.max(0, renderStart.value - RENDER_WINDOW_STEP)
			: Math.min(maximumStart, renderStart.value + RENDER_WINDOW_STEP);

		if (nextStart === renderStart.value) {
			return false;
		}

		const anchor = captureViewport();
		renderStart.value = nextStart;
		restoreScrollAnchor(anchor);
		return true;
	};

	// A scroll event can fire many times per frame, so keep this handler cheap and throttled.
	const onScrollThrottled = throttle(() => {
		const container = logContainer.value;

		if (!container) {
			return;
		}

		const scrollHeight = container.scrollHeight;
		const scrollTop = container.scrollTop;
		const containerHeight = container.clientHeight;
		const scrolledTo = scrollTop + containerHeight;
		const distanceFromBottom = scrollHeight - scrolledTo;
		const atTop = scrollTop < SCROLL_EDGE_THRESHOLD;
		const atBottom = distanceFromBottom < SCROLL_EDGE_THRESHOLD;

		if (atTop) {
			// Show older cached logs first. Ask the API only when this is already the oldest window.
			if (shiftRenderWindow('older')) {
				followingLiveTail.value = false;
				return;
			}

			if (toValue(canLoadOlderLogs)) {
				followingLiveTail.value = false;
				requestOlderLogs(captureHistoryViewport);
				return;
			}
		}

		if (atBottom) {
			// Walk through newer cached logs before trying to return to the real live edge.
			if (renderEnd.value < loadedLogCount.value && shiftRenderWindow('newer')) {
				followingLiveTail.value = false;
				return;
			}

			if (toValue(detachedFromLiveEdge)) {
				// Our newest cached log is no longer current, so replace it with a fresh latest page.
				followingLiveTail.value = false;
				requestLatestBootstrap();
				return;
			}

			followingLiveTail.value = true;
			return;
		}

		// The two limits stop live tail from turning on and off around the same point.
		const liveTailThreshold = followingLiveTail.value
			? LIVE_TAIL_PAUSE_THRESHOLD
			: LIVE_TAIL_RESUME_THRESHOLD;

		if (renderEnd.value === loadedLogCount.value && distanceFromBottom < liveTailThreshold) {
			if (toValue(detachedFromLiveEdge)) {
				followingLiveTail.value = false;
				requestLatestBootstrap();
				return;
			}

			followingLiveTail.value = true;
			return;
		}

		followingLiveTail.value = false;
	}, 10);

	// Resets and cache trimming can make the current render window invalid.
	watch(loadedLogCount, (count, previousCount) => {
		if (count === 0) {
			renderStart.value = 0;
		} else if (count < previousCount) {
			renderStart.value = Math.min(renderStart.value, Math.max(0, count - MAX_DISPLAYED_LOGS));
		}
	}, { flush: 'sync' });

	// The stream changes this value when new tail data should pull the view back to the bottom.
	watch(() => toValue(tailRevision), () => {
		setRenderWindowToTail();
		pinToBottom();
	});

	onUnmounted(() => {
		onScrollThrottled.cancel();
	});

	return {
		logContainer,
		renderedLogs,
		onScrollThrottled,
	};
};
