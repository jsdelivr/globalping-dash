<template>
	<div id="gp-map" class="mt-3 h-44 rounded-md"/>
	<div class="px-5 py-7 dark:text-surface-0">
		<label for="probeName" class="text-xs">Probe name</label>
		<InputText
			id="probeName"
			v-model="name"
			class="mt-1 w-full"
		/>
		<label for="primary-ip" class="mt-3 block text-xs">Primary IP</label>
		<InputText
			id="primary-ip"
			v-model="probe.ip"
			class="mt-1 w-full"
		/>
		<label for="primary-ip" class="mt-3 block text-xs">Alternative IPs</label>
		<AutoComplete
			id="alternative-ips"
			v-model="probe.altIps"
			class="mt-1"
			chip-icon="hidden"
			multiple
			:typeahead="false"
			:pt="{ chipItem: '' }"
		/>
		<!-- <label for="primary-ip">Primary IP</label>
		<InputText
			id="primary-ip"
			v-model="name"
			class="mt-2 w-full"
			@update:model-value="resetInvalid"
		/>
		<label for="alternative-ips" class="mt-6 block">Alternative IPs</label>
		<p class="mt-1 text-xs">
			A list of origins which are allowed to use the token. If empty, any origin is valid.
			Examples of valid origins: "https://www.jsdelivr.com", "https://www.jsdelivr.com:10000".
		</p>
		<div class="mt-7 text-right">
			<Button class="mr-2" label="Cancel" severity="secondary" text @click="$emit('cancel')"/>
			<Button label="Save" :loading="updateProbeLoading" @click="updateProbe"/>
		</div> -->
	</div>
</template>

<script setup lang="ts">
	import { initGoogleMap } from '~/utils/init-google-map';

	const props = defineProps({
		probe: {
			type: Object as () => Probe,
			default: () => {},
		},
	});

	const probe = computed(() => ({ ...props.probe }));

	initGoogleMap(probe.value);

	// import { createItem, customEndpoint, updateItem } from '@directus/sdk';
	// import { sendErrorToast, sendToast } from '~/utils/send-toast';

	// const props = defineProps({
	// 	token: {
	// 		type: Object as () => Probe | null,
	// 		default: () => null,
	// 	},
	// });

	// const emit = defineEmits([ 'generate', 'cancel', 'save', 'regenerate' ]);

	// const { $directus } = useNuxtApp();

	// NAME

	const name = ref(props.probe.name || '');

	// // ACTIONS

	// const updateProbeLoading = ref(false);
	// const updateProbe = async () => {
	// 	if (!name.value) {
	// 		isNameInvalid.value = true;
	// 		return;
	// 	}

	// 	updateProbeLoading.value = true;

	// 	try {
	// 		await $directus.request(updateItem('gp_tokens', props.token!.id, {
	// 			// name: name.value,
	// 			// origins: origins.value,
	// 			// expire: expire.value && expire.value.toISOString().split('T')[0],
	// 		}));

	// 		sendToast('success', 'Done', 'Probe info was successfully updated');

	// 		emit('save');
	// 	} catch (e) {
	// 		sendErrorToast(e);
	// 	}
	// };
</script>
