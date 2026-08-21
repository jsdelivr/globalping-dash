<template>
	<div class="flex min-h-[400px] flex-1 flex-col pb-6">
		<div class="relative flex min-h-[300px] flex-1 flex-col overflow-hidden rounded-md border bg-surface-0 dark:bg-dark-950">
			<div class="flex w-full flex-col gap-2 border-b bg-surface-0 px-3 py-2 text-gray-700 sm:flex-row sm:flex-wrap sm:items-start dark:bg-dark-800 dark:text-gray-300">
				<div v-if="logs.length" class="flex min-h-9 items-center sm:mr-auto">
					<span v-if="filterReplacementPending && pending && enabled && !initialLoadPending" class="flex" role="status" aria-live="polite">
						<ProbeDotLoader/>
						<span class="sr-only">Loading filtered logs</span>
					</span>
					<span v-else-if="filterReplacementPending && logsLoadFailed && enabled" role="status" aria-live="polite">
						Unable to load filtered logs. Retrying…
					</span>
					<span v-else-if="filterReplacementPending && !enabled" role="status" aria-live="polite">
						{{ emptyStateText }}
					</span>
					<span v-else-if="!filterReplacementPending" class="font-bold">
						<template v-if="filtersActive">
							Showing {{ formatNumber(logs.length) }} matching {{ pluralize('log', logs.length) }}.
						</template>
						<template v-else>
							Showing {{ formatNumber(logs.length) }} <span class="hidden sm:inline">most recent</span> {{ pluralize('log', logs.length) }}.
						</template>
					</span>
				</div>

				<div class="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:flex-wrap sm:items-start sm:justify-end">
					<div class="w-full sm:w-56">
						<label for="probe-log-search" class="sr-only">Search log messages</label>
						<IconField class="h-9 w-full">
							<InputIcon class="pi pi-search !mt-0 -translate-y-1/2 text-sm"/>
							<InputText
								id="probe-log-search"
								v-model="searchInput"
								autocomplete="off"
								class="size-full text-sm"
								placeholder="Search logs"
								:maxlength="SEARCH_MAX_LENGTH"
								@input="onSearchInput"
							/>
						</IconField>
					</div>

					<div ref="scopeControl" class="w-full sm:w-64">
						<label for="probe-log-scopes" class="sr-only">Filter logs by scope</label>
						<MultiSelect
							v-model="scopeInput"
							input-id="probe-log-scopes"
							class="w-full"
							placeholder="Filter by scopes"
							filter-placeholder="Find a scope"
							chip-icon="pi pi-times"
							display="chip"
							filter
							reset-filter-on-hide
							:options="SCOPE_OPTIONS"
							:show-toggle-all="false"
							:pt="{
								root: { class: 'h-9 text-sm' },
								labelContainer: {
									class: [
										'relative',
										scopeValuesOverflowing && 'after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:z-10 after:w-8 after:bg-gradient-to-r after:from-transparent after:to-surface-0 dark:after:to-dark-900',
									],
								},
								label: {
									'scope-label': '',
									class: [
										'!py-0 !pr-2 !text-sm !leading-none',
										scopeInput.length
											? '!pl-1 !text-bluegray-900 dark:!text-surface-0'
											: '!pl-2 !text-bluegray-400 dark:!text-bluegray-400',
									],
								},
								chipItem: { class: 'max-w-44' },
								pcChip: {
									root: { class: 'min-w-0 max-w-full w-full justify-between !h-7 !gap-1 !py-0 !text-sm' },
									label: { class: 'min-w-0 flex-1 truncate pb-px pr-0.5 !leading-5' },
									removeIcon: { class: 'order-first !flex !size-4 shrink-0 items-center justify-center !leading-none' },
								},
								dropdown: { class: 'h-full !w-9' },
							}"
							:pt-options="{ mergeProps: true }"
							@update:model-value="onScopesUpdated"
						>
							<template #option="{ option }">
								<span class="min-w-0 flex-1 truncate font-mono text-xs" :title="option">{{ option }}</span>
							</template>
						</MultiSelect>
					</div>

					<label
						class="flex h-9 cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-md border border-gray-500 px-2 duration-200 focus-within:outline-none focus-within:ring-1 focus-within:ring-primary focus-within:ring-offset-2 sm:justify-end dark:border-gray-400"
						:class="{
							'border-primary text-primary dark:border-primary': enabled,
						}"
					>
						<input v-model="enabled" type="checkbox" class="sr-only">
						<i v-if="enabled" class="pi pi-pause-circle text-[16px]" aria-hidden="true"/>
						<i v-else class="pi pi-play-circle text-[16px]" aria-hidden="true"/>
						Live tail
					</label>
				</div>
			</div>
			<div v-if="logs.length" class="h-4 max-lg:h-2"/>
			<div
				ref="logContainer"
				class="relative flex flex-1 flex-col overflow-y-auto p-4 pt-0 font-mono max-lg:p-2 max-lg:pt-0"
				role="region"
				aria-label="Probe logs"
				:aria-busy="pending"
				@scroll="onScrollThrottled"
			>
				<div
					v-for="(log, index) in logs"
					:key="index"
					class="whitespace-nowrap text-gray-800 dark:text-gray-300"
				>
					<span v-if="log.timestamp" class="text-gray-600 dark:text-gray-500">[{{ formatTechnicalDateTime(log.timestamp) }}] </span>
					<span v-if="log.scope" class="text-green-600 dark:text-green-500">[{{ log.scope }}] </span>
					<span
						:class="{
							'text-red-600 dark:text-red-500': log.level?.toLowerCase() === 'error',
							'text-yellow-600 dark:text-yellow-300': log.level?.toLowerCase() === 'warn',
							'text-cyan-600 dark:text-cyan-300': log.level?.toLowerCase() === 'info',
							'text-blue-600 dark:text-blue-400': log.level?.toLowerCase() === 'debug',
						}"
					>
						<span v-if="log.level">[{{ log.level.toUpperCase() }}] </span>
						<span class="whitespace-pre">{{ log.message }}</span>
					</span>
				</div>
				<span v-if="logs.length === 0" class="inset-0 m-auto max-w-lg p-2 text-center text-gray-600 dark:text-gray-400">
					<span v-if="pending && (initialLoadPending || filterReplacementPending)" role="status" aria-live="polite">
						<span class="pi pi-spinner animate-spin text-2xl dark:text-gray-500" aria-hidden="true"/>
						<span class="sr-only">Loading logs</span>
					</span>
					<span v-else-if="logsLoadFailed && enabled">Unable to load logs. Retrying…</span>
					<span v-else>{{ emptyStateText }}</span>
				</span>
				<div v-if="logs.length" class="h-fit px-1 py-2">
					<ProbeDotLoader v-if="enabled"/>
					<span v-else class="block size-1.5"/>
				</div>
			</div>
		</div>
	</div>

