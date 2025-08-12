<template>
	<div class="flex items-center gap-4">
		<div>
			<i class="pi pi-exclamation-triangle text-xl text-red-500 dark:text-red-400"/>
		</div>
		<div>
			<div v-if="probes.length > 1" class="flex flex-col">
				<p>You are about to delete the following probes:</p>
				<ul class="mb-4 ml-8 list-disc">
					<li v-for="probe in probes" :key="probe.id" class="leading-7">
						<span class="font-bold">{{ probe.name || probe.city }}</span> ({{ probe.ip }})
					</li>
				</ul>
				<p>Are you sure you want to delete these probes? You will not be able to undo this action.</p>
			</div>
			<div v-else class="flex flex-col">
				<p>You are about to delete the probe <span class="font-bold">{{ probes[0].name || probes[0].city }}</span> ({{ probes[0].ip }}).</p>
				<p>Are you sure you want to delete this probe? You will not be able to undo this action.</p>
			</div>
		</div>
	</div>

	<div class="mt-6 text-right">
		<Button class="mr-2" label="Cancel" severity="secondary" text @click="emit('cancel')"/>
		<Button :loading="deleteLoading" :aria-disabled="deleteLoading" :label="`Delete ${pluralize('probe', probes.length)}`" severity="danger" @click="deleteProbes"/>
	</div>
</template>

<script setup lang="ts">
	import { updateItems } from '@directus/sdk';
	import { pluralize } from '~/utils/pluralize';
	import { sendToast, sendErrorToast } from '~/utils/send-toast';

	const props = defineProps({
		probes: {
			type: Array as PropType<Probe[]>,
			default: () => [],
		},
	});

	const emit = defineEmits<{
		(e: 'cancel' | 'success'): void;
	}>();

	const { $directus } = useNuxtApp();
	const deleteLoading = ref(false);

	const deleteProbes = async () => {
		deleteLoading.value = true;
		const selectedProbesCount = props.probes.length;

		try {
			if (selectedProbesCount) {
				await $directus.request(updateItems('gp_probes', props.probes.map(p => p.id), { userId: null }));
				sendToast('success', 'Done', `The ${pluralize('probe has', 'probes have', selectedProbesCount)} been deleted`);
				deleteLoading.value = false;
				emit('success');
				return;
			}
		} catch (e) {
			sendErrorToast(e);
		}

		deleteLoading.value = false;
		emit('cancel');
	};
</script>
