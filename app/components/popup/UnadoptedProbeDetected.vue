<template>
	<Dialog
		v-model:visible="isVisible"
		modal
		:header="successDialogOpen ? 'Probe Adopted' : 'New Hardware Probe Detected'"
		class="w-[80vw] md:w-[45rem]"
		:draggable="false"
		:closable="false"
	>
		<ProbeAdoptedContent
			v-if="successDialogOpen"
			:probes="newProbes"
			@cancel="onSuccessDialogClose"
		/>

		<div v-else-if="activeProbe" class="flex flex-col items-center gap-4 text-center">
			<BigIcon class="size-16 bg-surface-50 [&_*]:text-2xl" name="docker" :filled="true" :border="true"/>

			<div class="mb-2 flex w-full flex-col gap-3">
				<p class="md:text-lg md:font-bold">
					A new Globalping hardware probe is available on your network.
				</p>
				<div class="rounded-xl border bg-surface-0 p-3 dark:border-dark-500 dark:bg-dark-800">
					<p class="flex items-center justify-center font-bold">
						<CountryFlag :country="activeProbe.country" size="small"/>
						<span class="ml-2">{{ activeProbe.city }}</span>
					</p>
					<p>{{ activeProbe.network }}</p>
					<p class="font-mono">{{ activeProbe.ip }}</p>
				</div>
			</div>

			<div class="flex w-full gap-2 max-md:flex-col-reverse">
				<Button
					label="Ignore"
					severity="secondary"
					class="flex-1"
					@click="onIgnoreClick"
				/>
				<Button
					label="Adopt Probe"
					class="flex-1"
					:loading="loading"
					@click="onAdoptClick"
				/>
			</div>
		</div>
	</Dialog>
</template>

<script setup lang="ts">
	import CountryFlag from 'vue-country-flag-next';
	import { useHardwareProbeAdoption } from '~/store/local-adoption';
	import { sendErrorToast } from '~/utils/send-toast';

	const store = useHardwareProbeAdoption();
	const { activeProbe, adoptionModalOpen } = storeToRefs(store);

	const loading = ref(false);
	const successDialogOpen = ref(false);
	const newProbes = ref<Probe[]>([]);

	const isVisible = computed(() => (!!activeProbe.value || successDialogOpen.value) && !adoptionModalOpen.value);

	const onAdoptClick = async () => {
		if (!activeProbe.value) {
			return;
		}

		loading.value = true;
		const tokenToAdopt = activeProbe.value.token;

		try {
			const newProbe = await store.onConfirmAdoption(tokenToAdopt);
			newProbes.value = [ newProbe ];
			successDialogOpen.value = true;
			await store.updateCurrentProbe();
		} catch (e) {
			sendErrorToast(e);
		} finally {
			loading.value = false;
		}
	};

	const onIgnoreClick = async () => {
		if (!activeProbe.value) {
			return;
		}

		const tokenToIgnore = activeProbe.value.token;
		store.onRejectAdoption(tokenToIgnore);

		await store.updateCurrentProbe();
	};

	const onSuccessDialogClose = () => {
		successDialogOpen.value = false;
		newProbes.value = [];
	};
</script>
