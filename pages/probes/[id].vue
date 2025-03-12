<template>
	<div class="min-h-full p-6">
		<div class="flex flex-col gap-4">
			<div class="flex gap-2">
				<NuxtLink to="/probes" class="mr-auto flex items-center gap-2">
					<i class="pi pi-arrow-left text-bluegray-500"/>
					<span class="font-bold text-bluegray-500">Back to probes</span>
				</NuxtLink>
			</div>

			<div v-if="probeDetails" class="flex items-center gap-4">
				<div class="flex items-center gap-3">
					<img class="h-10" src="~/assets/icons/gp-white.svg" alt="Globalping White logo">

					<span class="text-2xl font-bold">{{ probeDetails.city }} {{ probeDetails.country }}{{ probeDetails.asn }}</span>

					<i class="pi pi-pencil text-lg"/>
				</div>

				<div class="flex h-8 items-center gap-1 rounded-full border border-surface-300">
					<span class="flex items-center gap-2 pl-3">
						<i class="pi pi-circle-fill text-[8px] text-green-500"/>

						<span class="font-bold text-bluegray-900">
							{{ capitalize(probeDetails.status) }}
						</span>
					</span>

					<span class="mx-1 rounded-full bg-surface-200 px-2 py-0.5 font-bold text-bluegray-900">
						v{{ probeDetails.version }}
					</span>
				</div>

				<div class="ml-auto flex items-center gap-2">
					<span class="text-bluegray-900">
						Credits per month
					</span>

					<span class="flex h-[30px] items-center gap-2 rounded-md border border-surface-300 px-2">
						<nuxt-icon class="text-green-500" name="coin"/>
						<span class="font-bold text-green-500">+{{ 400 }}</span>
					</span>
				</div>
			</div>

			<div class="flex items-center justify-start gap-2 rounded-xl bg-surface-100 p-4">
				<div class="flex items-center gap-2">
					<span>Primary IP:</span>
					<span class="relative flex h-9 items-center rounded-xl border border-surface-300 bg-white pl-3 pr-8 font-bold text-dark-800">
						2001:1000:130f:2000:3000:09c0:876a:130c
						<i class="pi pi-copy absolute right-3 cursor-pointer text-lg"/>
					</span>
				</div>

				<div class="flex items-center gap-2">
					<span>Alternative IPs:</span>
					<span class="relative flex h-9 items-center rounded-xl border border-surface-300 bg-white pl-3 pr-8 font-bold text-dark-800">
						1000:2001:130f:2000:3000:876a:130c

						<i class="pi pi-copy absolute right-3 cursor-pointer text-lg"/>
					</span>
				</div>

				<span class="flex h-[38px] w-28 cursor-pointer items-center justify-center font-bold text-bluegray-900">
					Show more
				</span>
			</div>

			<Tabs value="0">
				<TabList class="!border-b !border-surface-300">
					<Tab value="0" class="border-none !px-6 !py-2 !text-[14px] !font-bold">Details</Tab>
					<Tab value="1" class="border-none !px-6 !py-2 !text-[14px] !font-bold">Logs</Tab>
				</TabList>

				<TabPanels class="mt-6 !bg-transparent !p-0">
					<TabPanel value="0">
						<div class="flex flex-col gap-6">
							<div class="flex gap-4">
								<div class="flex w-1/2 flex-col rounded-xl border border-surface-300 bg-white">
									<h3 class="flex h-10 items-center border-b border-surface-300 px-6 font-bold text-dark-800">Location</h3>

									<div class="flex flex-col gap-3 p-6">
										<p class="text-sm leading-[100%] text-bluegray-600">
											City where the probe is located. If the auto-detected value is wrong, you can adjust it here.
										</p>

										<div id="gp-map" class="TODO_MAP h-[197px] w-full rounded-md bg-surface-200"/>
									</div>
								</div>

								<div class="flex w-1/2 flex-col gap-4">
									<div class="flex grow basis-0 flex-col rounded-xl border border-surface-300 bg-white">
										<h3 class="flex h-10 items-center border-b border-surface-300 px-6 font-bold text-dark-800">
											User tags
										</h3>

										<div class="flex flex-col gap-3 p-6">
											<p class="text-sm leading-[100%] text-bluegray-600">
												Public user-defined tags that can be used to target the probe in measurements. Each tag must be prefixed by your GitHub username or organization. E.g., for a user with username jimaek and tag home-1 the final tag would be u-jimaek-home-1.
											</p>

											<div class="flex gap-1">
												<div class="flex flex-wrap gap-1">
													<span class="flex h-6 items-center whitespace-nowrap rounded-md border border-surface-300 px-2 text-xs text-bluegray-900">
														u-MartinKolarik-probe
													</span>
													<span class="flex h-6 items-center whitespace-nowrap rounded-md border border-surface-300 px-2 text-xs text-bluegray-900">
														du-MartinKolarik-online
													</span>
													<span class="flex h-6 items-center whitespace-nowrap rounded-md border border-surface-300 px-2 text-xs text-bluegray-900">
														du-MartinKolarik-de
													</span>
												</div>

												<Button class="h-6 !border-surface-200 bg-surface-200 !px-3 !py-0 hover:bg-transparent">
													<i class="pi pi-pencil text-sm text-dark-800"/>
													<span class="text-xs text-dark-800">Edit</span>
												</Button>
											</div>
										</div>
									</div>

									<div class="flex grow basis-0 flex-col rounded-xl border border-surface-300 bg-white">
										<h3 class="flex h-10 items-center border-b border-surface-300 px-6 font-bold text-dark-800">
											System tags
										</h3>

										<div class="flex flex-col gap-3 p-6">
											<p class="text-sm leading-[100%] text-bluegray-600">
												Public tags that can be used to target the probe in measurements.
											</p>

											<div class="flex gap-1">
												<div class="flex flex-wrap gap-1">
													<span class="flex h-6 items-center whitespace-nowrap rounded-md border border-surface-300 px-2 text-xs text-bluegray-900">
														datacenter-network
													</span>
												</div>
												<Button class="h-6 !border-surface-200 bg-surface-200 !px-3 !py-0 hover:bg-transparent">
													<i class="pi pi-pencil text-sm text-dark-800"/>
													<span class="text-xs text-dark-800">Edit</span>
												</Button>
											</div>
										</div>
									</div>
								</div>
							</div>

							<div class="flex flex-col rounded-xl border border-surface-300">
								<h3 class="flex h-10 items-center border-b border-surface-300 pl-6 font-bold text-dark-800">Tests (last 24h)</h3>
								<div class="flex flex-col gap-6 p-6">
									<div>
										<span class="text-bluegray-900">Total: </span>
										<span class="font-bold text-bluegray-900">{{ '347,530' }} tests</span>
									</div>

									<div class="h-36">
										<ProbeTestsChart/>
									</div>
								</div>
							</div>

							<div class="flex h-[68px] items-center justify-between rounded-xl bg-surface-100 px-6">
								<span class="flex gap-2">
									<i class="pi pi-info-circle text-lg text-bluegray-900"/>
									<span class="text-bluegray-900">Removing the probe will result in data loss.</span>
								</span>

								<Button
									class="!h-9"
									severity="secondary"
									outlined
									label="Remove probe"
									icon="pi pi-trash"
									:loading="deleteProbeLoading"
									@click="deleteDialog = true"
								/>
							</div>
						</div>
					</TabPanel>

					<TabPanel value="1">
						NO LOGS FOR NOW
					</TabPanel>
				</TabPanels>
			</Tabs>
		</div>

		<GPDialog
			v-if="probeDetails"
			v-model:visible="deleteDialog"
			header="Delete probe"
		>
			<div class="flex items-center">
				<div>
					<i class="pi pi-exclamation-triangle text-xl text-primary"/>
				</div>
				<div class="ml-3">
					<p>You are about to delete probe <span class="font-bold">{{ probeDetails.name || probeDetails.city }}</span> ({{ probeDetails.ip }}).</p>
					<p>Are you sure you want to delete this probe? You will not be able to undo this action.</p>
				</div>
			</div>
			<div class="mt-7 text-right">
				<Button class="mr-2" label="Cancel" severity="secondary" text @click="deleteDialog = false"/>
				<Button label="Delete probe" severity="danger" @click="deleteProbe"/>
			</div>
		</GPDialog>
	</div>
