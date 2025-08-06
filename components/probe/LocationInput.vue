<template>
	<div
		v-if="probe"
		ref="containerRef"
		class="absolute inset-x-4 bottom-14 flex h-9 flex-col gap-1 sm:bottom-9 sm:flex-row sm:items-center sm:gap-0"
		@focusin="isActive = true"
		@focusout="cancelEditing"
	>
		<div
			class="relative flex size-full shrink-0 items-center justify-center rounded-md border border-[#D1D5DB] bg-[#E5E7EB] sm:w-24 sm:rounded-r-none sm:border-r-0 dark:border-dark-600 dark:bg-dark-800"
			aria-hidden="true"
		>
			<Select
				id="country"
				v-model="selectedCountry"
				:options="[ ...probe.allowedCountries, OTHER_COUNTRY_OPTION ]"
				class="size-full rounded-md border-0 !border-[#D1D5DB] hover:!border-[#D1D5DB] focus:outline-none focus:ring-1 focus:ring-primary sm:!rounded-r-none sm:!border-r dark:!border-dark-600 dark:!bg-dark-800 hover:dark:!border-dark-600"
				:pt="{ dropdown: 'w-8', root: { tabindex: '-1' } }"
				overlay-class="w-full"
				:pt-options="{ mergeProps: true }"
				append-to="self"
				@change="onCountryChanged"
				@keydown="handleSelectEnterKey"
			>
				<template #value="slotProps">
					<span class="flex items-center">
						<CountryFlag :country="slotProps.value" size="small"/>
						<span class="ml-2">{{ slotProps.value }}</span>
					</span>
				</template>

				<template #option="slotProps">
					<span class="flex items-center">
						<CountryFlag v-if="slotProps.option !== OTHER_COUNTRY_OPTION" :country="slotProps.option" size="small"/>
						<i v-else class="pi pi-map-marker mx-0.5"/>
						<span class="ml-2">{{ slotProps.option }}</span>
					</span>
				</template>
			</Select>
		</div>

		<div
			class="relative flex h-full grow items-center rounded-md border border-[#D1D5DB] bg-white focus:z-10 focus:ring-1 focus:ring-primary sm:rounded-l-none sm:border-l-0 dark:border-dark-600 dark:bg-dark-800"
		>
			<CityAutoComplete
				v-model="editedLocation"
				v-model:input-ref="inputCityRef"
				:dirty="isDirty"
				:active="isActive"
				:loading="probeDetailsUpdating"
				@cancel="cancelCityEditing"
				@confirm="updateProbeLocation"
			/>
		</div>
	</div>

	<GPDialog
		v-model:visible="invalidCountryDialog"
		header="Incorrect probe country"
	>
		<div class="flex items-center gap-4">
			<div>
				<i class="pi pi-info-circle text-xl text-primary"/>
			</div>
			<div>
				<p>
					The listed countries are based on data reported by our GeoIP providers.
				</p>
				<p>
					If the correct country is not in the list, please <NuxtLink :to="`https://geodebug.globalping.dev/${probe.ip}`" class="underline" target="_blank">report it here</NuxtLink>.
				</p>
			</div>
		</div>
	</GPDialog>
</template>

