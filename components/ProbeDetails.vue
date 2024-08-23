<template>
	<div class="relative border-t">
		<div id="gp-map" class="h-44"/>
		<div class="absolute inset-x-0 top-2 ml-4 mr-20 flex justify-between">
			<div>
				Status:<span class="ml-2 font-bold">{{ capitalize(probe.status.replaceAll('-', ' ')) }}</span>
				<StatusIcon class="ml-2 text-3xs" :status="probe.status"/>
			</div>
			<div class="flex items-center">
				Credits per month:
				<nuxt-icon class="ml-2 text-green-500" name="coin"/>
				<span class="ml-2 font-bold text-green-500">+{{ props.credits }}</span>
			</div>
			<div>Type:<span class="ml-2 font-bold">{{ props.probe.hardwareDevice || 'Container' }}</span></div>
			<div>Version:<span class="ml-2 font-bold">{{ props.probe.version }}</span></div>
		</div>
	</div>
	<div class="px-5 py-7 dark:text-surface-0">
		<label for="probeName" class="text-xs">Probe name</label>
		<InputText
			id="probeName"
			v-model="probe.name"
			class="mt-1 w-full"
		/>
		<label for="primary-ip" class="mt-3 block text-xs">Primary IP</label>
		<div class="relative mt-1">
			<i class="pi pi-lock absolute right-3 top-2.5 text-bluegray-500"/>
			<InputText
				id="primary-ip"
				v-model="probe.ip"
				disabled
				class="w-full bg-transparent dark:bg-transparent"
			/>
		</div>
		<label for="alternative-ips" class="mt-3 block text-xs">Alternative IPs</label>
		<div class="relative mt-1">
			<i class="pi pi-lock absolute right-3 top-2.5 text-bluegray-500"/>
			<AutoComplete
				id="alternative-ips"
				v-model="probe.altIps"
				class="bg-transparent dark:bg-transparent"
				chip-icon="hidden"
				multiple
				disabled
				:typeahead="false"
			/>
		</div>
		<label for="country" class="mt-3 block text-xs">Country</label>
		<div class="relative mt-1">
			<i class="pi pi-lock absolute right-3 top-2.5 text-bluegray-500"/>
			<InputText
				id="country"
				v-model="probe.country"
				disabled
				class="w-full bg-transparent dark:bg-transparent"
			/>
		</div>
		<label for="city" class="mt-3 block text-xs">City</label>
		<div class="relative mt-1">
			<InputText
				id="city"
				v-model="probe.city"
				class="w-full bg-transparent dark:bg-transparent"
			/>
		</div>
		<p class="mt-1 text-xs text-bluegray-400">
			City where the probe is located. If you know that city is wrong it can be changed here: type in the valid city and click save.
		</p>
		<label for="tags" class="mt-3 block text-xs">Tags</label>
		<div class="relative mt-1">
			<i class="pi pi-pencil absolute right-3 top-2.5 text-bluegray-500"/>
			<AutoComplete
				id="tags"
				v-model="tagStrings"
				class="bg-transparent dark:bg-transparent"
				chip-icon="hidden"
				multiple
				disabled
				:typeahead="false"
			/>
		</div>
		<p class="mt-1 text-xs text-bluegray-400">
			Public tags of the probe. They can be used as location filters for a measurement.
		</p>
		<div class="mt-7 text-right">
			<Button class="mr-2" label="Cancel" severity="secondary" text @click="$emit('cancel')"/>
			<Button label="Save" :loading="updateProbeLoading" @click="updateProbe"/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { createItem, customEndpoint, updateItem } from '@directus/sdk';
	import capitalize from 'lodash/capitalize';
	import { initGoogleMap } from '~/utils/init-google-map';
	import { sendErrorToast, sendToast } from '~/utils/send-toast';

	const props = defineProps({
		probe: {
			type: Object as () => Probe,
			default: () => {},
		},
		credits: {
			type: Number,
			default: 0,
		},
	});

	const probe = computed(() => ({ ...props.probe }));

	initGoogleMap(probe.value);

	const emit = defineEmits([ 'cancel', 'save' ]);

	const { $directus } = useNuxtApp();

	// TAGS

	const tagStrings = computed(() => probe.value.tags.map(({ prefix, value }) => `u-${prefix}-${value}`));

	// // ACTIONS

	const updateProbeLoading = ref(false);
	const updateProbe = async () => {
		updateProbeLoading.value = true;

		try {
			await $directus.request(updateItem('gp_adopted_probes', probe.value.id, {
				name: probe.value.name,
				city: probe.value.city,
			}));

			sendToast('success', 'Done', 'Probe info was successfully updated');
			emit('save');
		} catch (e) {
			updateProbeLoading.value = false;
			sendErrorToast(e);
		}
	};
</script>
