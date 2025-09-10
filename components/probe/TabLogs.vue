<template>
	<div class="flex min-h-[400px] flex-1 flex-col pb-6">
		<div class="relative flex min-h-[300px] flex-1 flex-col overflow-hidden rounded-md border bg-surface-100 dark:bg-dark-950">
			<div class="flex w-full flex-nowrap items-center justify-between gap-4 border-b bg-surface-200 px-3 py-1.5 text-gray-700 dark:bg-dark-800 dark:text-gray-300">
				<span v-if="logs.length">
					Showing the latest {{logs.length}} {{pluralize('log', logs.length)}}.
				</span>
				<LogLoader v-else-if="enabled && !showLargeLoader"/>
				<label
					class="ml-auto flex cursor-pointer select-none items-center justify-end gap-2 rounded-md border border-gray-500 px-2 py-1 duration-200 dark:border-gray-400"
					:class="{
						'border-primary text-primary dark:border-primary': enabled,
					}"
				>
					<input v-model="enabled" type="checkbox" class="peer sr-only">
					<i v-if="enabled" class="pi pi-pause-circle text-[16px]"/>
					<i v-else class="pi pi-play-circle text-[16px]"/>
					Live tail
				</label>
			</div>
			<div
				ref="logContainer"
				class="relative flex flex-1 flex-col overflow-y-auto p-4 font-mono shadow-inner max-lg:p-2 max-md:gap-2"
				@scroll="onScrollThrottled"
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
				<span v-if="logs.length" class="h-fit px-1 py-2">
					<LogLoader v-if="enabled"/>
					<span v-else class="inline-block size-1.5"/>
				</span>
			</div>
		</div>
	</div>

</template>

<script setup lang="ts">
	import throttle from 'lodash/throttle';
	import LogLoader from '~/components/probe/LogLoader.vue';
	import { useErrorToast } from '~/composables/useErrorToast';
	import { pluralize } from '~/utils/pluralize';

	const REFRESH_INTERVAL = 2000; // ms
	const MAX_DISPLAYED_LOGS = 5000;

	const props = defineProps({
		probeId: {
			type: String,
			required: true,
		},
	});

	const config = useRuntimeConfig();
	const refreshTimeout = ref<NodeJS.Timeout>();
	const logContainer = ref<HTMLDivElement | null>(null);
	const autoScroll = ref(true);
	const logs = ref<ProbeLog[]>([]);
	const lastFetchedId = ref('-'); // redis ID
	const showLargeLoader = ref(true);
	const enabled = ref(true);

	const { data, refresh, pending, error } = await useLazyAsyncData<{ logs: ProbeLog[]; lastId: string }>(
		() => $fetch(`${config.public.gpApiUrl}/v1/probes/${props.probeId}/logs`, {
			params: {
				after: lastFetchedId.value,
			},
			credentials: 'include',
		}),
		{
			default: () => { return { logs: [], lastId: '-' }; },
			immediate: false,
		},
	);

	useErrorToast(error);

	const refreshLogs = async () => {
		return refresh().then(() => {
			if (!error.value && enabled.value && data.value.lastId) {
				lastFetchedId.value = data.value.lastId;
			}
		}).finally(() => {
			// do not show the large loader on further refetches
			showLargeLoader.value = false;

			if (enabled.value) {
				refreshTimeout.value = setTimeout(() => {
					refreshLogs();
				}, REFRESH_INTERVAL);
			}
		});
	};

	const onScroll = () => {
		const scrollHeight = logContainer.value?.scrollHeight ?? 0;
		const scrollTop = logContainer.value?.scrollTop ?? 0;
		const containerHeight = logContainer.value?.clientHeight ?? 0;
		const scrolledTo = scrollTop + containerHeight;

		// if the user scrolled down enough, enable autoscroll
		autoScroll.value = scrollHeight - scrolledTo < 10;
	};

	const onScrollThrottled = throttle(() => onScroll(), 10);

	const scrollToBottom = () => {
		nextTick(() => {
			if (logContainer.value && autoScroll.value) {
				logContainer.value.scrollTop = logContainer.value.scrollHeight;
			}
		});
	};

	// append new logs to the already stored ones
	watch(data, () => {
		if (!enabled.value) {
			return;
		}

		logs.value.push(...data.value.logs);

		if (logs.value.length > MAX_DISPLAYED_LOGS) {
			logs.value = logs.value.slice(-MAX_DISPLAYED_LOGS);
		}

		scrollToBottom();
	});


	watch(enabled, (isEnabled) => {
		if (isEnabled) {
			refreshLogs();
		} else {
			clearTimeout(refreshTimeout.value);
		}
	}, { immediate: true });

	onUnmounted(() => {
		clearTimeout(refreshTimeout.value);
		onScrollThrottled.cancel();
	});
</script>
