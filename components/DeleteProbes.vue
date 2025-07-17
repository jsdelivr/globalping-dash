<template>
	<div class="flex items-center gap-4">
		<div>
			<i class="pi pi-exclamation-triangle text-4xl text-primary"/>
		</div>
		<div class="ml-3">
			<div v-if="usePlural" class="flex flex-col gap-4">
				<p>You are about to delete the following probes:</p>
				<ul class="ml-4 list-disc">
					<li v-for="probe in probes" :key="probe.id" class="leading-[2rem]">
						<span class="font-bold">{{ probe.name || probe.city }}</span> ({{ probe.ip }}).
					</li>
				</ul>
				<p>Are you sure you want to delete these probes? You will not be able to undo this action.</p>
			</div>
			<div v-else class="flex flex-col gap-4">
				<p>You are about to delete probe <span class="font-bold">{{ probes[0].name || probes[0].city }}</span> ({{ probes[0].ip }}).</p>
				<p>Are you sure you want to delete this probe? You will not be able to undo this action.</p>
			</div>
		</div>
	</div>
	<div class="mt-7 text-right">
		<Button class="mr-2" label="Cancel" severity="secondary" text @click="emit('close')"/>
		<Button :loading="deleteLoading" :aria-disabled="deleteLoading" :label="usePlural ? 'Delete probes' : 'Delete probe'" severity="danger" @click="deleteProbes"/>
	</div>
</template>

<script setup lang="ts">
	import { updateItems } from '@directus/sdk';
	import { sendToast, sendErrorToast } from '~/utils/send-toast';

	const { probes } = defineProps({
		probes: { type: Array<Probe>, default: () => [] },
	});

	const emit = defineEmits<{
		(e: 'update:probes', value: Array<Probe>): void;
		(e: 'close' | 'success'): void;
	}>();

	const { $directus } = useNuxtApp();

	const deleteLoading = ref(false);
	const usePlural = computed(() => probes.length > 1);

	const deleteProbes = async () => {
		deleteLoading.value = true;
		const selectedProbesCount = probes.length ?? 0;

		try {
			if (selectedProbesCount) {
				await $directus.request(updateItems('gp_probes', probes.map(p => p.id), { userId: null }));
				sendToast('success', 'Done', `The ${usePlural.value ? 'probes have' : 'probe has'} been deleted`);
				emit('update:probes', []);
				emit('success');
			}
		} catch (e) {
			sendErrorToast(e);
		}

		deleteLoading.value = false;
		emit('close');
	};
</script>