</template>

<script setup lang="ts">
	import { readItem, deleteItem } from '@directus/sdk';
	import capitalize from 'lodash/capitalize';
	import { useGoogleMaps } from '~/composables/maps';
	import { initGoogleMap } from '~/utils/init-google-map';
	import { sendErrorToast, sendToast } from '~/utils/send-toast';

	const { $directus } = useNuxtApp();
	const route = useRoute();
	const router = useRouter();
	const probeId = route.params.id as string;
	const probeDetails = ref<Probe | null>(null);
	const deleteDialog = ref(false);
	const deleteProbeLoading = ref(false);
	const emit = defineEmits([ 'save', 'hide', 'delete' ]);

	let removeWatcher: (() => void) | undefined;

	onMounted(() => {
		useGoogleMaps(() => {
			const stopWatching = watchEffect(async () => {
				if (probeDetails.value) {
					removeWatcher = await initGoogleMap(probeDetails.value);
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

	useHead(() => {
		return {
			title: probeDetails.value ? `Probe '${probeDetails.value.name || probeDetails.value.city}' -` : 'Probe -',
		};
	});

	const loadProbeData = async (id: string) => {
		try {
			probeDetails.value = await $directus.request(readItem('gp_adopted_probes', id));

			console.log('+++++ probeDetails.value', probeDetails.value);
			console.log('_________________________');
		} catch (e) {
			const response = (e as { response?: Response } | undefined)?.response;

			if (response?.status === 403) {
				return navigateTo('/probes');
			}

			sendErrorToast(e);
		}
	};

	const deleteProbe = async () => {
		deleteProbeLoading.value = true;

		try {
			if (probeDetails.value) {
				await $directus.request(deleteItem('gp_adopted_probes', probeDetails.value.id));
				sendToast('success', 'Done', 'The probe has been deleted');
				emit('delete');
				router.push('/probes');
			}
		} catch (e) {
			sendErrorToast(e);
		}

		deleteProbeLoading.value = false;
	};

	loadProbeData(probeId);
</script>
