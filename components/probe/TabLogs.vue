<template>
	<div class="flex min-h-[400px] flex-1 flex-col pb-6">
		<div class="relative flex min-h-[300px] flex-1 flex-col overflow-hidden rounded-md border bg-surface-100 dark:bg-dark-950">
			<div class="flex w-full flex-nowrap items-center justify-between gap-4 border-b bg-surface-200 px-3 py-1.5 text-gray-700 dark:bg-dark-800 dark:text-gray-300">
				<span v-if="logs.length">
					Showing the latest {{logs.length}} {{pluralize('log', logs.length)}}.
				</span>
				<LogLoader v-else-if="enabled && !showLargeLoader"/>
				<label class="ml-auto flex cursor-pointer items-center justify-end gap-2.5 duration-200">
					<input v-model="enabled" type="checkbox" class="peer sr-only">
					Live tail
					<i v-if="enabled" class="pi pi-stop-circle text-lg"/>
					<i v-else class="pi pi-play-circle text-lg text-primary"/>
				</label>
			</div>
			<div
				ref="logContainer"
				class="relative flex flex-1 flex-col overflow-y-auto p-4 font-mono shadow-inner max-lg:p-2 max-md:gap-2"
				@scroll="onScrollDebounced"
			>
				<div
					v-for="(log, index) in logs"
					:key="index"
					class="text-gray-800 dark:text-gray-300"
				>
					<span v-if="log.timestamp" class="text-gray-600 dark:text-gray-500">[{{ log.timestamp.toUpperCase() }}] </span>
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
				<span v-if="logs.length === 0" class="inset-0 m-auto p-2 text-center text-gray-600 dark:text-gray-400">
					<span v-if="pending && showLargeLoader">
						<span class="pi pi-spinner animate-spin text-2xl dark:text-gray-500"/>
					</span>
					<span v-else>
						No logs available. A just adopted probe may take a few minutes to sync the logs.
					</span>
				</span>
				<LogLoader v-if="enabled && logs.length" class="px-1 py-2"/>
			</div>
		</div>
	</div>

</template>

<script setup lang="ts">
	import debounce from 'lodash/debounce';
	import LogLoader from '~/components/probe/LogLoader.vue';
	import { useErrorToast } from '~/composables/useErrorToast';
	import { pluralize } from '~/utils/pluralize';

	const MAX_LOGS = 5000;

	const props = defineProps({
		probeUuid: {
			type: String,
			required: true,
		},
	});

	const config = useRuntimeConfig();
	const refreshInterval = ref<NodeJS.Timeout>();
	const logContainer = ref<HTMLDivElement | null>(null);
	const autoScroll = ref(true);
	const logs = ref<ProbeLog[]>([]);
	const lastFetched = ref(0);
	const showLargeLoader = ref(true);
	const enabled = ref(true);

	const { data, refresh, pending, error } = await useLazyAsyncData<ProbeLog[]>(
		() => $fetch(`${config.public.gpApiUrl}/v1/probes/${props.probeUuid}/logs`, {
			params: {
				since: lastFetched.value,
			},
			credentials: 'include',
		}),
		{
			default: () => [],
			immediate: false,
		},
	);

	useErrorToast(error);

	const refreshLogs = async () => {
		return refresh().then(() => {
			if (!error.value && enabled.value) {
				lastFetched.value = Date.now();
			}
		}).finally(() => { showLargeLoader.value = false; }); // do not show the large loader on further refetches
	};

	const onScroll = () => {
		const scrollHeight = logContainer.value?.scrollHeight ?? 0;
		const scrollTop = logContainer.value?.scrollTop ?? 0;
		const containerHeight = logContainer.value?.clientHeight ?? 0;
		const scrolledTo = scrollTop + containerHeight;

		// if the user scrolled down enough, enable autoscroll
		autoScroll.value = scrollHeight - scrolledTo < 10;
	};

	const onScrollDebounced = debounce(() => onScroll(), 50);

	const scrollToBottom = () => {
		nextTick(() => {
			if (logContainer.value && autoScroll.value) {
				logContainer.value.scrollTop = logContainer.value.scrollHeight;
			}
		});
	};

	const setRefreshInterval = (timeout = 2000) => {
		refreshLogs();
		clearInterval(refreshInterval.value);

		refreshInterval.value = setInterval(() => {
			refreshLogs();
		}, timeout);
	};

	// append new logs to the already stored ones
	watch(data, () => {
		if (!enabled.value) {
			return;
		}

		logs.value.push(...data.value);

		if (logs.value.length > MAX_LOGS) {
			logs.value = logs.value.slice(-MAX_LOGS);
		}

		scrollToBottom();
	});


	watch(enabled, (isEnabled) => {
		if (isEnabled) {
			setRefreshInterval();
			return;
		}

		clearInterval(refreshInterval.value);
	}, { immediate: true });

	onUnmounted(() => {
		clearInterval(refreshInterval.value);
		onScrollDebounced.cancel();
	});
</script>
