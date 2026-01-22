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
		v-tooltip.top="!popoverRef?.visible && !isTouchDevice && 'Target this location in a measurement'"
		aria-label="Target this location in a measurement"
		class="-mr-4 flex select-none items-center gap-1.5 rounded-md bg-surface-100 px-2 py-1 text-xs duration-300 hover:bg-surface-300 dark:bg-dark-600 dark:hover:bg-dark-400"
		@click="(e) => popoverRef?.toggle(e)"
	>
		<span class="inline-block size-4 bg-[url('~/assets/icons/target.svg')] bg-cover dark:bg-[url('~/assets/icons/target-light.svg')]"/>
		Target this location
	</button>
	<Popover ref="popoverRef" class="w-fit max-sm:inset-x-0 max-sm:mx-auto max-sm:max-w-[95vw]">
		<div
			class="rounded-xl bg-surface-0 p-5 shadow-md dark:bg-dark-900"
		>
			<div v-if="isProbePrivate && !syncingProbeData" class="flex max-w-80 flex-col gap-5">
				<p>
					To target this specific probe, it must be <strong>tagged by your username</strong>.
				</p>
				<Button
					label="Tag all my probes and proceed"
					class="flex-1"
					:disabled="auth.adminMode || !!auth.impersonation"
					@click="enablePublicProbe"
				/>
				<p>
					Alternatively, you can target a random probe at this location (including probes from other users).
				</p>
				<Button
					severity="secondary"
					as="a"
					label="Target a random probe at this location"
					class="flex-1"
					target="_blank"
					:href="targetLocationLink"/>
			</div>
			<div v-else-if="syncingProbeData" class="flex w-full max-w-72 flex-col gap-2">
				<div class="flex items-center justify-between gap-3 font-bold">
					Synchronizing <ProbeDotLoader/>
				</div>
				Waiting for the probes to be tagged by your username. This can take up to 1 minute.
			</div>
			<div v-else class="flex max-w-72 flex-col gap-5">
				<p>
					Your probe is now tagged and can be targeted.
				</p>
				<Button
					as="a"
					label="Target"
					class="flex-1"
					target="_blank"
					:href="targetLocationLink"/>
			</div>
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
	const isTouchDevice = useMediaQuery('(hover: none)');

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

		if (isProbePrivate.value) {
			refreshTimeout.value = setTimeout(startRefreshingProbeData, 5000);
		} else {
			syncingProbeData.value = false;
		}
	};

	const enablePublicProbe = async () => {
		syncingProbeData.value = true;

		return $directus.request(updateUser(auth.user.id, { public_probes: true }))
			.then(() => {
				auth.refresh();
				startRefreshingProbeData();
			})
			.catch((e) => {
				useErrorToast(e);
				syncingProbeData.value = false;
			});
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
