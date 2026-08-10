<template>
	<div class="flex flex-1 flex-col pb-6">
		<div class="flex flex-col gap-2">
			<div
				v-for="field in SETTINGS_SCHEMA"
				:key="field.key"
				class="flex min-h-16 items-center justify-between gap-6 rounded-xl border border-surface-300 bg-white px-6 py-4 dark:border-dark-600 dark:bg-dark-800"
			>
				<span class="font-bold text-dark-800 dark:text-bluegray-0">
					{{ field.label }}
				</span>

				<ToggleSwitch
					v-if="field.type === 'boolean'"
					v-model="formSettings[field.key]"
					:input-id="getInputId(field.key)"
					:aria-label="field.label"
					:disabled="probeDetailsUpdating"
				/>
			</div>
		</div>

		<div class="pt-6 text-right max-sm:mt-auto">
			<Button
				class="w-full sm:w-auto"
				label="Save settings"
				:loading="probeDetailsUpdating"
				:disabled="probeDetailsUpdating || !hasChanges"
				@click="saveSettings"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { updateItem } from '@directus/sdk';
	import { sendErrorToast, sendToast } from '~/utils/send-toast';

	const SETTINGS_SCHEMA = [
		{
			key: 'meteredConnection',
			type: 'boolean',
			label: 'Metered connection',
			default: false,
		},
	] as const;

	type SettingKey = typeof SETTINGS_SCHEMA[number]['key'];
	type FormSettings = Record<SettingKey, boolean>;

	const probe = defineModel('probe', {
		type: Object as PropType<Probe>,
		required: true,
	});

	const probeDetailsUpdating = defineModel('probeDetailsUpdating', {
		type: Boolean,
		required: true,
	});

	const { $directus } = useNuxtApp();
	const componentId = getCurrentInstance()?.uid;

	const getInputId = (key: SettingKey) => `probe-setting-${key}-${componentId}`;

	const buildFormSettings = (): FormSettings => Object.fromEntries(SETTINGS_SCHEMA.map(field => [
		field.key,
		probe.value.settings?.[field.key] ?? field.default,
	])) as FormSettings;

	const initialSettings = ref(buildFormSettings());
	const formSettings = ref(buildFormSettings());

	const changedSettings = computed(() => Object.fromEntries(SETTINGS_SCHEMA
		.filter(field => formSettings.value[field.key] !== initialSettings.value[field.key])
		.map(field => [ field.key, formSettings.value[field.key] ])) as Partial<FormSettings>);

	const hasChanges = computed(() => Object.keys(changedSettings.value).length > 0);

	const saveSettings = async () => {
		if (!hasChanges.value) {
			return;
		}

		const settings = { ...probe.value.settings, ...changedSettings.value };
		probeDetailsUpdating.value = true;

		try {
			const updatedProbe = await $directus.request(updateItem('gp_probes', probe.value.id, { settings }));
			probe.value.settings = updatedProbe.settings;
			initialSettings.value = buildFormSettings();
			formSettings.value = buildFormSettings();

			sendToast('success', 'Done', 'Probe settings have been successfully updated');
		} catch (e) {
			sendErrorToast(e);
		} finally {
			probeDetailsUpdating.value = false;
		}
	};
</script>