</template>

<script setup lang="ts">
	import { useResizeObserver } from '@vueuse/core';
	import throttle from 'lodash/throttle';
	import { SCOPE_OPTIONS, SEARCH_MAX_LENGTH, useProbeLogFilters } from '~/composables/useProbeLogFilters';
	import { formatTechnicalDateTime } from '~/utils/date-formatters';
	import { formatNumber } from '~/utils/format-number';
	import { pluralize } from '~/utils/pluralize';
	import { sendToast } from '~/utils/send-toast';

	const REFRESH_INTERVAL = 2000; // ms
	const MAX_DISPLAYED_LOGS = 5000;

	const props = defineProps({
		probeId: {
			type: String,
			required: true,
		},
	});

	const config = useRuntimeConfig();
	const refreshTimeout = ref<ReturnType<typeof setTimeout>>();
	const logContainer = ref<HTMLDivElement | null>(null);
	const scopeControl = ref<HTMLDivElement | null>(null);
	const autoScroll = ref(true);
	const logs = ref<ProbeLog[]>([]);
	const lastFetchedId = ref<string | null>(null);
	const initialLoadPending = ref(true);
	const enabled = ref(true);
	const pending = ref(false);
	const logsLoadFailed = ref(false);
	const filterReplacementPending = ref(false);
	let activeRequest: AbortController | undefined;
	let needsInitialFetch = true;

	const onFiltersApplied = (changed: boolean) => {
		if (changed) {
			resetLogStream();
		}

		if (enabled.value && (changed || needsInitialFetch)) {
			void refreshLogs();
		}
	};

	const {
		filter,
		searchInput,
		scopeInput,
		filterUpdatePending,
		filtersActive,
		onSearchInput,
		onScopesUpdated,
	} = useProbeLogFilters(onFiltersApplied);

	const scopeValuesOverflowing = ref(false);

	const emptyStateText = computed(() => {
		if (!enabled.value) {
			return 'Live tail is paused. Resume it to load logs.';
		}

		if (filtersActive.value) {
			return 'No logs match the active filters.';
		}

		return 'No logs available. A newly adopted probe may take a few minutes to sync the logs.';
	});

	const abortActiveRequest = () => {
		activeRequest?.abort();
		activeRequest = undefined;
	};

	const scheduleRefresh = () => {
		clearTimeout(refreshTimeout.value);

		refreshTimeout.value = setTimeout(() => {
			// avoid polling with stale filters; reschedule in case the debounced update applies no change.
			if (filterUpdatePending.value) {
				scheduleRefresh();
				return;
			}

			void refreshLogs();
		}, REFRESH_INTERVAL);
	};

	const refreshLogs = async () => {
		if (!enabled.value) {
			return;
		}

		abortActiveRequest();
		const request = new AbortController();
		activeRequest = request;
		needsInitialFetch = false;
		pending.value = true;
		const params: Record<string, string> = {};

		if (lastFetchedId.value !== null) {
			params.after = lastFetchedId.value;
		}

		if (filter.value.scopes.length) {
			params.scopes = filter.value.scopes.join(',');
		}

		if (filter.value.search) {
			params.search = filter.value.search;
		}

		try {
			const response = await $fetch<ProbeLogsResponse>(`${config.public.gpApiUrl}/v1/probes/${props.probeId}/logs`, {
				params,
				credentials: 'include',
				signal: request.signal,
			});

			if (request.signal.aborted || !enabled.value) {
				return;
			}

			logsLoadFailed.value = false;

			if (filterReplacementPending.value) {
				logs.value = response.logs;
				filterReplacementPending.value = false;
			} else {
				logs.value.push(...response.logs);
			}

			if (logs.value.length > MAX_DISPLAYED_LOGS) {
				logs.value = logs.value.slice(-MAX_DISPLAYED_LOGS);
			}

			if (response.lastId !== null) {
				lastFetchedId.value = response.lastId;
			}

			scrollToBottom();
		} catch {
			if (!request.signal.aborted && enabled.value) {
				if (logs.value.length && !filterReplacementPending.value && !logsLoadFailed.value) {
					sendToast('error', 'Unable to load new logs', 'Live tail will retry automatically.');
				}

				logsLoadFailed.value = true;
			}
		} finally {
			if (activeRequest === request) {
				activeRequest = undefined;
				pending.value = false;
				initialLoadPending.value = false;

				if (enabled.value) {
					scheduleRefresh();
				}
			}
		}
	};

	const resetLogStream = () => {
		abortActiveRequest();
		clearTimeout(refreshTimeout.value);
		pending.value = false;
		logsLoadFailed.value = false;
		lastFetchedId.value = null;
		filterReplacementPending.value = true;
		autoScroll.value = true;
		needsInitialFetch = true;
	};

	const updateScopeValuesOverflowing = () => {
		const label = scopeControl.value?.querySelector<HTMLElement>('[scope-label]');

		scopeValuesOverflowing.value = Boolean(label && label.scrollWidth > label.clientWidth);
	};

	useResizeObserver(scopeControl, updateScopeValuesOverflowing);

	watch(scopeInput, () => {
		void nextTick(updateScopeValuesOverflowing);
	});

	const onScrollThrottled = throttle(() => {
		const scrollHeight = logContainer.value?.scrollHeight ?? 0;
		const scrollTop = logContainer.value?.scrollTop ?? 0;
		const containerHeight = logContainer.value?.clientHeight ?? 0;
		const scrolledTo = scrollTop + containerHeight;

		// if the user scrolled down enough, enable autoscroll
		autoScroll.value = scrollHeight - scrolledTo < 10;
	}, 10);

	const scrollToBottom = () => {
		nextTick(() => {
			if (logContainer.value && autoScroll.value) {
				logContainer.value.scrollTop = logContainer.value.scrollHeight;
			}
		});
	};

	watch(enabled, (isEnabled) => {
		if (isEnabled) {
			if (!filterUpdatePending.value) {
				void refreshLogs();
			}
		} else {
			abortActiveRequest();
			clearTimeout(refreshTimeout.value);
			pending.value = false;
			initialLoadPending.value = logs.value.length === 0;
			needsInitialFetch = true;
		}
	}, { immediate: true });

	onUnmounted(() => {
		abortActiveRequest();
		clearTimeout(refreshTimeout.value);
		onScrollThrottled.cancel();
	});
</script>
