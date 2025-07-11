<template>
	<div
		v-if="probe"
		class="absolute inset-x-4 bottom-9 flex"
		:class="{
			'flex-col gap-1 sm:flex-row sm:gap-0': probe.allowedCountries.length > 1,
		}"
	>
		<span
			class="flex h-[34px] shrink-0 items-center justify-center border border-[#D1D5DB] bg-[#E5E7EB] dark:border-dark-600 dark:bg-dark-800"
			aria-hidden="true"
			:class="{
				'w-[38px] rounded-l-md border-r-0': probe.allowedCountries.length <= 1,
				'w-full rounded-md sm:h-auto sm:w-24 sm:rounded-r-none sm:border-r-0': probe.allowedCountries.length > 1,
			}"
		>
			<InputGroupAddon
				v-if="probe.allowedCountries.length <= 1"
				class="border-none !bg-transparent"
			>
				<CountryFlag :country="probe.country" size="small"/>
			</InputGroupAddon>

			<Select
				v-if="probe.allowedCountries.length > 1"
				id="country"
				v-model="editedCountry"
				:options="probe.allowedCountries"
				class="size-full border-0 border-[#D1D5DB] focus:outline-none focus:ring-1 focus:ring-primary dark:border-dark-600 dark:!bg-dark-800"
				:class="{
					'rounded-md sm:!rounded-r-none sm:!border-r': probe.allowedCountries.length > 1,
				}"
				:pt="{ dropdown: 'w-8' }"
				:pt-options="{ mergeProps: true }"
				@change="onCountryChanged"
				@keydown="handleSelectEnterKey"
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
			class="relative flex h-[34px] grow border border-[#D1D5DB] bg-white focus:z-10 focus:ring-1 focus:ring-primary dark:border-dark-600 dark:bg-dark-800"
			:class="{
				'rounded-r-md border-l-0': probe.allowedCountries.length <= 1,
				'rounded-md sm:h-auto sm:rounded-l-none sm:border-l-0': probe.allowedCountries.length > 1,
			}"
		>
			<input
				ref="inputCityRef"
				v-model="editedCity"
				class="flex w-full pl-3 pr-[72px] text-bluegray-900 outline-none focus:ring-1 focus:ring-primary dark:bg-dark-800 dark:text-bluegray-0"
				:class="{
					'rounded-r-md': probe.allowedCountries.length <= 1,
					'h-full rounded-md sm:h-auto sm:rounded-l-none': probe.allowedCountries.length > 1,
					'cursor-pointer': !isEditingCity,
				}"
				aria-label="City name"
				autocomplete="off"
				@focus="enableCityEditing(false)"
				@blur="cancelCityEditingOnBlur"
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
				@blur="cancelCityEditingOnBlur"
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
				@blur="cancelCityEditingOnBlur"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { updateItem } from '@directus/sdk';
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

	const probeCityInput = ref<HTMLElement | null>(null);
	const isEditingCity = ref(false);
	const editedCity = ref('');
	const initialCity = ref('');
	const editedCountry = ref('');
	const originalCountry = ref('');
	const inputCityRef = ref<HTMLInputElement | null>(null);
	const ignoreSelectEnter = ref(false);
	const selectEnterPressed = ref(false);

	watch(() => probe.value.city, (newCity) => {
		initialCity.value = newCity;
		editedCity.value = newCity;
	}, { immediate: true });

	watch(() => probe.value.country, (newCountry) => {
		originalCountry.value = newCountry;
		editedCountry.value = newCountry;
	}, { immediate: true });

	const onCountryChanged = async () => {
		// wait for Vue to update
		await nextTick();

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
			const updProbeDetails = await $directus.request(updateItem('gp_probes', probe.value.id, updProbePart));

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
