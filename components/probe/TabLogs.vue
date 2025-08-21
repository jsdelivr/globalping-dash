<template>
	<div
		ref="logContainer"
		class="relative flex flex-1 flex-col overflow-y-auto rounded-md border bg-surface-100 p-4 font-mono max-lg:p-2 max-md:gap-4 dark:bg-dark-950"
		@scroll="autoScroll = false"
		@scrollend="onScrollEnd"
	>
		<div
			v-for="(log, index) in logs"
			:key="index"
			:class="{
				'text-rose-600 dark:text-red-400': log.level?.toLowerCase() === 'error',
				'text-orange-600 dark:text-yellow-300': log.level?.toLowerCase() === 'warn',
				'text-gray-600 dark:text-gray-400': !['error','warn'].includes(log.level?.toLowerCase() || '')
			}"
		>
			<span v-if="log.timestamp">[{{ log.timestamp.toUpperCase() }}] </span>
			<span v-if="log.level">[{{ log.level.toUpperCase() }}] </span>
			<span class="break-words">{{ log.message }}</span>
		</div>
		<span v-if="logs.length === 0" class="inset-0 m-auto text-gray-600 dark:text-gray-400">
			<span v-if="pending && showLoader">
				<span class="pi pi-spinner animate-spin text-2xl dark:text-gray-500"/>
			</span>
			<span v-else>
				No logs available.
			</span>
		</span>
	</div>
</template>

<script setup lang="ts">
	import { useErrorToast } from '~/composables/useErrorToast';

	const { isActive } = defineProps({
		isActive: {
			type: Boolean,
			default: true,
		},
	});

	const config = useRuntimeConfig();
	const route = useRoute();
	const probeId = route.params.id as string;
	const refreshInterval = ref<NodeJS.Timeout>();
	const logContainer = ref<HTMLDivElement | null>(null);
	const autoScroll = ref(true);
	const logs = ref<ProbeLog[]>([]);
	const lastFetched = ref(0);
	const showLoader = ref(true);

	const { data, refresh, pending, error } = await useLazyAsyncData<ProbeLog[]>(
		() => $fetch(`${config.public.gpApiUrl}/v1/probes/${probeId}/logs`, {
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
			if (!error.value) {
				lastFetched.value = Date.now();
			}
		}).catch(() => {}) // errors are displayed via useErrorToast
			.finally(() => { showLoader.value = !isActive; }); // do not show the loader on further refetches
	};


	const onScrollEnd = () => {
		const scrollHeight = logContainer.value?.scrollHeight ?? 0;
		const scrollTop = logContainer.value?.scrollTop ?? 0;
		const containerHeight = logContainer.value?.clientHeight ?? 0;
		const scrolledTo = scrollTop + containerHeight;

		// if the user scrolled down enough, re-enable autoscroll
		if (scrollHeight - scrolledTo < 30) {
			autoScroll.value = true;
		}
	};

	const scrollToBottom = () => {
		nextTick(() => {
			if (logContainer.value && autoScroll) {
				logContainer.value.scrollTop = logContainer.value.scrollHeight;
			}
		});
	};

	const setRefreshInterval = (timeout = 10000) => {
		if (refreshInterval.value) {
			clearInterval(refreshInterval.value);
		}

		refreshInterval.value = setInterval(() => {
			refreshLogs();
		}, timeout);
	};

	// append new logs to the already stored ones
	watch(() => data.value?.length, () => {
		logs.value.push(...data.value);
		scrollToBottom();
	});

	watch(() => isActive, (active) => {
		if (active) {
			// fetch data manually on the first tab load
			if (lastFetched.value === 0) {
				refreshLogs();
			}

			autoScroll.value = true;
			scrollToBottom();
			setRefreshInterval();
		} else {
			showLoader.value = true;
			clearInterval(refreshInterval.value);
		}
	});

	onUnmounted(() => {
		if (refreshInterval.value) {
			clearInterval(refreshInterval.value);
		}
	});
</script>
