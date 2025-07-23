<template>
	<div
		v-if="probe"
		ref="probeNameInput"
		class="relative flex h-[42px] w-full cursor-pointer items-center gap-1 focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-2 sm:w-auto"
		:class="{
			'[&>input]:outline-none [&>input]:ring-1 [&>input]:ring-primary': isEditingName,
			'[&>input]:dark:border-dark-600 [&>input]:dark:bg-dark-800': isEditingName,
		}"
		role="button"
		aria-label="Edit probe name"
		aria-haspopup="true"
		:aria-expanded="isEditingName"
		:tabindex="isEditingName ? -1 : 0"
		@click="enableNameEditing()"
		@keyup.enter="enableNameEditing()"
		@keyup.space="enableNameEditing()"
		@keyup.esc="cancelNameEditing()"
	>
		<BigIcon :name="probe.hardwareDevice ? 'probe' : 'docker'" border/>

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
			v-tooltip.top="'Save'"
			variant="text"
			severity="secondary"
			icon="pi pi-check"
			class="!absolute !right-4 !top-1/2 mr-8 !h-7 w-7 !-translate-y-1/2 !rounded-md !px-2 !py-1 !text-sm !font-bold focus:!border-primary focus:!ring-primary"
			:loading="probeDetailsUpdating"
			:disabled="probeDetailsUpdating"
			aria-label="Save probe name"
			@click.stop="updateProbeName"
			@blur="cancelNameEditingOnBlur"
		/>

		<Button
			v-if="isEditingName && editedName !== originalName && !probeDetailsUpdating"
			v-tooltip.top="'Cancel'"
			variant="text"
			severity="secondary"
			icon="pi pi-times"
			class="!absolute !right-4 !top-1/2 !h-7 w-7 !-translate-y-1/2 !rounded-md !px-2 !py-1 !text-sm !font-bold focus:!border-[#ef4444] focus:!ring-[#ef4444]"
			:disabled="probeDetailsUpdating"
			aria-label="Cancel editing probe name"
			@keyup.enter="cancelNameEditing"
			@click.stop="cancelNameEditing"
			@blur="cancelNameEditingOnBlur"
		/>

		<i v-if="!isEditingName" class="pi pi-pencil text-lg" aria-hidden="true"/>
	</div>
</template>

<script setup lang="ts">
	import { updateItem } from '@directus/sdk';
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

	const probeNameInput = ref<HTMLElement | null>(null);
	const isEditingName = ref(false);
	const editedName = ref('');
	const originalName = ref('');
	const inputNameRef = ref<HTMLInputElement | null>(null);

	const name = computed(() => {
		if (probe.value) {
			if (probe.value.name) {
				return probe.value.name;
			}

			return `${probe.value.city} ${probe.value.country} ${probe.value.asn}`;
		}

		return '';
	});

	watch(name, (newName) => {
		originalName.value = newName;
		editedName.value = newName;
	}, { immediate: true });

	const enableNameEditing = async () => {
		if (isEditingName.value) {
			return;
		}

		isEditingName.value = true;

		await nextTick();

		if (inputNameRef.value) {
			inputNameRef.value.focus();
		}
	};

	const cancelNameEditing = () => {
		if (!isEditingName.value) {
			return;
		}

		editedName.value = originalName.value;
		isEditingName.value = false;
	};

	const cancelNameEditingOnBlur = (event: FocusEvent) => {
		const target = event.relatedTarget as HTMLElement | null;
		const parentEl = probeNameInput.value;

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

		if (!probe.value) {
			probeDetailsUpdating.value = false;

			return;
		}

		const trimmed = editedName.value.trim();

		if (trimmed === originalName.value) {
			isEditingName.value = false;
			probeDetailsUpdating.value = false;

			return;
		}

		try {
			const updProbeDetails = await $directus.request(updateItem('gp_probes', probe.value.id, { name: trimmed }));

			sendToast('success', 'Done', 'The probe has been successfully updated');

			// First, update the probe with the set values. This is necessary because the server may adjust the value,
			// and it may end up being equal to our original state, in which case our watchers wouldn't fire.
			probe.value = { ...probe.value, name: trimmed };

			// Then set the updated version from the server.
			setTimeout(() => {
				probe.value = updProbeDetails;
			});

			isEditingName.value = false;
		} catch (e) {
			sendErrorToast(e);

			if (inputNameRef.value) {
				inputNameRef.value.focus();
			}
		} finally {
			probeDetailsUpdating.value = false;
		}
	};
</script>
