<template>
	<div class="min-h-full p-6">
		<div class="flex flex-col gap-4">
			<div class="flex gap-2">
				<NuxtLink to="/probes" class="mr-auto flex items-center gap-2">
					<i class="pi pi-arrow-left text-bluegray-500"/>
					<span class="text-[14px] font-bold text-bluegray-500">Back to probes</span>
				</NuxtLink>
			</div>

			<div v-if="probeDetails" class="flex gap-4">
				<div class="flex items-center gap-3">
					<img class="h-10" src="~/assets/icons/gp-white.svg" alt="Globalping White logo">

					<span class="text-2xl font-bold">{{ probeDetails.city }} {{ probeDetails.country }}{{ probeDetails.asn }}</span>

					<i class="pi pi-pencil text-lg"/>
				</div>

				<div class="flex items-center gap-1 rounded-full border border-surface-300">
					<span class="flex items-center gap-2 pl-3">
						<i class="pi pi-circle-fill text-[8px] text-green-500"/>

						<span class="text-[14px] font-bold text-bluegray-900">
							{{ capitalize(probeDetails.status) }}
						</span>
					</span>

					<span class="mx-1 rounded-full bg-surface-200 px-2 py-1 text-[14px] font-bold text-bluegray-900">
						v{{ probeDetails.version }}
					</span>
				</div>

				<div class="ml-auto">
					Credits per month
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { readItem } from '@directus/sdk';
	import capitalize from 'lodash/capitalize';
	import { sendErrorToast } from '~/utils/send-toast';

	const { $directus } = useNuxtApp();
	const route = useRoute();
	const probeId = route.params.id as string;
	const probeDetails = ref<Probe | null>(null);

	useHead(() => {
		return {
			title: `${probeId}`,
		};
	});

	useHead(() => {
		return {
			title: probeDetails.value ? `Probe '${probeDetails.value.name || probeDetails.value.city}' -` : 'Probe -',
		};
	});

	const loadProbeData = async (id: string) => {
		try {
			probeDetails.value = await $directus.request(readItem('gp_adopted_probes', id));

			console.log('+++++ probeDetails.value', probeDetails.value);
			console.log('_________________________');
		} catch (e) {
			const response = (e as { response?: Response } | undefined)?.response;

			if (response?.status === 403) {
				return navigateTo('/probes');
			}

			sendErrorToast(e);
		}
	};

	loadProbeData(probeId);
</script>
