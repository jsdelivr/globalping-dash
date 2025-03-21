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
				<div
					v-if="probeDetails"
					class="relative flex cursor-pointer items-center gap-3"
					@click="!isEditingName && enableNameEditing()"
				>
					<img class="h-10" src="~/assets/icons/gp-white.svg" alt="Globalping White logo">

					<input
						v-if="isEditingName"
						ref="inputNameRef"
						v-model="editedName"
						class="rounded-xl border border-gray-300 px-2 py-1 pr-16 text-xl font-bold focus:outline-none focus:ring-1 focus:ring-[var(--p-primary-color)]"
						@keyup.enter="updateProbeName"
						@blur="cancelNameEditing"
					>

					<span v-else class="text-2xl font-bold">
						{{ name }}
					</span>

					<button
						v-if="isEditingName && editedName !== originalName"
						class="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-[var(--p-primary-color)] px-2 py-1 text-sm font-bold text-white"
						@click.stop="updateProbeName"
					>
						Save
					</button>

					<i v-if="!isEditingName" class="pi pi-pencil text-lg"/>
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

			<div
				v-if="probeDetails"
				ref="ipsContentRef"
				class="flex flex-wrap items-start gap-2 overflow-hidden rounded-xl bg-surface-100 p-4 transition-[height] duration-500 ease-in-out"
				:style="{ height: ipsContentHeight }"
			>
				<span class="flex h-[38px] items-center whitespace-nowrap">Primary IP:</span>
				<span class="relative flex h-9 items-center rounded-xl border border-surface-300 bg-white pl-3 pr-8 font-bold text-dark-800">
					{{ probeDetails.ip }}
					<CopyButton :content="probeDetails.ip" class="!top-[7px] size-5 cursor-pointer [&>button]:!size-full [&>button]:!border-none [&>button]:!p-0"/>
				</span>

				<span class="flex h-[38px] items-center whitespace-nowrap">Alternative IPs:</span>
				<span
					v-for="(altIp, index) in limitIpsToShow()"
					:key="index"
					class="relative flex h-9 items-center rounded-xl border border-surface-300 bg-white pl-3 pr-8 font-bold text-dark-800"
				>
					{{ altIp }}
					<CopyButton :content="altIp" class="!top-[7px] mb-px size-5 cursor-pointer [&>button]:!size-full [&>button]:!border-none [&>button]:!p-0"/>
				</span>

				<span
					v-if="(probeDetails?.altIps?.length || 0) > 1"
					class="flex h-[38px] w-28 cursor-pointer items-center justify-center font-bold text-bluegray-900"
					@click="showHideMoreIps"
				>
					{{ showMoreIps ? 'Show less' : 'Show more' }}
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

									<div class="flex grow flex-col gap-3 p-6">
										<p class="text-sm leading-[100%] text-bluegray-600">
											City where the probe is located. If the auto-detected value is wrong, you can adjust it here.
										</p>

										<div class="relative w-full grow overflow-hidden rounded-md bg-surface-200">
											<div id="gp-map" class="size-full rounded-md"/>

											<span
												v-if="probeDetails"
												class="absolute right-4 top-4 rounded-xl border border-surface-300 bg-white px-2 py-1 font-bold leading-none text-dark-800"
											>
												{{ probeDetails.network }} {{ probeDetails.asn }}
											</span>

											<!-- here -->
											<div
												v-if="probeDetails"
												class="absolute bottom-9 left-4 flex h-[38px] w-[86%] overflow-hidden rounded-md border border-[#D1D5DB]"
												@click="!isEditingCity && enableCityEditing()"
											>
												<span class="flex w-[38px] shrink-0 items-center justify-center border-r border-r-[#D1D5DB] bg-[#E5E7EB]">
													<CountryFlag :country="probeDetails.country" size="small"/>
												</span>

												<input
													v-if="isEditingCity"
													ref="inputCityRef"
													v-model="editedCity"
													class="flex w-full border-0 pl-3 pr-16 text-bluegray-900 shadow-none outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0"
													@keyup.enter="updateProbeCity"
													@blur="cancelCityEditing"
												>

												<span
													v-else
													class="flex w-full items-center bg-white px-3 text-bluegray-900"
												>
													{{ city }}
												</span>

												<button
													v-if="isEditingCity && editedCity !== originalCity"
													class="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-[var(--p-primary-color)] px-2 py-1 text-sm font-bold text-white"
													@click.stop="updateProbeCity"
												>
													Save
												</button>

												<i v-if="!isEditingCity" class="pi pi-pencil text-md absolute right-3 top-1/2 -translate-y-1/2"/>
											</div>
										</div>
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
												<div v-if="probeDetails" class="flex flex-wrap gap-1">
													<span
														v-for="(tag, index) in probeDetails.tags"
														:key="index"
														class="flex h-6 items-center whitespace-nowrap rounded-md border border-surface-300 px-2 text-xs text-bluegray-900"
													>
														{{ `u-${tag.prefix}-${tag.value}` }}
													</span>
												</div>

												<Button
													class="h-6 !border-surface-200 bg-surface-200 !px-3 !py-0 hover:bg-transparent"
													@click="openEditTagsPopover($event)"
												>
													<i class="pi pi-pencil text-sm text-dark-800"/>
													<span class="text-xs text-dark-800">Edit</span>
												</Button>

												<Popover ref="tagPopoverRef">
													<div v-if="probeDetails" class="grid w-[500px] flex-1 grid-rows-[auto_1fr] p-4">
														<div class="mb-2 grid grid-cols-[3fr_auto_3fr_1fr] text-xs">
															<div class="content-center font-bold text-dark-800">Prefix</div>
															<div class="mx-3"/>
															<div class="content-center font-bold text-dark-800">Your tag</div>
															<div/>
														</div>

														<div v-for="(tag, index) in tagsToEdit" :key="index" class="mb-5 grid flex-1 grid-cols-[3fr_auto_3fr_1fr] items-center">
															<Select v-model="tag.uPrefix" class="flex-1" :options="uPrefixes" :scroll-height="'200px'"/>
															<div class="mx-2">{{ probeDetails.tags[0]?.format === 'v1' ? '-' : ':' }}</div>
															<div class="relative flex-1">
																<InputText v-model="tag.value" :invalid="!isTagValid(tag.value)" class="w-full" placeholder="my-tag"/>
																<p v-if="!isTagValid(tag.value)" class="absolute pl-1 text-red-500">Invalid tag</p>
															</div>

															<div class="ml-2 flex gap-1">
																<Button
																	icon="pi pi-trash"
																	text
																	aria-label="Remove"
																	class="text-surface-900 dark:text-surface-0"
																	@click="removeTag(index)"
																/>

																<Button
																	icon="pi pi-plus"
																	text
																	aria-label="Add tag"
																	class="text-surface-900 dark:text-surface-0"
																	:class="{
																		'pointer-events-none opacity-0': index + 1 !== tagsToEdit.length,
																	}"
																	@click="addTag()"
																/>
															</div>
														</div>

														<div class="mt-4 flex justify-between">
															<Button
																label="Cancel"
																severity="secondary"
																class="dark:!bg-dark-800"
																outlined
																@click="closeEditTagsPopover"
															/>
															<Button
																label="Save"
																@click="updateProbeTags"
															/>
														</div>
													</div>
												</Popover>
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
												<div v-if="probeDetails" class="flex flex-wrap gap-1">
													<span
														v-for="(tag, index) in probeDetails.systemTags"
														:key="index"
														class="flex h-6 items-center whitespace-nowrap rounded-md border border-surface-300 px-2 text-xs text-bluegray-900"
													>
														{{ tag }}
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
	import { readItem, deleteItem, updateItem } from '@directus/sdk';
	import capitalize from 'lodash/capitalize';
	import memoize from 'lodash/memoize';
	import CountryFlag from 'vue-country-flag-next';
	import { useGoogleMaps } from '~/composables/maps';
	import { useAuth } from '~/store/auth';
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
	const auth = useAuth();
	const user = auth.getUser as User;

	let removeWatcher: (() => void) | undefined;

	onMounted(() => {
		useGoogleMaps(() => {
			const stopWatching = watchEffect(async () => {
				if (probeDetails.value) {
					removeWatcher = await initGoogleMap(probeDetails.value, true);
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

	// HANDLE PROBE NAME
	const isEditingName = ref(false);
	const editedName = ref('');
	const originalName = ref('');
	const inputNameRef = ref<HTMLInputElement | null>(null);

	const name = computed(() => {
		if (probeDetails.value) {
			if (probeDetails.value.name) {
				return probeDetails.value.name;
			}

			return `${probeDetails.value.city} ${probeDetails.value.country} ${probeDetails.value.asn}`;
		}

		return '';
	});

	watch(name, (newName) => {
		originalName.value = newName;
		editedName.value = newName;
	}, { immediate: true });

	const enableNameEditing = async () => {
		isEditingName.value = true;

		await nextTick();

		if (inputNameRef.value) {
			inputNameRef.value.focus();
			inputNameRef.value.select();
		}
	};

	const cancelNameEditing = (event: FocusEvent) => {
		const target = event.relatedTarget as HTMLElement | null;

		if (target?.tagName === 'BUTTON') { return; }

		editedName.value = originalName.value;
		isEditingName.value = false;
	};

	const updateProbeName = async () => {
		if (!probeDetails.value) { return; }

		if (editedName.value === originalName.value) {
			isEditingName.value = false;

			return;
		}

		try {
			await $directus.request(updateItem('gp_adopted_probes', probeDetails.value.id, { name: editedName.value }));

			sendToast('success', 'Done', 'The probe has been successfully updated');
			emit('save');

			originalName.value = editedName.value;
			isEditingName.value = false;
			probeDetails.value.name = editedName.value;
		} catch (e) {
			sendErrorToast(e);
		}
	};

	// HANDLE PROBE CITY
	const isEditingCity = ref(false);
	const editedCity = ref('');
	const originalCity = ref('');
	const inputCityRef = ref<HTMLInputElement | null>(null);

	const city = computed(() => {
		return probeDetails.value ? probeDetails.value.city : '';
	});

	watch(city, (newCity) => {
		originalCity.value = newCity;
		editedCity.value = newCity;
	}, { immediate: true });

	const enableCityEditing = async () => {
		isEditingCity.value = true;

		await nextTick();

		if (inputCityRef.value) {
			inputCityRef.value.focus();
			inputCityRef.value.select();
		}
	};

	const cancelCityEditing = (event: FocusEvent) => {
		const target = event.relatedTarget as HTMLElement | null;

		if (target?.tagName === 'BUTTON') { return; }

		editedCity.value = originalCity.value;
		isEditingCity.value = false;
	};

	const updateProbeCity = async () => {
		if (!probeDetails.value) { return; }

		if (editedCity.value === originalCity.value) {
			isEditingCity.value = false;

			return;
		}

		try {
			await $directus.request(updateItem('gp_adopted_probes', probeDetails.value.id, { city: editedCity.value }));

			sendToast('success', 'Done', 'The probe has been successfully updated');
			emit('save');

			originalCity.value = editedCity.value;
			isEditingCity.value = false;
			probeDetails.value.name = editedCity.value;
		} catch (e) {
			sendErrorToast(e);
		}
	};

	// HANDLE PRIMARY, ALT IPS
	const showMoreIps = ref(false);
	const ipsContentRef = ref<HTMLDivElement | null>(null);
	const ipsContentHeight = ref('auto');
	let initialIpsContentHeight = 'auto';

	const showHideMoreIps = () => {
		showMoreIps.value = !showMoreIps.value;

		nextTick(updateIpsContentHeight);
	};

	const limitIpsToShow = () => {
		if (showMoreIps.value) {
			return probeDetails?.value?.altIps;
		}

		return probeDetails?.value?.altIps.slice(0, 1);
	};

	const updateIpsContentHeight = () => {
		if (!ipsContentRef.value) { return; }

		if (showMoreIps.value) {
			ipsContentHeight.value = `${ipsContentRef.value.scrollHeight}px`;
		} else {
			ipsContentHeight.value = initialIpsContentHeight;
		}
	};

	watch(probeDetails, async () => {
		await nextTick();

		if (ipsContentRef.value) {
			initialIpsContentHeight = `${ipsContentRef.value.scrollHeight}px`;
			ipsContentHeight.value = initialIpsContentHeight;
		}
	});

	// HANDLE TAGS EDITING
	type Popover = {
		toggle: (event: Event) => void;
		show: (event: Event) => void;
		hide: (event: Event) => void;
		visible: boolean;
	};
	const uPrefixes = [ user.github_username, ...user.github_organizations ].map(value => `u-${value}`);
	const tagPopoverRef = ref<Popover | null>(null);
	const tagsToEdit = ref<{ uPrefix: string, value: string }[]>([]);
	const isEditingTags = ref<boolean>(false);

	const openEditTagsPopover = (event: Event) => {
		editTags();

		tagPopoverRef.value?.toggle(event);
	};

	const closeEditTagsPopover = (event: Event) => {
		tagPopoverRef.value?.hide(event);
	};

	const tagRegex = /^[a-zA-Z0-9-]+$/;
	const isTagValid = memoize((value: string) => {
		return value === '' || (value.length <= 32 && tagRegex.test(value));
	});

	const editTags = () => {
		isEditingTags.value = true;

		tagsToEdit.value = probeDetails && probeDetails.value ? probeDetails.value.tags.map(({ prefix, value }) => ({
			uPrefix: `u-${prefix}`,
			value,
		})) : [];
	};

	const addTag = () => {
		isEditingTags.value = true;
		tagsToEdit.value.push({ uPrefix: `u-${user.github_username}`, value: '' });
	};

	const removeTag = (index: number) => {
		tagsToEdit.value?.splice(index, 1);
	};

	const convertTags = (tagsToEdit: { uPrefix: string, value: string }[]) => tagsToEdit.map(({ uPrefix, value }) => ({
		prefix: uPrefix.replace('u-', ''),
		value,
	}));

	const updateProbeTags = async () => {
		const tags = isEditingTags.value ? convertTags(tagsToEdit.value) : probeDetails?.value?.tags;

		console.log('++++ UPD TAGS VALUE', tags);
		console.log('________________________________');
	};
</script>
