<template>
	<a
		v-if="!shouldDisplayPopover"
		v-tooltip.top="'Target this location in a measurement'"
		target="_blank"
		:href="targetLocationLink"
		class="-mr-4 flex items-center gap-1.5 rounded-md bg-surface-100 px-2 py-1 text-xs duration-300 hover:bg-surface-300 dark:bg-dark-600 dark:hover:bg-dark-400"
		aria-label="Target this location in a measurement">
		<span class="inline-block size-4 bg-[url('~/assets/icons/target.svg')] bg-cover dark:bg-[url('~/assets/icons/target-light.svg')]"/>
		Target this location
	</a>
	<button
		v-else
		v-tooltip.top="!popoverRef?.visible && 'Target this location in a measurement'"
		aria-label="Target this location in a measurement"
		class="-mr-4 flex items-center gap-1.5 rounded-md bg-surface-100 px-2 py-1 text-xs duration-300 hover:bg-surface-300 dark:bg-dark-600 dark:hover:bg-dark-400"
		@click="popoverRef?.toggle"
	>
		<span class="inline-block size-4 bg-[url('~/assets/icons/target.svg')] bg-cover dark:bg-[url('~/assets/icons/target-light.svg')]"/>
		Target this location
	</button>
	<Popover ref="popoverRef">
		<div class="flex max-w-72 flex-col gap-5 rounded-xl bg-surface-0 p-5 shadow-md dark:bg-dark-900">
			<p v-if="isProbePrivate">
				<b>This probe is not public</b>, so you cannot target it in a measurement. Instead, probes at this location will be targeted.
				<br><br>
				To target this probe specifically, set its visibility to <b>public.</b> The change should take effect within a minute.
			</p>
			<p v-else>
				Your probe is now <b>public</b> and can be targeted in a measurement.
			</p>
			<div v-if="isProbePrivate" class="flex flex-col items-stretch gap-2">
				<Button
					:pt="{
						loadingIcon: { class: 'absolute right-4 inset-y-0 size-4 my-auto animate-spin' },
					}"
					:loading="syncingProbeData"
					label="Switch to public"
					class="flex-1"
					@click="enablePublicProbe"
				/>
				<Button
					severity="secondary"
					as="a"
					label="Proceed anyway"
					class="flex-1"
					target="_blank"
					:href="targetLocationLink"/>
			</div>
			<Button
				v-else
				as="a"
				label="Target"
				class="flex-1"
				target="_blank"
				:href="targetLocationLink"/>
		</div>
	</Popover>
</template>

<script setup lang="ts">
	import { readItem, updateUser } from '@directus/sdk';
	import { useErrorToast } from '~/composables/useErrorToast';
	import { USERNAME_TAG_PATTERN } from '~/constants/users';
	import { useAuth } from '~/store/auth';

	const auth = useAuth();
	const route = useRoute();
	const config = useRuntimeConfig();
	const { $directus } = useNuxtApp();

	const popoverRef = ref();
	const syncingProbeData = ref(false);
	const refreshTimeout = ref();
	const probeId = computed(() => route.params.id as string);

	const { data: probe, error: probeFetchError, refresh } = await useLazyAsyncData(
		probeId,
		() => $directus.request<Probe>(readItem('gp_probes', probeId.value)),
	);

	const isProbePrivate = computed(() => probe.value?.systemTags.every(tag => !USERNAME_TAG_PATTERN.test(tag)));
	const shouldDisplayPopover = computed(() => (probe.value && isProbePrivate.value) || popoverRef.value?.visible);

	const targetLocationLink = computed(() => {
		if (!probe.value) {
			return '';
		}

		let locationStr = `${probe.value.city}%${probe.value.state ? `US-${probe.value.state}` : probe.value.country}%${probe.value.network}`;

		const userTag = probe.value.systemTags.find(tag => USERNAME_TAG_PATTERN.test(tag));
		userTag && (locationStr += `%${userTag}`);

		return `${config.public.gpSiteUrl}/?location=${encodeURIComponent(locationStr)}`;
	});

	const startRefreshingProbeData = async () => {
		clearTimeout(refreshTimeout.value);
		await refresh();
		await nextTick();

		if (isProbePrivate.value) {
			refreshTimeout.value = setTimeout(startRefreshingProbeData, 5000);
		} else {
			syncingProbeData.value = false;
		}
	};

	const enablePublicProbe = async () => {
		syncingProbeData.value = true;
		await $directus.request(updateUser(auth.user.id, { public_probes: true }));
		startRefreshingProbeData();
	};

	watch([ isProbePrivate, () => auth.user.public_probes ], ([ isProbePrivate, userPublicProbes ]) => {
		if (isProbePrivate && userPublicProbes) {
			syncingProbeData.value = true;
			startRefreshingProbeData();
		}
	}, { immediate: true });

	useErrorToast(probeFetchError);

	onBeforeUnmount(() => {
		clearTimeout(refreshTimeout.value);
	});
</script>
