<template>
	<div
		v-if="probe"
		ref="containerRef"
		class="absolute inset-x-4 bottom-9 flex flex-col gap-1 sm:flex-row sm:gap-0"
		@focusout="cancelEditing"
	>
		<div
			class="flex h-[34px] w-full shrink-0 items-center justify-center rounded-md border border-[#D1D5DB] bg-[#E5E7EB] sm:h-auto sm:w-24 sm:rounded-r-none sm:border-r-0 dark:border-dark-600 dark:bg-dark-800"
			aria-hidden="true"
		>
			<Select
				id="country"
				v-model="selectedCountry"
				:options="[ ...probe.allowedCountries, OTHER_COUNTRY_OPTION ]"
				class="size-full rounded-md border-0 border-[#D1D5DB] focus:outline-none focus:ring-1 focus:ring-primary sm:!rounded-r-none sm:!border-r dark:border-dark-600 dark:!bg-dark-800"
				:pt="{ dropdown: 'w-8', root: { tabindex: '-1' } }"
				:pt-options="{ mergeProps: true }"
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
			class="relative flex h-[34px] grow rounded-md border border-[#D1D5DB] bg-white focus:z-10 focus:ring-1 focus:ring-primary sm:h-auto sm:rounded-l-none sm:border-l-0 dark:border-dark-600 dark:bg-dark-800"
		>
			<input
				ref="inputCityRef"
				v-model="editedCity"
				class="flex size-full rounded-md pl-3 pr-[72px] text-bluegray-900 outline-none focus:ring-1 focus:ring-primary sm:h-auto sm:rounded-l-none dark:bg-dark-800 dark:text-bluegray-0"
				:class="{ 'cursor-pointer': !isEditingCity }"
				aria-label="City name"
				autocomplete="off"
				@focus="enableCityEditing(false)"
				@keyup.enter="updateProbeLocation"
				@keyup.esc="cancelCityEditing()"
			>

			<Button
				v-if="isEditingCity && ((editedCity !== initialCity) || (originalCountry !== editedCountry))"
				v-tooltip.top="'Save'"
				variant="text"
				severity="secondary"
				icon="pi pi-check"
				class="!absolute !right-2 !top-1/2 mr-8 !h-7 w-7 !-translate-y-1/2 !rounded-md !px-2 !py-1 !text-sm !font-bold focus:!border-primary focus:!ring-primary"
				:loading="probeDetailsUpdating"
				:disabled="probeDetailsUpdating"
				aria-label="Save"
				@click.stop="updateProbeLocation"
			/>

			<i v-if="!isEditingCity" class="pi pi-pencil text-md absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" aria-hidden="true" @click="enableCityEditing(false)"/>

			<Button
				v-if="isEditingCity && (((editedCity !== initialCity) || (originalCountry !== editedCountry)))"
				v-tooltip.top="'Cancel'"
				variant="text"
				severity="secondary"
				icon="pi pi-times"
				class="!absolute !right-2 !top-1/2 !h-7 w-7 !-translate-y-1/2 !rounded-md !px-2 !py-1 !text-sm !font-bold focus:!border-[#ef4444] focus:!ring-[#ef4444]"
				:disabled="probeDetailsUpdating"
				aria-label="Cancel"
				@keyup.enter="cancelCityEditing()"
				@click.stop="cancelCityEditing()"
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

	const containerRef = ref<HTMLElement | null>(null);
	const isEditingCity = ref(false);
	const editedCity = ref('');
	const initialCity = ref('');
	const selectedCountry = ref('');
	const editedCountry = ref(''); // editedCountry is set to selectedCountry unless the user picks the "Other" country option
	const originalCountry = ref('');
	const invalidCountryDialog = ref(false);
	const inputCityRef = ref<HTMLInputElement | null>(null);
	const ignoreSelectEnter = ref(false);
	const selectEnterPressed = ref(false);
	const OTHER_COUNTRY_OPTION = 'Other';

	watch(() => probe.value.city, (newCity) => {
		initialCity.value = newCity;
		editedCity.value = newCity;
	}, { immediate: true });

	watch(() => probe.value.country, (newCountry) => {
		originalCountry.value = newCountry;
		editedCountry.value = newCountry;
	}, { immediate: true });

	watch(editedCountry, newCountry => selectedCountry.value = newCountry, { immediate: true });

	const onCountryChanged = async (event: SelectChangeEvent) => {
		// wait for Vue to update
		await nextTick();

		if (event.value === OTHER_COUNTRY_OPTION) {
			invalidCountryDialog.value = true;
			selectedCountry.value = editedCountry.value;
		} else {
			isEditingCity.value = false;
			editedCountry.value = selectedCountry.value;
		}

		// then delay again to let Select finish its focus handling
		setTimeout(() => {
			enableCityEditing(true);

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
		if (isEditingCity.value) {
			return;
		}

		isEditingCity.value = true;
		inputCityRef.value?.focus();
		select && inputCityRef.value?.select();
	};

	const cancelCityEditing = (revert: boolean = true) => {
		if (!isEditingCity.value) {
			return;
		}

		revert && restoreOriginalLocation();
		isEditingCity.value = false;
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
		editedCity.value = initialCity.value;
		editedCountry.value = originalCountry.value;
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

		const prepEditedCity = editedCity.value.trim();
		const prepInitialCity = initialCity.value.trim();

		// check if the city is empty
		if (prepEditedCity === '') {
			sendToast('warn', 'Invalid input', 'City name cannot be empty');

			return;
		}

		// check if trimmed values are the same, stop editing-updating, restore to initial city's value
		if (prepEditedCity === prepInitialCity && editedCity.value !== initialCity.value) {
			isEditingCity.value = false;
			editedCity.value = initialCity.value;

			return;
		}

		// check if nothing was changed
		if (prepEditedCity === prepInitialCity && editedCountry.value === originalCountry.value) {
			isEditingCity.value = false;

			return;
		}

		probeDetailsUpdating.value = true;
		// create an object to store the probe's properties that need to be updated if they have changed
		const updProbePart: { city?: string; country?: string } = {};

		if (editedCountry.value !== originalCountry.value) {
			updProbePart.country = editedCountry.value;
		}

		if (prepEditedCity !== prepInitialCity) {
			updProbePart.city = prepEditedCity;
		}

		try {
			$directus.request(updateItem('gp_probes', probe.value.id, updProbePart));
			const updProbeDetails = await $directus.request(readItem('gp_probes', probe.value.id));

			sendToast('success', 'Done', 'The probe has been successfully updated');
			cancelCityEditing(false);

			// First, update the probe with the set values. This is necessary because the server may adjust the value,
			// and it may end up being equal to our original state, in which case our watchers wouldn't fire.
			probe.value = { ...probe.value, ...updProbePart };

			// Then set the updated version from the server.
			setTimeout(() => {
				probe.value = updProbeDetails;
				updateMapMarker(updProbeDetails.latitude, updProbeDetails.longitude, mapCenterYOffsetPx.value);
			});
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
