<template>
	<div
		v-if="probe"
		ref="probeNameInput"
		class="relative flex h-[42px] w-full cursor-pointer items-center gap-1 focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--p-primary-color)] focus-visible:ring-offset-2 sm:w-auto"
		:class="{
			'[&>input]:outline-none [&>input]:ring-1 [&>input]:ring-[var(--p-primary-color)]': isEditingName,
			'[&>input]:dark:border-dark-600 [&>input]:dark:bg-dark-800': isEditingName,
		}"
		aria-label="Edit probe name"
		aria-haspopup="true"
		:aria-expanded="isEditingName"
		:tabindex="isEditingName ? -1 : 0"
		@click="!isEditingName && enableNameEditing()"
		@keyup.enter="!isEditingName && enableNameEditing()"
		@keyup.space="!isEditingName && enableNameEditing()"
		@keyup.esc="isEditingName && cancelNameEditing()"
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
			variant="text"
			severity="secondary"
			icon="pi pi-check"
			class="!absolute !right-4 !top-1/2 mr-8 !h-7 w-7 !-translate-y-1/2 !rounded-md !px-2 !py-1 !text-sm !font-bold focus:!border-[var(--p-primary-color)] focus:!ring-[var(--p-primary-color)]"
			:loading="probeDetailsUpdating"
			:disabled="probeDetailsUpdating"
			aria-label="Save probe name"
			@click.stop="updateProbeName"
			@blur="cancelNameEditingOnBlur"
		/>

		<Button
			v-if="isEditingName && editedName !== originalName && !probeDetailsUpdating"
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

	const emit = defineEmits([ 'save' ]);
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

		if (editedName.value === originalName.value) {
			isEditingName.value = false;
			probeDetailsUpdating.value = false;

			return;
		}

		try {
			await $directus.request(updateItem('gp_probes', probe.value.id, { name: editedName.value }));

			sendToast('success', 'Done', 'The probe has been successfully updated');
			emit('save');

			originalName.value = editedName.value;
			isEditingName.value = false;
			probe.value.name = editedName.value;
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
