<template>
	<div
		ref="logContainer"
		class="dark-scrollbar relative flex flex-1 flex-col overflow-y-auto p-4 pt-0 font-mono max-lg:p-2 max-lg:pt-0"
		role="region"
		aria-label="Probe logs"
		:aria-busy="requestPending"
		@scroll="onScrollThrottled"
	>
		<div v-if="historyLoadPending" class="h-fit px-1 py-2" role="status" aria-live="polite">
			<ProbeDotLoader/>
		</div>
		<span v-else-if="historyLoadFailed" class="mb-1 px-1 font-sans text-sm text-gray-600 dark:text-gray-400" role="status" aria-live="polite">
			Unable to load older logs. Scroll to the top to retry.
		</span>
		<div
			v-for="log in renderedLogs"
			:key="log._key"
			:data-log-key="log._key"
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
		<span v-if="renderedLogs.length === 0" class="inset-0 m-auto max-w-lg p-2 text-center text-gray-600 dark:text-gray-400">
			<span v-if="requestPending && (initialLoadPending || filterReplacementPending)" role="status" aria-live="polite">
				<span class="pi pi-spinner animate-spin text-2xl dark:text-gray-500" aria-hidden="true"/>
				<span class="sr-only">Loading logs</span>
			</span>
			<span v-else-if="loadFailed && enabled">Unable to load logs. Retrying…</span>
			<span v-else>{{ emptyStateText }}</span>
		</span>
		<div v-if="renderedLogs.length" class="h-fit px-1 py-2">
			<ProbeDotLoader v-if="enabled && followingLiveTail && !detachedFromLiveEdge"/>
			<span v-else class="block size-1.5"/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { ProbeLogHistoryLifecycle, StoredProbeLog } from '~/composables/useProbeLogStream';
	import { useProbeLogViewport } from '~/composables/useProbeLogViewport';
	import { formatTechnicalDateTime } from '~/utils/date-formatters';

	const props = defineProps<{
		loadedLogs: StoredProbeLog[];
		requestPending: boolean;
		initialLoadPending: boolean;
		filterReplacementPending: boolean;
		loadFailed: boolean;
		historyLoadPending: boolean;
		historyLoadFailed: boolean;
		detachedFromLiveEdge: boolean;
		emptyStateText: string;
		enabled: boolean;
		canLoadOlderLogs: boolean;
		requestOlderLogs: (lifecycle: ProbeLogHistoryLifecycle) => void;
		requestLatestBootstrap: () => void;
		tailRevision: number;
	}>();

	const followingLiveTail = defineModel<boolean>('followingLiveTail', { required: true });

	const {
		logContainer,
		renderedLogs,
		onScrollThrottled,
	} = useProbeLogViewport({
		loadedLogs: () => props.loadedLogs,
		detachedFromLiveEdge: () => props.detachedFromLiveEdge,
		followingLiveTail,
		canLoadOlderLogs: () => props.canLoadOlderLogs,
		requestOlderLogs: props.requestOlderLogs,
		requestLatestBootstrap: props.requestLatestBootstrap,
		tailRevision: () => props.tailRevision,
	});
</script>