<script setup lang="ts">
	import { readItem, updateItem } from '@directus/sdk';
	import isEqual from 'lodash/isEqual';
	import type { SelectChangeEvent } from 'primevue/select';
	import CountryFlag from 'vue-country-flag-next';
	import { updateMapMarker } from '~/utils/init-google-map';
	import { sendErrorToast, sendToast } from '~/utils/send-toast';

	const { $directus } = useNuxtApp();

	const probe = defineModel('probe', {
		type: Object as PropType<Probe>,
		required: true,
	});

	const probeDetailsUpdating = defineModel('probeDetailsUpdating', {
		type: Boolean,
		required: true,
	});

	const mapCenterYOffsetPx = defineModel('mapCenterYOffsetPx', {
		type: Number,
		required: true,
	});

	const initialLocation = ref<City>({
		name: '',
		country: '',
		state: null,
		stateName: null,
	});

	const editedLocation = ref<City>({
		name: '',
		country: '',
		state: null,
		stateName: null,
	});

	const containerRef = ref<HTMLElement | null>(null);
	const isActive = ref(false);
	const selectedCountry = ref(''); // is a valid country or the 'Other' country option
	const invalidCountryDialog = ref(false);
	const inputCityRef = ref<HTMLInputElement | null>(null);
	const ignoreSelectEnter = ref(false);
	const selectEnterPressed = ref(false);
	const OTHER_COUNTRY_OPTION = 'Other';

	const isDirty = computed(() => {
		return !isEqual(initialLocation.value, editedLocation.value);
	});

	watch(probe, (newProbeDetails) => {
		const newLocation: City = {
			name: newProbeDetails.city,
			country: newProbeDetails.country,
			state: newProbeDetails.state,
			stateName: newProbeDetails.stateName,
		};

		initialLocation.value = { ...newLocation };
		editedLocation.value = { ...newLocation };
		selectedCountry.value = newProbeDetails.country;
	}, { immediate: true });

	watch(() => editedLocation.value.country, newCountry => selectedCountry.value = newCountry, { immediate: true });

	const onCountryChanged = async (event: SelectChangeEvent) => {
		// wait for Vue to update
		await nextTick();

		let focusCity = false;

		if (event.value === OTHER_COUNTRY_OPTION) {
			invalidCountryDialog.value = true;
			selectedCountry.value = editedLocation.value.country;
		} else {
			focusCity = true;
			isActive.value = true;
			editedLocation.value.country = selectedCountry.value;
		}

		// then delay again to let Select finish its focus handling
		setTimeout(() => {
			focusCity && enableCityEditing(true);

			if (selectEnterPressed.value) {
				// flag to suppress unintended Enter on sibling input after keyboard selection in PrimeVue Select
				ignoreSelectEnter.value = true;
				selectEnterPressed.value = false;
			}
		});
	};

	const handleSelectEnterKey = (event: KeyboardEvent) => {
		if (event.key === 'Enter') {
			selectEnterPressed.value = true;
		}
	};

	const enableCityEditing = async (select: boolean) => {
		inputCityRef.value?.focus();
		select && inputCityRef.value?.select();
	};

	const cancelCityEditing = (revert: boolean = true) => {
		if (!isActive.value) {
			return;
		}

		revert && restoreOriginalLocation();
		isActive.value = false;
		inputCityRef.value?.blur();
	};

	const cancelEditing = (event: FocusEvent) => {
		const target = event.relatedTarget as HTMLElement | null;

		// do not cancel editing if the invalid country dialog is open, updating, or focus doesn't move out of the LocationInput component
		if (invalidCountryDialog.value || probeDetailsUpdating.value || containerRef.value?.contains(target)) {
			return;
		}

		cancelCityEditing();
	};

	const restoreOriginalLocation = () => {
		editedLocation.value = { ...initialLocation.value };
	};

	const updateProbeLocation = async (event: MouseEvent | KeyboardEvent) => {
		// prevent the Enter key from triggering input's handler right after Select change via keyboard
		// required because PrimeVue Select doesn't fully isolate Enter behavior
		if (ignoreSelectEnter.value && 'key' in event && event.key === 'Enter') {
			ignoreSelectEnter.value = false;
			event.preventDefault();
			event.stopPropagation();
			return;
		}

		event.stopPropagation();

		if (!probe.value) { return; }

		const { name: initCity, state: initState, country: initCountry } = initialLocation.value;
		const { name: editedCity, state: editedState, country: editedCountry } = editedLocation.value;

		const prepEditedCity = editedCity.trim();
		const prepInitCity = initCity.trim();

		// check if the city is empty
		if (prepEditedCity === '') {
			sendToast('warn', 'Invalid input', 'City name cannot be empty');
			return;
		}

		// check if trimmed values are the same, stop editing-updating, restore to initial city's value
		if (prepEditedCity === prepInitCity && editedCity !== initCity) {
			editedLocation.value.name = initCity;
			return;
		}

		// check if nothing was changed
		const locationFields = Object.keys(editedLocation.value) as (keyof Omit<City, 'stateName'>)[];

		if (locationFields.every(key => editedLocation.value[key]?.trim() === initialLocation.value[key]?.trim())) {
			return;
		}

		probeDetailsUpdating.value = true;
		// create an object to store the probe's properties that need to be updated if they have changed
		const updProbePart: { city?: string; country?: string; state?: string | null } = {};

		if (editedCountry !== initCountry) {
			updProbePart.country = editedCountry;
		}

		if (prepEditedCity !== prepInitCity) {
			updProbePart.city = prepEditedCity;
		}

		if (editedState !== initState) {
			updProbePart.state = editedState;
		}

		try {
			await $directus.request(updateItem('gp_probes', probe.value.id, updProbePart));
			const updProbeDetails = await $directus.request<Probe>(readItem('gp_probes', probe.value.id));

			sendToast('success', 'Done', 'The probe has been successfully updated');
			cancelCityEditing(false);

			probe.value = updProbeDetails;
			updateMapMarker(updProbeDetails.latitude, updProbeDetails.longitude, mapCenterYOffsetPx.value);
		} catch (e) {
			sendErrorToast(e);

			if (inputCityRef.value) {
				inputCityRef.value.focus();
			}
		} finally {
			probeDetailsUpdating.value = false;
		}
	};
</script>
