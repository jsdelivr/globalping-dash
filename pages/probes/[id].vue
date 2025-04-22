<template>
	<div class="min-h-full p-6">
		<div class="flex flex-col gap-4">
			<div class="flex gap-2">
				<NuxtLink :href="getBackToProbesHref()" class="mr-auto flex cursor-pointer items-center gap-2">
					<i class="pi pi-arrow-left text-bluegray-500"/>
					<span class="font-bold text-bluegray-500">Back to probes</span>
				</NuxtLink>

				<div v-if="probeDetails" class="flex h-8 items-center gap-1 rounded-full border border-surface-300 md:hidden dark:border-dark-600">
					<span class="flex items-center gap-2 pl-3">
						<i class="pi pi-circle-fill text-[8px]" :class="getProbeStatusColor(probeDetails.status)"/>

						<span class="font-bold text-bluegray-900 dark:text-[var(--bluegray-0)]">
							{{ capitalize(probeDetails.status) }}
						</span>
					</span>

					<span class="mx-1 rounded-full bg-surface-200 px-2 py-0.5 font-bold text-bluegray-900 dark:text-[var(--bluegray-0)]">
						v{{ probeDetails.version }}
					</span>
				</div>
			</div>

			<div v-if="probeDetails" class="flex w-full flex-col items-center gap-4 sm:flex-row sm:flex-wrap">
				<div
					v-if="probeDetails"
					id="probeNameInput"
					class="relative flex h-[42px] w-full cursor-pointer items-center gap-1 sm:w-auto"
					:class="{
						'[&>input]:outline-none [&>input]:ring-1 [&>input]:ring-[var(--p-primary-color)]': isEditingName,
						'[&>input]:dark:border-dark-600 [&>input]:dark:bg-dark-800': isEditingName,
					}"
					role="button"
					aria-label="Edit probe name"
					aria-pressed="false"
					:tabindex="isEditingName ? -1 : 0"
					@click="!isEditingName && enableNameEditing()"
				>
					<img v-if="isDarkMode" class="h-10" src="~/assets/icons/gp-dark.svg" alt="Globalping Dark Logo">
					<img v-else class="h-10" src="~/assets/icons/gp-white.svg" alt="Globalping White Logo">

					<input
						v-if="isEditingName"
						ref="inputNameRef"
						v-model="editedName"
						class="flex w-[calc(100%-52px)] rounded-xl border border-gray-300 py-1 pl-2 pr-[72px] text-2xl font-bold"
						aria-label="Probe name input"
						@keyup.enter="updateProbeName"
						@blur="cancelNameEditingOnBlur"
					>

					<div v-else class="flex w-[calc(100%-52px)] truncate px-[9px] py-[5px] text-2xl font-bold">
						{{ name }}
					</div>

					<Button
						v-if="isEditingName && editedName !== originalName"
						severity="undefined"
						icon="pi pi-check"
						class="!absolute !right-4 !top-1/2 mr-8 !h-7 w-7 !-translate-y-1/2 !rounded-md !px-2 !py-1 !text-sm !font-bold focus:!border-[var(--p-primary-color)] focus:ring-[var(--p-primary-color)]"
						:loading="probeDetailsUpdating"
						:disabled="probeDetailsUpdating"
						aria-label="Save probe name"
						@click.stop="updateProbeName"
						@blur="cancelNameEditingOnBlur"
					/>

					<Button
						v-if="isEditingName && editedName !== originalName && !probeDetailsUpdating"
						severity="undefined"
						icon="pi pi-times"
						class="!absolute !right-4 !top-1/2 !h-7 w-7 !-translate-y-1/2 !rounded-md !px-2 !py-1 !text-sm !font-bold focus:!border-[#ef4444] focus:ring-[#ef4444]"
						:disabled="probeDetailsUpdating"
						aria-label="Cancel editing probe name"
						@keyup.enter="cancelNameEditing"
						@click.stop="cancelNameEditing"
						@blur="cancelNameEditingOnBlur"
					/>

					<i v-if="!isEditingName" class="pi pi-pencil text-lg" aria-hidden="true"/>
				</div>

				<div class="hidden h-8 items-center gap-1 rounded-full border border-surface-300 md:flex dark:border-dark-600">
					<span class="flex items-center gap-2 pl-3">
						<i class="pi pi-circle-fill text-[8px]" :class="getProbeStatusColor(probeDetails.status)"/>

						<span class="font-bold text-bluegray-900 dark:text-[var(--bluegray-0)]">
							{{ capitalize(probeDetails.status) }}
						</span>
					</span>

					<span class="mx-1 rounded-full bg-surface-200 px-2 py-0.5 font-bold text-bluegray-900 dark:bg-dark-600 dark:text-[var(--bluegray-0)]">
						v{{ probeDetails.version }}
					</span>
				</div>

				<div v-if="probeCreditsPerMonth" class="ml-auto flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-normal">
					<span class="whitespace-nowrap text-bluegray-900 dark:text-[var(--bluegray-0)]">
						Credits per month
					</span>

					<span class="flex h-[30px] items-center gap-2 rounded-md border border-surface-300 px-2 dark:border-dark-600">
						<nuxt-icon class="text-green-500" name="coin"/>
						<span class="font-bold text-green-500">+{{ probeCreditsPerMonth }}</span>
					</span>
				</div>
			</div>

			<div
				v-if="probeDetails"
				ref="ipsContentRef"
				class="flex flex-wrap content-start gap-2 rounded-xl bg-surface-100 p-4 transition-all ease-in-out dark:bg-dark-600"
				:class="getIpsOpeningClass()"
				:style="{
					maxHeight: ipsContentHeight,
					height: ipsContentHeight,
				}"
			>
				<span class="flex h-[38px] w-full items-center whitespace-nowrap sm:w-auto">Primary IP:</span>
				<span class="relative flex h-9 items-center rounded-xl border border-surface-300 bg-white pl-3 pr-8 font-bold text-dark-800 dark:border-dark-600 dark:bg-dark-800 dark:text-[var(--bluegray-0)]">
					{{ probeDetails.ip }}
					<CopyButton :content="probeDetails.ip" class="!top-[7px] size-5 cursor-pointer [&>button]:!size-full [&>button]:!border-none [&>button]:!p-0"/>
				</span>

				<template v-if="probeDetails?.altIps.length">
					<span class="flex h-[38px] w-full items-center whitespace-nowrap sm:w-auto">Alternative IPs:</span>
					<span
						v-for="(altIp, index) in limitIpsToShow()"
						:key="index"
						class="relative flex h-9 items-center rounded-xl border border-surface-300 bg-white pl-3 pr-8 font-bold text-dark-800 dark:border-dark-600 dark:bg-dark-800 dark:text-[var(--bluegray-0)]"
					>
						{{ altIp }}
						<CopyButton :content="altIp" class="!top-[7px] mb-px size-5 cursor-pointer [&>button]:!size-full [&>button]:!border-none [&>button]:!p-0"/>
					</span>
				</template>

				<span
					v-if="(probeDetails?.altIps?.length || 0) > 1"
					class="flex h-[38px] w-28 cursor-pointer items-center justify-center font-bold text-bluegray-900 dark:text-[var(--bluegray-0)]"
					@click="showHideMoreIps"
				>
					{{ showMoreIps ? 'Show less' : 'Show more' }}
				</span>
			</div>

			<Tabs value="0">
				<TabList class="!border-b !border-surface-300 dark:!border-dark-600">
					<Tab value="0" class="!w-1/2 border-none !px-6 !py-2 !text-[14px] !font-bold sm:!w-auto">Details</Tab>
					<Tab value="1" class="!w-1/2 border-none !px-6 !py-2 !text-[14px] !font-bold sm:!w-auto">Logs</Tab>
				</TabList>

				<TabPanels class="mt-6 !bg-transparent !p-0">
					<TabPanel value="0" tabindex="-1">
						<div class="flex flex-col gap-6">
							<div class="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-2">
								<div class="col-span-1 flex flex-col rounded-xl border border-surface-300 bg-white md:col-span-1 lg:col-span-1 dark:border-dark-600 dark:bg-dark-800">
									<h3 class="flex h-10 items-center border-b border-surface-300 px-6 font-bold text-dark-800 dark:border-dark-600 dark:text-[var(--bluegray-0)]">
										Location
									</h3>

									<div class="flex grow flex-col gap-3 p-6">
										<p class="text-sm leading-[100%] text-bluegray-600 dark:text-[var(--bluegray-0)]">
											City where the probe is located. If the auto-detected value is wrong, you can adjust it here.
										</p>

										<div class="relative h-80 min-h-80 w-full grow overflow-hidden rounded-md bg-surface-200 sm:h-auto dark:bg-dark-950">
											<div id="gp-map" class="size-full rounded-md"/>

											<span
												v-if="probeDetails"
												class="absolute right-4 top-4 rounded-xl border border-surface-300 bg-white px-2 py-1 font-bold leading-none text-dark-800 dark:border-dark-600 dark:bg-dark-800 dark:text-[var(--bluegray-0)]"
											>
												{{ probeDetails.network }} {{ probeDetails.asn }}
											</span>

											<div
												v-if="probeDetails"
												id="probeCityInput"
												class="absolute inset-x-4 bottom-9 flex h-[38px] overflow-hidden rounded-md border border-[#D1D5DB] dark:border-dark-600"
												role="button"
												aria-label="Edit probe city"
												aria-pressed="false"
												:tabindex="isEditingCity ? -1 : 0"
												@click="!isEditingCity && enableCityEditing()"
											>
												<span
													class="flex w-[38px] shrink-0 items-center justify-center border-r border-r-[#D1D5DB] bg-[#E5E7EB] dark:border-dark-600 dark:bg-dark-700"
													aria-hidden="true"
												>
													<CountryFlag :country="probeDetails.country" size="small"/>
												</span>

												<input
													v-if="isEditingCity"
													ref="inputCityRef"
													v-model="editedCity"
													class="flex w-full border-0 pl-3 pr-[72px] text-bluegray-900 shadow-none outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 dark:bg-dark-800 dark:text-[var(--bluegray-0)] dark:focus:bg-dark-800"
													aria-label="City name input"
													@keyup.enter="updateProbeCity"
													@blur="cancelCityEditingOnBlur"
												>

												<span
													v-else
													class="flex w-full cursor-pointer items-center bg-white px-3 text-bluegray-900 dark:bg-dark-800 dark:text-[var(--bluegray-0)]"
												>
													{{ city }}
												</span>

												<Button
													v-if="isEditingCity && editedCity !== originalCity"
													severity="undefined"
													icon="pi pi-check"
													class="!absolute !right-2 !top-1/2 mr-8 !h-7 w-7 !-translate-y-1/2 !rounded-md !px-2 !py-1 !text-sm !font-bold focus:!border-[var(--p-primary-color)] focus:ring-[var(--p-primary-color)]"
													:loading="probeDetailsUpdating"
													:disabled="probeDetailsUpdating"
													aria-label="Save city name"
													@click.stop="updateProbeCity"
													@blur="cancelCityEditingOnBlur"
												/>

												<Button
													v-if="isEditingCity && editedCity !== originalCity && !probeDetailsUpdating"
													severity="undefined"
													icon="pi pi-times"
													class="!absolute !right-2 !top-1/2 !h-7 w-7 !-translate-y-1/2 !rounded-md !px-2 !py-1 !text-sm !font-bold focus:!border-[#ef4444] focus:ring-[#ef4444]"
													:disabled="probeDetailsUpdating"
													aria-label="Cancel editing city"
													@keyup.enter="cancelCityEditing"
													@click.stop="cancelCityEditing"
													@blur="cancelCityEditingOnBlur"
												/>

												<i v-if="!isEditingCity" class="pi pi-pencil text-md absolute right-3 top-1/2 -translate-y-1/2" aria-hidden="true"/>
											</div>
										</div>
									</div>
								</div>

								<div class="grid auto-rows-max grid-cols-1 gap-4 2xl:grid-cols-2">
									<div class="flex flex-col rounded-xl border border-surface-300 bg-white dark:border-dark-600 dark:bg-dark-800">
										<h3 class="flex h-10 items-center border-b border-surface-300 px-6 font-bold text-dark-800 dark:border-dark-600 dark:text-[var(--bluegray-0)]">
											User tags
										</h3>

										<div class="flex flex-col gap-3 p-6">
											<p class="text-sm leading-[100%] text-bluegray-600 dark:text-[var(--bluegray-0)]">
												Public user-defined tags that can be used to target the probe in measurements. Each tag must be prefixed by your GitHub username or organization. E.g., for a user with username jimaek and tag home-1 the final tag would be u-jimaek-home-1.
											</p>

											<div class="flex gap-1">
												<div v-if="probeDetails" class="flex flex-wrap gap-1">
													<span
														v-for="(tag, index) in probeDetails.tags"
														:key="index"
														class="flex h-6 items-center whitespace-nowrap rounded-md border border-surface-300 px-2 text-xs text-bluegray-900 dark:border-dark-600 dark:text-[var(--bluegray-0)]"
													>
														{{ `u-${tag.prefix}-${tag.value}` }}
													</span>

													<Button
														class="h-6 !border-surface-200 bg-surface-200 !px-3 !py-0 hover:bg-transparent dark:!border-dark-600 dark:bg-dark-600"
														@click="openEditTagsPopover($event)"
													>
														<i
															class="pi text-sm text-dark-800 dark:text-[var(--bluegray-0)]"
															:class="{
																'pi-pencil': probeDetails?.tags?.length,
																'pi-plus': !probeDetails?.tags?.length,
															}"
														/>
														<span class="text-xs text-dark-800 dark:text-[var(--bluegray-0)]">{{ probeDetails?.tags?.length ? 'Edit' : 'Add' }}</span>
													</Button>
												</div>

												<Popover
													ref="tagPopoverRef"
													class="w-[95%] sm:w-[500px]"
													:class="{
														'!left-1/2 !-translate-x-1/2 !transform': screenWidth < 768
													}"
												>
													<div
														v-if="probeDetails"
														ref="popoverContentRef"
														tabindex="0"
														class="grid w-full flex-1 grid-rows-[auto_1fr] p-4 focus-visible:outline-none focus-visible:ring-0"
													>
														<div v-if="tagsToEdit.length" class="mb-6 grid flex-1 grid-cols-[3fr_auto_3fr_auto] items-center gap-y-5">
															<div class="-mb-2 content-center text-xs font-bold text-dark-800 dark:text-[var(--bluegray-0)]">Prefix</div>
															<div class="mx-3 -mb-2"/>
															<div class="-mb-2 content-center text-xs font-bold text-dark-800 dark:text-[var(--bluegray-0)]">Your tag</div>
															<div class="-mb-2 "/>

															<template v-for="(tag, index) in tagsToEdit" :key="index">
																<Select v-model="tag.uPrefix" class="flex-1" :options="uPrefixes" :scroll-height="'200px'"/>
																<div class="inline-flex w-6 justify-center">:</div>
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
																</div>
															</template>

															<div class="col-span-4 -mt-3">
																<Button
																	icon="pi pi-plus"
																	text
																	label="Add"
																	aria-label="Add tag"
																	class="text-surface-900 dark:text-surface-0"
																	@click="addTag()"
																/>
															</div>
														</div>

														<div v-else class="mb-6 h-[110px]">
															<div>The probe has no user tags</div>

															<div class="col-span-4 mt-2">
																<Button
																	icon="pi pi-plus"
																	text
																	label="Add"
																	aria-label="Add tag"
																	class="text-surface-900 dark:text-surface-0"
																	@click="addTag()"
																/>
															</div>
														</div>

														<div class="flex justify-between">
															<Button
																label="Cancel"
																severity="secondary"
																class="dark:!bg-dark-800"
																outlined
																@click="closeEditTagsPopover"
															/>
															<Button
																label="Save"
																:loading="probeDetailsUpdating"
																:disabled="probeDetailsUpdating"
																@click="updateProbeTags"
															/>
														</div>
													</div>
												</Popover>
											</div>
										</div>
									</div>

									<div class="flex flex-col self-start rounded-xl border border-surface-300 bg-white dark:border-dark-600 dark:bg-dark-800">
										<h3 class="flex h-10 items-center border-b border-surface-300 px-6 font-bold text-dark-800 dark:border-dark-600 dark:text-[var(--bluegray-0)]">
											System tags
										</h3>

										<div class="flex flex-col gap-3 p-6">
											<p class="text-sm leading-[100%] text-bluegray-600 dark:text-[var(--bluegray-0)]">
												Public tags that can be used to target the probe in measurements.
											</p>

											<div class="flex gap-1">
												<div v-if="probeDetails" class="flex flex-wrap gap-1">
													<span
														v-for="(tag, index) in probeDetails.systemTags"
														:key="index"
														class="flex h-6 items-center whitespace-nowrap rounded-md border border-surface-300 px-2 text-xs text-bluegray-900 dark:border-dark-600 dark:text-[var(--bluegray-0)]"
													>
														{{ tag }}
													</span>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>

							<div v-if="showChart" class="flex flex-col rounded-xl border border-surface-300 dark:border-dark-600">
								<h3 class="flex h-10 items-center border-b border-surface-300 pl-6 font-bold text-dark-800 dark:border-dark-600 dark:text-[var(--bluegray-0)]">Tests (last 24h)</h3>
								<div class="flex flex-col gap-6 p-6">
									<div>
										<span class="text-bluegray-900 dark:text-[var(--bluegray-0)]">Total: </span>
										<span class="font-bold text-bluegray-900 dark:text-[var(--bluegray-0)]">{{ testsCountDisplayed }} tests</span>
									</div>

									<div class="h-36">
										<ProbeTestsChart/>
									</div>
								</div>
							</div>

							<div class="flex flex-col gap-4 rounded-xl bg-surface-100 px-6 py-4 sm:h-[68px] sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-0 dark:bg-dark-600">
								<span class="flex gap-2">
									<i class="pi pi-info-circle text-lg text-bluegray-900 dark:text-[var(--bluegray-0)]"/>
									<span class="text-bluegray-900 dark:text-[var(--bluegray-0)]">Removing the probe will result in data loss.</span>
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

					<TabPanel value="1" tabindex="-1">
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
	import { readItem, updateItem, aggregate } from '@directus/sdk';
	import capitalize from 'lodash/capitalize';
	import isEqual from 'lodash/isEqual';
	import memoize from 'lodash/memoize';
	import CountryFlag from 'vue-country-flag-next';
	import { useGoogleMaps } from '~/composables/maps';
	import { useAuth } from '~/store/auth';
	import { initGoogleMap, updateMapMarker } from '~/utils/init-google-map';
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
	const { user } = storeToRefs(auth);
	const probeDetailsUpdating = ref(false);
	const VERTICAL_OFFSET = 36;

	let removeWatcher: (() => void) | undefined;

	onMounted(() => {
		useGoogleMaps(() => {
			const stopWatching = watchEffect(async () => {
				if (probeDetails.value) {
					removeWatcher = await initGoogleMap(probeDetails.value, true, false, VERTICAL_OFFSET);
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
			probeDetails.value = await $directus.request(readItem('gp_probes', id));
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
				await $directus.request(updateItem('gp_probes', probeDetails.value.id, { userId: null }));
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

	// HANDLE SCREEN SIZE
	const screenWidth = ref(window.innerWidth);

	const updateScreenWidth = () => {
		screenWidth.value = window.innerWidth;
	};

	onMounted(() => {
		window.addEventListener('resize', updateScreenWidth);
	});

	onBeforeUnmount(() => {
		window.removeEventListener('resize', updateScreenWidth);
	});

	watch(screenWidth, (newWidth) => {
		screenWidth.value = newWidth;

		nextTick(() => {
			updateIpsContentHeight(true);
		});
	});

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
		}
	};

	const cancelNameEditing = () => {
		editedName.value = originalName.value;
		isEditingName.value = false;
	};

	const cancelNameEditingOnBlur = (event: FocusEvent) => {
		const target = event.relatedTarget as HTMLElement | null;
		const parentEl = document.getElementById('probeNameInput');

		// do not blur name Input block if it comes from its children
		if (probeDetailsUpdating.value || (parentEl && target instanceof Node && parentEl.contains(target))) {
			return;
		}

		editedName.value = originalName.value;
		isEditingName.value = false;
	};

	const updateProbeName = async (event: Event) => {
		event.stopPropagation();

		probeDetailsUpdating.value = true;

		if (!probeDetails.value) {
			probeDetailsUpdating.value = false;

			return;
		}

		if (editedName.value === originalName.value) {
			isEditingName.value = false;
			probeDetailsUpdating.value = false;

			return;
		}

		try {
			await $directus.request(updateItem('gp_probes', probeDetails.value.id, { name: editedName.value }));

			sendToast('success', 'Done', 'The probe has been successfully updated');
			emit('save');

			originalName.value = editedName.value;
			isEditingName.value = false;
			probeDetails.value.name = editedName.value;
		} catch (e) {
			sendErrorToast(e);

			if (inputNameRef.value) {
				inputNameRef.value.focus();
			}
		} finally {
			probeDetailsUpdating.value = false;
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
		}
	};

	const cancelCityEditing = () => {
		editedCity.value = originalCity.value;
		isEditingCity.value = false;
	};

	const cancelCityEditingOnBlur = (event: FocusEvent) => {
		const target = event.relatedTarget as HTMLElement | null;
		const parentEl = document.getElementById('probeCityInput');

		// do not blur city Input block if it comes from its children
		if (probeDetailsUpdating.value || (parentEl && target instanceof Node && parentEl.contains(target))) {
			return;
		}

		editedCity.value = originalCity.value;
		isEditingCity.value = false;
	};

	const updateProbeCity = async (event: Event) => {
		event.stopPropagation();

		probeDetailsUpdating.value = true;

		if (!probeDetails.value) {
			probeDetailsUpdating.value = false;

			return;
		}

		if (editedCity.value === originalCity.value) {
			isEditingCity.value = false;
			probeDetailsUpdating.value = false;

			return;
		}

		try {
			await $directus.request(updateItem('gp_probes', probeDetails.value.id, { city: editedCity.value }));

			// on succesful update fetch updated probe's data and then update map marker, city etc.
			const updProbeDetails = await $directus.request(readItem('gp_probes', probeDetails.value.id));

			sendToast('success', 'Done', 'The probe has been successfully updated');
			emit('save');

			originalCity.value = updProbeDetails.city;
			isEditingCity.value = false;
			probeDetails.value.city = updProbeDetails.city;

			updateMapMarker(updProbeDetails.latitude, updProbeDetails.longitude, VERTICAL_OFFSET);
		} catch (e) {
			sendErrorToast(e);

			if (inputCityRef.value) {
				inputCityRef.value.focus();
			}
		} finally {
			probeDetailsUpdating.value = false;
		}
	};

	// HANDLE PRIMARY, ALT IPS
	const showMoreIps = ref(false);
	const ipsContentRef = ref<HTMLDivElement | null>(null);
	const ipsContentHeight = ref('auto');
	const initialIpsContentHeight = ref('auto');
	const ipsOpening = ref(false);
	const ipsOpeningDuration = ref(500);

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

	const updateIpsContentHeight = async (onResize: boolean = false) => {
		if (!ipsContentRef.value) { return; }

		if (onResize) {
			showMoreIps.value = false;
			initialIpsContentHeight.value = 'auto';
			ipsContentHeight.value = 'auto';

			await nextTick();

			initialIpsContentHeight.value = `${ipsContentRef.value.scrollHeight}px`;
		}

		if (showMoreIps.value) {
			ipsContentHeight.value = `${ipsContentRef.value.scrollHeight}px`;
		} else {
			ipsContentHeight.value = initialIpsContentHeight.value;
		}
	};

	watch(probeDetails, async () => {
		await nextTick();

		if (ipsContentRef.value) {
			const initialHeight = `${ipsContentRef.value.scrollHeight}px`;
			initialIpsContentHeight.value = initialHeight;
			ipsContentHeight.value = initialHeight;
		}
	});

	watch(showMoreIps, () => {
		ipsOpening.value = true;

		setTimeout(() => {
			ipsOpening.value = false;
		}, ipsOpeningDuration.value);
	});

	const getIpsOpeningClass = () => {
		return `duration-${ipsOpeningDuration.value} ${ipsOpening.value ? 'overflow-hidden' : ''}`;
	};

	// HANDLE TAGS EDITING
	const uPrefixes = [ user.value.github_username, ...user.value.github_organizations ]
		// Make default prefix the first option
		.sort((prefixA, prefixB) => prefixA === user.value.default_prefix ? -1 : prefixB === user.value.default_prefix ? 1 : 0)
		.map(value => `u-${value}`);
	const tagPopoverRef = ref();
	const tagsToEdit = ref<{ uPrefix: string, value: string }[]>([]);
	const isEditingTags = ref<boolean>(false);
	const popoverContentRef = ref<HTMLElement>();

	const openEditTagsPopover = (event: Event) => {
		editTags();

		tagPopoverRef.value?.toggle(event);

		nextTick(() => {
			popoverContentRef.value?.focus();
		});
	};

	const closeEditTagsPopover = () => {
		tagPopoverRef.value?.hide();
	};

	const tagRegex = /^[a-zA-Z0-9-]+$/;
	const isTagValid = memoize((value: string) => {
		return value === '' || (value.length <= 32 && tagRegex.test(value));
	});

	const editTags = () => {
		isEditingTags.value = true;

		tagsToEdit.value = probeDetails.value && probeDetails.value.tags.length ? probeDetails.value.tags.map(({ prefix, value }) => ({
			uPrefix: `u-${prefix}`,
			value,
		})) : [{ uPrefix: uPrefixes[0], value: '' }];
	};

	const addTag = () => {
		isEditingTags.value = true;
		tagsToEdit.value.push({ uPrefix: `u-${user.value.default_prefix}`, value: '' });
	};

	const removeTag = (index: number) => {
		tagsToEdit.value?.splice(index, 1);
	};

	const convertTags = (tagsToEdit: { uPrefix: string, value: string }[]) => tagsToEdit.map(({ uPrefix, value }) => ({
		prefix: uPrefix.replace('u-', ''),
		value,
	}));

	const updateProbeTags = async () => {
		probeDetailsUpdating.value = true;

		if (!probeDetails || !probeDetails.value) {
			probeDetailsUpdating.value = false;

			return;
		}

		const updTags = isEditingTags.value ? convertTags(tagsToEdit.value) : probeDetails?.value?.tags;

		// check if the tags are filled
		if (!updTags || updTags.some(({ prefix, value }) => !prefix || !value)) {
			sendToast('error', 'Tags are invalid', 'Some tag values are empty');
			probeDetailsUpdating.value = false;

			return;
		}

		// close the Popover if tags are left the same
		if (isEqual(updTags, probeDetails.value.tags)) {
			probeDetailsUpdating.value = false;
			closeEditTagsPopover();

			return;
		}

		try {
			await $directus.request(updateItem('gp_probes', probeDetails.value.id, { tags: updTags }));

			sendToast('success', 'Done', 'The probe has been successfully updated');
			emit('save');
			probeDetails.value.tags = updTags;
			closeEditTagsPopover();
		} catch (e) {
			sendErrorToast(e);
		} finally {
			probeDetailsUpdating.value = false;
		}
	};

	// HANDLE STATUS COLORS
	const getProbeStatusColor = (status: string) => {
		switch (status.toLowerCase()) {
		case 'ready':
			return 'text-green-500';

		case 'offline':
			return 'text-bluegray-500';

		case 'ping-test-failed':
			return 'text-red-500';

		default:
			return 'text-yellow-600';
		}
	};

	// HANDLE CREDITS
	const probeCreditsPerMonth = ref<number | null>(null);

	const loadCreditsData = async () => {
		try {
			const creditsResponse = await $directus.request<[{ sum: { amount: number }, adopted_probe: string}]>(aggregate('gp_credits_additions', {
				query: {
					filter: {
						github_id: { _eq: user.value.external_identifier || 'admin' },
						adopted_probe: { _eq: probeDetails?.value?.id },
						date_created: { _gte: '$NOW(-30 day)' },
					},
				},
				groupBy: [ 'adopted_probe' ],
				aggregate: { sum: 'amount' },
			}));

			probeCreditsPerMonth.value = creditsResponse[0]?.sum?.amount;
		} catch (e) {
			sendErrorToast(e);
		}
	};

	watch(probeDetails, async () => {
		loadCreditsData();
	});

	// HANDLE TOP LOGO IMG SRC
	const isDarkMode = computed(() => user.value.appearance === 'dark');

	// HANDLE CHART
	const testsCount = ref(347530);
	const testsCountDisplayed = testsCount.value?.toLocaleString();
	const showChart = ref(false);

	// HANDLE GO BACK TO PROBES
	definePageMeta({
		middleware: [ 'track-from' ],
	});

	const getBackToProbesHref = () => {
		const defaultPathBackTo = '/probes';
		const fromPath = useState<string | null>('fromPath');
		const regex = /^\/probes\?page=\d+$/;

		return fromPath.value && regex.test(fromPath.value) ? fromPath.value : defaultPathBackTo;
	};
</script>
