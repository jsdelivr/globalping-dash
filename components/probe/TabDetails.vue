<template>
	<div class="flex flex-col gap-6">
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-2">
			<div class="col-span-1 flex flex-col rounded-xl border border-surface-300 bg-white md:col-span-1 lg:col-span-1 dark:border-dark-600 dark:bg-dark-800">
				<h3 class="flex h-10 items-center border-b border-surface-300 px-6 font-bold text-dark-800 dark:border-dark-600 dark:text-bluegray-0">
					Location
				</h3>

				<div class="flex grow flex-col gap-3 p-6">
					<p class="text-sm leading-[125%] text-bluegray-600 dark:text-bluegray-0">
						City where the probe is located. If the auto-detected value is wrong, you can adjust it here.
					</p>

					<div class="relative h-80 min-h-80 w-full grow overflow-hidden rounded-md bg-surface-200 sm:h-auto dark:bg-dark-950">
						<div id="gp-map" class="size-full rounded-md"/>

						<span
							v-if="probe"
							class="absolute right-4 top-4 rounded-xl border border-surface-300 bg-white px-2 py-1 font-bold leading-none text-dark-800 dark:border-dark-600 dark:bg-dark-800 dark:text-bluegray-0"
						>
							{{ probe.network }} {{ probe.asn }}
						</span>

						<div
							v-if="probe"
							class="absolute inset-x-4 bottom-9 flex h-[38px]"
						>
							<span
								class="flex h-full shrink-0 items-center justify-center !rounded-r-none rounded-l-md border border-r-0 border-[#D1D5DB] bg-[#E5E7EB]"
								aria-hidden="true"
								:class="{
									'w-[38px]': probe.allowedCountries.length <= 1,
									'w-24': probe.allowedCountries.length > 1
								}"
							>
								<InputGroupAddon
									v-if="probe.allowedCountries.length <= 1"
									class="!bg-transparent"
								>
									<CountryFlag :country="probe.country" size="small"/>
								</InputGroupAddon>

								<Select
									v-if="probe.allowedCountries.length > 1"
									id="country"
									v-model="editedCountry"
									:options="probe.allowedCountries"
									class="h-full !rounded-r-none rounded-l-md border-0 !border-r border-[#D1D5DB]"
									:pt="{ dropdown: 'w-8' }"
									:pt-options="{ mergeProps: true }"
									@change="onCountryChanged"
								>
									<template #value="slotProps">
										<div class="flex items-center">
											<CountryFlag :country="slotProps.value" size="small"/>
											<div class="ml-2">{{ slotProps.value }}</div>
										</div>
									</template>

									<template #option="slotProps">
										<div class="flex items-center">
											<CountryFlag :country="slotProps.option" size="small"/>
											<div class="ml-2">{{ slotProps.option }}</div>
										</div>
									</template>
								</Select>
							</span>

							<div
								ref="probeCityInput"
								class="flex h-full grow overflow-hidden rounded-r-md border border-l-0 border-[#D1D5DB] dark:border-dark-600"
								aria-label="Edit probe city"
								aria-haspopup="true"
								:aria-expanded="isEditingCity"
								:tabindex="isEditingCity ? -1 : 0"
								@click="enableCityEditing"
								@keyup.enter="enableCityEditing"
								@keyup.space="enableCityEditing"
								@keyup.esc="cancelCityEditing"
							>
								<input
									v-if="isEditingCity"
									ref="inputCityRef"
									v-model="editedCity"
									class="flex w-full border-0 pl-3 pr-[72px] text-bluegray-900 shadow-none outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 dark:bg-dark-800 dark:text-bluegray-0 dark:focus:bg-dark-800"
									aria-label="City name input"
									@keyup.enter="updateProbeLocation"
									@blur="cancelCityEditingOnBlur"
								>

								<span
									v-else
									class="flex w-full cursor-pointer items-center bg-white px-3 text-bluegray-900 dark:bg-dark-800 dark:text-bluegray-0"
								>
									{{ city }}
								</span>

								<Button
									v-if="isEditingCity && ((editedCity !== originalCity) || (originalCountry !== editedCountry))"
									variant="text"
									severity="secondary"
									icon="pi pi-check"
									class="!absolute !right-2 !top-1/2 mr-8 !h-7 w-7 !-translate-y-1/2 !rounded-md !px-2 !py-1 !text-sm !font-bold focus:!border-[var(--p-primary-color)] focus:!ring-[var(--p-primary-color)]"
									:loading="probeDetailsUpdating"
									:disabled="probeDetailsUpdating"
									aria-label="Save city name"
									@click.stop="updateProbeLocation"
									@blur="cancelCityEditingOnBlur"
								/>

								<Button
									v-if="isEditingCity && (((editedCity !== originalCity) || (originalCountry !== editedCountry)) && !probeDetailsUpdating)"
									variant="text"
									severity="secondary"
									icon="pi pi-times"
									class="!absolute !right-2 !top-1/2 !h-7 w-7 !-translate-y-1/2 !rounded-md !px-2 !py-1 !text-sm !font-bold focus:!border-[#ef4444] focus:!ring-[#ef4444]"
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
			</div>

			<div class="grid auto-rows-max grid-cols-1 gap-4">
				<div class="flex flex-col rounded-xl border border-surface-300 bg-white dark:border-dark-600 dark:bg-dark-800">
					<h3 class="flex h-10 items-center border-b border-surface-300 px-6 font-bold text-dark-800 dark:border-dark-600 dark:text-bluegray-0">
						User tags
					</h3>

					<div class="flex flex-col gap-3 p-6">
						<p class="text-sm leading-[125%] text-bluegray-600 dark:text-bluegray-0">
							Public user-defined tags that can be used to target the probe in measurements.
							Each tag must be prefixed by your GitHub username or organization.
							E.g., for a user with username <code class="font-bold">jimaek</code> and tag <code class="font-bold">home-1</code>
							the final tag would be <code class="font-bold">u-jimaek:home-1</code>.
						</p>

						<div class="flex w-full gap-1">
							<div v-if="probe" class="flex w-full flex-wrap gap-1">
								<span
									v-for="(tag, index) in probe.tags"
									:key="index"
									class="inline-flex h-6 max-w-full items-center overflow-hidden truncate rounded-md border border-surface-300 px-2 text-xs text-bluegray-900 dark:border-dark-600 dark:text-bluegray-0"
									:title="`u-${tag.prefix}:${tag.value}`"
								>
									<span class="block truncate">
										{{ `u-${tag.prefix}:${tag.value}` }}
									</span>
								</span>

								<Button
									class="h-6 !border-surface-200 bg-surface-200 !px-3 !py-0 hover:bg-transparent dark:!border-dark-600 dark:bg-dark-600"
									:aria-label="probe.tags.length ? 'Open edit tags dialog' : 'Open add tags dialog'"
									aria-haspopup="dialog"
									:aria-expanded="tagPopoverRef?.value?.visible || false"
									aria-controls="editTagsPopover"
									@click="openEditTagsPopover($event)"
								>
									<i
										class="pi text-sm text-dark-800 dark:text-bluegray-0"
										:class="{
											'pi-pencil': probe.tags.length,
											'pi-plus': !probe.tags.length,
										}"
									/>
									<span class="text-xs text-dark-800 dark:text-bluegray-0">{{ probe.tags.length ? 'Edit' : 'Add' }}</span>
								</Button>
							</div>

							<!-- TODO: all tag handling needs to include the format === 'v1' check and the related logic and warning on editing (see current probe modal) -->
							<Popover
								id="editTagsPopover"
								ref="tagPopoverRef"
								class="w-[95%] sm:w-[500px]"
								:class="{
									'!left-1/2 !-translate-x-1/2 !transform': windowSize.width.value < 768
								}"
								role="dialog"
								:aria-label="probe.tags.length ? 'Edit tags dialog' : 'Add tags dialog'"
							>
								<div
									v-if="probe"
									ref="popoverContentRef"
									tabindex="0"
									class="grid w-full flex-1 grid-rows-[auto_1fr] p-4 focus-visible:outline-none focus-visible:ring-0"
								>
									<div v-if="tagsToEdit.length" class="mb-6 grid flex-1 grid-cols-[minmax(6rem,1fr)_auto_minmax(6rem,1fr)_auto] items-center gap-y-5">
										<div class="-mb-2 content-center text-xs font-bold text-dark-800 dark:text-bluegray-0">Prefix</div>
										<div class="mx-3 -mb-2"/>
										<div class="-mb-2 content-center text-xs font-bold text-dark-800 dark:text-bluegray-0">Your tag</div>
										<div class="-mb-2 "/>

										<template v-for="(tag, index) in tagsToEdit" :key="index">
											<Select
												v-model="tag.uPrefix"
												:options="uPrefixes"
												:scroll-height="'200px'"
												aria-label="Tag prefix"
												aria-required="true"
											/>
											<div class="inline-flex w-6 justify-center">:</div>
											<div class="relative">
												<InputText
													v-model="tag.value"
													:invalid="!isTagValid(tag.value)"
													class="w-full"
													placeholder="my-tag"
													aria-label="Your tag"
												/>
												<p v-if="!isTagValid(tag.value)" class="absolute pl-1 text-red-500">Invalid tag</p>
											</div>

											<div class="ml-2 flex gap-1">
												<Button
													icon="pi pi-trash"
													text
													aria-label="Remove tag"
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
											aria-label="Cancel tag editing"
											@click="closeEditTagsPopover"
										/>
										<Button
											label="Save"
											:loading="probeDetailsUpdating"
											:disabled="probeDetailsUpdating"
											aria-label="Save edited tags"
											@click="updateProbeTags"
										/>
									</div>
								</div>
							</Popover>
						</div>
					</div>
				</div>

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

		<div class="flex flex-col gap-4 rounded-xl bg-surface-100 px-6 py-4 sm:h-[68px] sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-0 dark:bg-dark-600">
			<span class="flex gap-2">
				<i class="pi pi-info-circle text-lg text-bluegray-900 dark:text-bluegray-0"/>
				<span class="text-bluegray-900 dark:text-bluegray-0">Removing the probe will result in data loss.</span>
			</span>

			<Button
				class="!h-9"
				severity="secondary"
				outlined
				label="Remove probe"
				icon="pi pi-trash"
				:loading="deleteProbeLoading"
				aria-label="Remove probe"
				:aria-disabled="deleteProbeLoading"
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
				<Button label="Delete probe" severity="danger" @click="deleteProbe"/>
			</div>
		</GPDialog>
	</div>
