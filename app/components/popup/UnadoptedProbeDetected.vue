<template>
	<Dialog
		v-if="!showManualFlow"
		v-model:visible="isVisible"
		modal
		class="w-[80vw] md:w-[45rem]"
		:draggable="false"
		:closable="false"
		:pt="{
			header: {
				class: successDialogOpen ? 'py-3' : undefined
			}
		}"
	>
		<template #header>
			<span v-if="!successDialogOpen" class="mx-auto pt-2 text-center text-xl font-bold">
				New hardware probe detected
			</span>
		</template>

		<ProbeAdoptedContent
			v-if="successDialogOpen"
			:probes="newProbes"
			@cancel="onSuccessDialogClose"
		/>

		<div v-else-if="activeProbe" class="flex flex-col items-center gap-4 text-center">
			<div class="mb-2 flex w-full flex-col gap-3">
				<p v-if="!hasError">
					A new Globalping hardware probe is available on your network.
				</p>

				<div class="rounded-xl border bg-surface-0 p-3 dark:border-dark-500 dark:bg-dark-800">
					<p class="flex items-center justify-center font-bold">
						<CountryFlag :country="activeProbe.country" size="small"/>
						<span class="ml-2">{{ activeProbe.city }}</span>
					</p>
					<p>{{ activeProbe.network }}</p>
					<p class="break-words font-mono">{{ activeProbe.publicIp }}</p>
				</div>

				<div v-if="hasError" class="rounded-md bg-red-100 p-3 text-center text-red-700 dark:bg-red-900/30 dark:text-red-400">
					<p class="mb-1 font-semibold">Automatic adoption failed.</p>
					<p class="text-sm">
						We recommend trying to adopt the probe manually.
						You may also do this later via the "Adopt a probe" button on the Overview page.
					</p>
				</div>
			</div>

			<div class="flex w-full gap-2 max-md:flex-col-reverse">
				<Button
					:label="hasError ? 'Exit' : 'Ignore'"
					severity="secondary"
					class="flex-1"
					@click="onIgnoreClick"
				/>
				<Button
					v-if="!hasError"
					label="Adopt probe"
					class="flex-1"
					:loading="loading"
					@click="onAdoptClick"
				/>
				<Button
					v-else
					label="Manual adoption"
					class="flex-1"
					severity="contrast"
					:loading="loading"
					@click="onManualAdoptionClick"
				/>
			</div>
		</div>
	</Dialog>
	<GPDialog
		v-else
		v-model:visible="showManualFlow"
		header="Adopt a probe"
		content-class="!p-0"
		size="large"
	>
		<GpDialogContentAdoptProbe manual-hw-adoption :probe-ip="manualAdoptionProbeIp" @cancel="showManualFlow = false" @adopted="refreshNuxtData"/>
	</GPDialog>
</template>

<script setup lang="ts">
	import CountryFlag from 'vue-country-flag-next';
	import { LINK_TOKEN_STORAGE_KEY, useHardwareProbeAdoption } from '~/store/local-adoption';
	import { sendErrorToast } from '~/utils/send-toast';

	const config = useRuntimeConfig().public;
	const store = useHardwareProbeAdoption();
	const { activeProbe, isIdlePolling, showLocalNetworkAccessPopup } = storeToRefs(store);

	const loading = ref(false);
	const hasError = ref(false);
	const showManualFlow = ref(false);
	const successDialogOpen = ref(false);
	const newProbes = ref<Probe[]>([]);
	const incomingToken = useLocalStorage<string | null>(LINK_TOKEN_STORAGE_KEY, null);
	const manualAdoptionProbeIp = ref('');

	const isVisible = computed(() => showManualFlow.value
		|| (
			(!!activeProbe.value || successDialogOpen.value)
			&& isIdlePolling.value
			&& !showLocalNetworkAccessPopup.value
		));

	watch(isVisible, () => {
		if (isVisible.value) {
			store.startBackgroundTokenCheck();
		} else {
			store.stopBackgroundTokenCheck();
		}
	}, { immediate: true });

	const onAdoptClick = async () => {
		if (!activeProbe.value) {
			return;
		}

		loading.value = true;

		if (!activeProbe.value.token) {
			return adoptWithoutToken();
		}

		await proceedWithAdoption(activeProbe.value.token);
	};

	let adoptionTimeout: ReturnType<typeof setTimeout> | undefined;

	const adoptWithoutToken = async () => {
		await navigateTo(`http://${activeProbe.value!.localIp}:${config.probeAdoptionPort}/adopt`, {
			external: true,
			open: {
				target: '_blank',
			},
		});

		adoptionTimeout = setTimeout(() => {
			adoptionTimeout = undefined;
			loading.value = false;
			hasError.value = true;
			sendErrorToast(new Error('Adoption timed out. No token received within 5 seconds.'));
		}, 5000);
	};

	const proceedWithAdoption = async (token: string) => {
		try {
			const newProbe = await store.onConfirmAdoption(token, activeProbe.value!.localIp);
			newProbes.value = [ newProbe ];
			successDialogOpen.value = true;
		} catch (e) {
			sendErrorToast(e);
			hasError.value = true;
		} finally {
			loading.value = false;
		}
	};

	watch(incomingToken, (newToken) => {
		if (newToken && adoptionTimeout) {
			clearTimeout(adoptionTimeout);
			adoptionTimeout = undefined;
			localStorage.removeItem(LINK_TOKEN_STORAGE_KEY);
			proceedWithAdoption(newToken);
		}
	});

	const onManualAdoptionClick = () => {
		manualAdoptionProbeIp.value = activeProbe.value?.publicIp ?? '';
		activeProbe.value && store.onFailedAdoption(activeProbe.value.token, activeProbe.value.localIp);
		hasError.value = false;
		showManualFlow.value = true;
	};

	const onIgnoreClick = () => {
		if (!activeProbe.value) {
			return;
		}

		clearTimeout(adoptionTimeout);
		adoptionTimeout = undefined;
		loading.value = false;

		if (hasError.value) {
			hasError.value = false;
			store.onFailedAdoption(activeProbe.value.token, activeProbe.value.localIp);
		} else {
			store.onRejectAdoption(activeProbe.value.token, activeProbe.value.localIp);
		}
	};

	const onSuccessDialogClose = () => {
		successDialogOpen.value = false;
		newProbes.value = [];
	};

	onUnmounted(() => {
		adoptionTimeout && clearTimeout(adoptionTimeout);
	});
</script>
