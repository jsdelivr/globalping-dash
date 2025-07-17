<template>
	<div class="flex flex-col gap-6">
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-2">
			<div class="col-span-1 flex flex-col rounded-xl border border-surface-300 bg-white md:col-span-1 lg:col-span-1 dark:border-dark-600 dark:bg-dark-800">
				<h3 class="flex h-10 items-center border-b border-surface-300 px-6 font-bold text-dark-800 dark:border-dark-600 dark:text-bluegray-0">
					Location
				</h3>

				<div class="flex grow flex-col gap-3 p-6">
					<p class="text-sm leading-[125%] text-bluegray-600 dark:text-bluegray-0">
						Location of the probe. If the auto-detected value is wrong, you can adjust it here.
						<span v-if="probe.allowedCountries.length > 1">The country can only be changed to one of the values reported by our GeoIP providers.</span>
					</p>

					<div class="relative h-80 min-h-80 w-full grow overflow-hidden rounded-md bg-surface-200 sm:h-auto dark:bg-dark-950">
						<div id="gp-map" class="size-full rounded-md"/>

						<span
							v-if="probe"
							class="absolute right-4 top-4 rounded-xl border border-surface-300 bg-white px-2 py-1 font-bold leading-none text-dark-800 dark:border-dark-600 dark:bg-dark-800 dark:text-bluegray-0"
						>
							{{ probe.network }} {{ probe.asn }}
						</span>

						<ProbeLocationInput v-model:probe-details-updating="probeDetailsUpdating" v-model:probe="probe" :map-center-y-offset-px="MAP_CENTER_Y_OFFSET_PX"/>
					</div>
				</div>
			</div>

			<div class="grid auto-rows-max grid-cols-1 gap-4">
				<ProbeUserTagsBlock v-model:probe="probe" v-model:probe-details-updating="probeDetailsUpdating"/>

				<div class="flex flex-col self-start rounded-xl border border-surface-300 bg-white dark:border-dark-600 dark:bg-dark-800">
					<h3 class="flex h-10 items-center border-b border-surface-300 px-6 font-bold text-dark-800 dark:border-dark-600 dark:text-bluegray-0">
						System tags
					</h3>

					<div class="flex flex-col gap-3 p-6">
						<p class="text-sm leading-[125%] text-bluegray-600 dark:text-bluegray-0">
							Public tags that can be used to target the probe in measurements.
						</p>

						<div class="flex gap-1">
							<div v-if="probe" class="flex flex-wrap gap-1">
								<span
									v-for="(tag, index) in probe.systemTags"
									:key="index"
									class="flex h-6 items-center whitespace-nowrap rounded-md border border-surface-300 px-2 text-xs text-bluegray-900 dark:border-dark-600 dark:text-bluegray-0"
								>
									{{ tag }}
								</span>

								<span
									v-if="!probe.systemTags.length"
									class="flex h-6 items-center whitespace-nowrap rounded-md border border-surface-300 px-2 text-xs text-bluegray-900 dark:border-dark-600 dark:text-bluegray-0"
								>
									No system tags
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div v-if="showChart" class="flex flex-col rounded-xl border border-surface-300 dark:border-dark-600">
			<h3 class="flex h-10 items-center border-b border-surface-300 pl-6 font-bold text-dark-800 dark:border-dark-600 dark:text-bluegray-0">Tests (last 24h)</h3>
			<div class="flex flex-col gap-6 p-6">
				<div>
					<span class="text-bluegray-900 dark:text-bluegray-0">Total: </span>
					<span class="font-bold text-bluegray-900 dark:text-bluegray-0">{{ testsCountDisplayed }} tests</span>
				</div>

				<div class="h-36">
					<ProbeTestsChart/>
				</div>
			</div>
		</div>

		<div class="flex flex-col gap-4 border-t py-4 sm:flex-row sm:items-center sm:justify-end">
			<Button
				class="!h-9"
				severity="secondary"
				outlined
				label="Delete probe"
				icon="pi pi-trash"
				aria-label="Delete probe"
				aria-haspopup="dialog"
				:aria-expanded="deleteDialog"
				aria-controls="removeProbeDialog"
				@click="deleteDialog = true"
			/>
		</div>

		<GPDialog
			v-if="probe"
			id="removeProbeDialog"
			v-model:visible="deleteDialog"
			header="Delete probe"
			aria-label="Remove a probe dialog"
		>
			<div class="flex items-center">
				<div>
					<i class="pi pi-exclamation-triangle text-xl text-primary"/>
				</div>
				<div class="ml-3">
					<p>You are about to delete probe <span class="font-bold">{{ probe.name || probe.city }}</span> ({{ probe.ip }}).</p>
					<p>Are you sure you want to delete this probe? You will not be able to undo this action.</p>
				</div>
			</div>
			<div class="mt-7 text-right">
				<Button class="mr-2" label="Cancel" severity="secondary" text @click="deleteDialog = false"/>
				<Button :loading="deleteProbeLoading" :aria-disabled="deleteProbeLoading" label="Delete probe" severity="danger" @click="deleteProbe"/>
			</div>
		</GPDialog>
	</div>
</template>

<script setup lang="ts">
	import { updateItem } from '@directus/sdk';
	import { useGoogleMaps } from '~/composables/maps';
	import { initGoogleMap } from '~/utils/init-google-map';
	import { sendErrorToast, sendToast } from '~/utils/send-toast';

	const MAP_CENTER_Y_OFFSET_PX = 36;
	const deleteDialog = ref(false);
	const deleteProbeLoading = ref(false);
	const { $directus } = useNuxtApp();

	const probe = defineModel('probe', {
		type: Object as PropType<Probe>,
		required: true,
	});

	const probeDetailsUpdating = defineModel('probeDetailsUpdating', {
		type: Boolean,
		required: true,
	});

	const router = useRouter();

	const deleteProbe = async () => {
		deleteProbeLoading.value = true;

		try {
			if (probe.value) {
				await $directus.request(updateItem('gp_probes', probe.value.id, { userId: null }));
				sendToast('success', 'Done', 'The probe has been deleted');
				router.push('/probes');
			}
		} catch (e) {
			sendErrorToast(e);
		}

		deleteProbeLoading.value = false;
	};

	// HANDLE GOOGLE MAP UPDATING
	let removeWatcher: (() => void) | undefined;

	onMounted(() => {
		useGoogleMaps(() => {
			const stopWatching = watchEffect(async () => {
				if (probe.value) {
					removeWatcher = await initGoogleMap(probe.value, true, false, MAP_CENTER_Y_OFFSET_PX);
					stopWatching();
				}
			});
		});
	});

	onUnmounted(() => {
		if (removeWatcher) {
			removeWatcher();
		}
	});

	// HANDLE CHART
	const testsCount = ref(347530);
	const testsCountDisplayed = testsCount.value?.toLocaleString();
	const showChart = ref(false);
</script>