</template>

<script setup lang="ts">
	import { readItem, updateItem } from '@directus/sdk';
	import isEqual from 'lodash/isEqual';
	import memoize from 'lodash/memoize';
	import CountryFlag from 'vue-country-flag-next';
	import { useGoogleMaps } from '~/composables/maps';
	import { useAuth } from '~/store/auth';
	import { initGoogleMap, updateMapMarker } from '~/utils/init-google-map';
	import { sendErrorToast, sendToast } from '~/utils/send-toast';
	const MAP_CENTER_Y_OFFSET_PX = 36;

	const deleteDialog = ref(false);
	const deleteProbeLoading = ref(false);
	const probeCityInput = ref<HTMLElement | null>(null);
	const { $directus } = useNuxtApp();

	const auth = useAuth();
	const { user } = storeToRefs(auth);

	const probe = defineModel('probe', {
		type: Object as PropType<Probe>,
		required: true,
	});

	const probeDetailsUpdating = defineModel('probeDetailsUpdating', {
		type: Boolean,
		required: true,
	});

	const emit = defineEmits([ 'save', 'hide', 'delete' ]);
	const router = useRouter();
	const windowSize = useWindowSize();

	const deleteProbe = async () => {
		deleteProbeLoading.value = true;

		try {
			if (probe.value) {
				await $directus.request(updateItem('gp_probes', probe.value.id, { userId: null }));
				sendToast('success', 'Done', 'The probe has been deleted');
				emit('delete');
				router.push('/probes');
			}
		} catch (e) {
			sendErrorToast(e);
		}

		deleteProbeLoading.value = false;
	};

	// HANDLE PROBE CITY
	const isEditingCity = ref(false);
	const editedCity = ref('');
	const originalCity = ref('');
	const editedCountry = ref('');
	const originalCountry = ref('');
	const inputCityRef = ref<HTMLInputElement | null>(null);
	const city = computed(() => {
		return probe.value ? probe.value.city : '';
	});
	const country = computed(() => {
		return probe.value ? probe.value.country : '';
	});

	watch(city, (newCity) => {
		originalCity.value = newCity;
		editedCity.value = newCity;
	}, { immediate: true });

	watch(country, (newCountry) => {
		originalCountry.value = newCountry;
		editedCountry.value = newCountry;
	}, { immediate: true });

	const onCountryChanged = async () => {
		// wait for Vue to update
		await nextTick();

		// then delay again to let Select finish its focus handling
		setTimeout(() => {
			enableCityEditing();
		}, 0);
	};

	const enableCityEditing = async () => {
		if (isEditingCity.value === true) { return; }

		isEditingCity.value = true;

		await nextTick();

		if (inputCityRef.value) {
			inputCityRef.value.focus();
		}
	};

	const cancelCityEditing = () => {
		if (isEditingCity.value === false) { return; }

		restoreOriginalLocation();
		isEditingCity.value = false;
		inputCityRef.value?.blur();
	};

	const cancelCityEditingOnBlur = (event: FocusEvent) => {
		const target = event.relatedTarget as HTMLElement | null;
		const parentEl = probeCityInput.value;

		// do not blur city Input block if it comes from its children
		if (probeDetailsUpdating.value || (parentEl && target instanceof Node && parentEl.contains(target))) {
			return;
		}

		cancelCityEditing();
	};

	const restoreOriginalLocation = () => {
		if (editedCity.value !== originalCity.value) {
			editedCity.value = originalCity.value;
		}

		if (originalCountry.value !== editedCountry.value) {
			editedCountry.value = originalCountry.value;
		}
	};

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

	const updateProbeLocation = async (event: Event) => {
		event.stopPropagation();

		probeDetailsUpdating.value = true;

		if (!probe.value) {
			probeDetailsUpdating.value = false;

			return;
		}

		if (editedCity.value === originalCity.value && editedCountry === originalCountry) {
			isEditingCity.value = false;
			probeDetailsUpdating.value = false;

			return;
		}

		// create an object to store the probe's properties that need to be updated if they have changed
		const updProbePart: { city?: string; country?: string } = {};

		if (editedCountry !== originalCountry) {
			updProbePart.country = editedCountry.value;
		}

		if (editedCity.value !== originalCity.value) {
			updProbePart.city = editedCity.value;
		}

		try {
			await $directus.request(updateItem('gp_probes', probe.value.id, updProbePart));

			// on succesful update fetch updated probe's data and then update map marker, city etc.
			const updProbeDetails = await $directus.request(readItem('gp_probes', probe.value.id));

			sendToast('success', 'Done', 'The probe has been successfully updated');
			emit('save');

			isEditingCity.value = false;
			probe.value = updProbeDetails;

			updateMapMarker(updProbeDetails.latitude, updProbeDetails.longitude, MAP_CENTER_Y_OFFSET_PX);
		} catch (e) {
			sendErrorToast(e);

			if (inputCityRef.value) {
				inputCityRef.value.focus();
			}
		} finally {
			probeDetailsUpdating.value = false;
		}
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

		tagsToEdit.value = probe.value && probe.value.tags.length ? probe.value.tags.map(({ prefix, value }) => ({
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

		if (!probe.value || !probe.value) {
			probeDetailsUpdating.value = false;

			return;
		}

		const updTags = isEditingTags.value ? convertTags(tagsToEdit.value) : probe.value?.tags;

		// check if the tags are filled
		if (!updTags || updTags.some(({ prefix, value }) => !prefix || !value)) {
			sendToast('error', 'Tags are invalid', 'Some tag values are empty');
			probeDetailsUpdating.value = false;

			return;
		}

		// check if the tags have proper format
		if (!updTags || updTags.some(({ value }) => !isTagValid(value))) {
			sendToast('error', 'Tags are invalid', 'Some tag values have an invalid format');
			probeDetailsUpdating.value = false;

			return;
		}

		// close the Popover if tags are left the same
		if (isEqual(updTags, probe.value.tags)) {
			probeDetailsUpdating.value = false;
			closeEditTagsPopover();

			return;
		}

		try {
			await $directus.request(updateItem('gp_probes', probe.value.id, { tags: updTags }));

			sendToast('success', 'Done', 'The probe has been successfully updated');
			emit('save');
			probe.value.tags = updTags;
			closeEditTagsPopover();
		} catch (e) {
			sendErrorToast(e);
		} finally {
			probeDetailsUpdating.value = false;
		}
	};

	// HANDLE CHART
	const testsCount = ref(347530);
	const testsCountDisplayed = testsCount.value?.toLocaleString();
	const showChart = ref(false);
</script>
