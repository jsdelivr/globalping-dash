<template>
	<div class="min-h-full p-6">
		<div class="flex flex-col gap-4">
			<div class="flex gap-2">
				<NuxtLink
					:to="getBackToProbesHref()"
					class="mr-auto flex cursor-pointer items-center gap-2 focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--p-primary-color)] focus-visible:ring-offset-2"
					aria-label="Go back to the list of probes"
				>
					<i class="pi pi-arrow-left text-bluegray-500"/>
					<span class="font-bold text-bluegray-500">Back to probes</span>
				</NuxtLink>

				<div v-if="probeDetails" class="flex h-8 items-center gap-1 rounded-full border border-surface-300 md:hidden dark:border-dark-600">
					<span class="flex items-center gap-2 pl-3">
						<i class="pi pi-circle-fill text-[8px]" :class="getProbeStatusColor(probeDetails.status)"/>

						<span class="font-bold text-bluegray-900 dark:text-bluegray-0">
							{{ capitalize(probeDetails.status) }}
						</span>
					</span>

					<span class="mx-1 rounded-full bg-surface-200 px-2 py-0.5 font-bold text-bluegray-900 dark:text-bluegray-0">
						v{{ probeDetails.version }}
					</span>
				</div>
			</div>

			<div v-if="probeDetails" class="flex w-full flex-col items-center gap-4 sm:flex-row sm:flex-wrap">
				<ProbeNameInput v-model:probe-details-updating="probeDetailsUpdating" v-model:probe="probeDetails"/>

				<div class="hidden h-8 items-center gap-1 rounded-full border border-surface-300 md:flex dark:border-dark-600">
					<span class="flex items-center gap-2 pl-3">
						<i class="pi pi-circle-fill text-[8px]" :class="getProbeStatusColor(probeDetails.status)"/>

						<span class="font-bold text-bluegray-900 dark:text-bluegray-0">
							{{ capitalize(probeDetails.status) }}
						</span>
					</span>

					<span class="mx-1 rounded-full bg-surface-200 px-2 py-0.5 font-bold text-bluegray-900 dark:bg-dark-600 dark:text-bluegray-0">
						v{{ probeDetails.version }}
					</span>
				</div>

				<div v-if="probeCreditsPerMonth" class="ml-auto flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-normal">
					<span class="whitespace-nowrap text-bluegray-900 dark:text-bluegray-0">
						Credits per month
					</span>

					<span class="flex h-[30px] items-center gap-2 rounded-md border border-surface-300 px-2 dark:border-dark-600">
						<nuxt-icon class="text-green-500" name="coin"/>
						<span class="font-bold text-green-500">+{{ probeCreditsPerMonth }}</span>
					</span>
				</div>
			</div>

			<show-more v-if="probeDetails" v-model:expanded="showMoreIps">
				<div
					class="flex flex-wrap content-start gap-2 rounded-xl bg-surface-100 p-4 dark:bg-dark-600"
				>
					<span class="flex h-[38px] w-full items-center whitespace-nowrap sm:w-auto">Primary IP:</span>
					<span class="relative flex h-9 items-center rounded-xl border border-surface-300 bg-white pl-3 pr-8 font-bold text-dark-800 dark:border-dark-600 dark:bg-dark-800 dark:text-bluegray-0">
						{{ probeDetails.ip }}
						<CopyButton :content="probeDetails.ip" class="!top-[7px] size-5 cursor-pointer [&>button]:!size-full [&>button]:!border-none [&>button]:!p-0"/>
					</span>

					<template v-if="probeDetails?.altIps?.length">
						<span class="flex h-[38px] w-full items-center whitespace-nowrap sm:w-auto">Alternative IPs:</span>
						<span
							v-for="(altIp, index) in limitIpsToShow()"
							:key="index"
							class="relative flex h-9 items-center rounded-xl border border-surface-300 bg-white pl-3 pr-8 font-bold text-dark-800 dark:border-dark-600 dark:bg-dark-800 dark:text-bluegray-0"
						>
							{{ altIp }}
							<CopyButton :content="altIp" class="!top-[7px] mb-px size-5 cursor-pointer [&>button]:!size-full [&>button]:!border-none [&>button]:!p-0"/>
						</span>
					</template>

					<button
						v-if="probeDetails.altIps.length > 1"
						:aria-label="showMoreIps ? 'Show fewer IPs' : 'Show more IPs'"
						class="flex h-[38px] w-28 cursor-pointer items-center justify-center font-bold text-bluegray-900 focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--p-primary-color)] dark:text-bluegray-0"
						@click="showMoreIps = !showMoreIps"
					>
						{{ showMoreIps ? 'Show less' : 'Show more' }}
					</button>
				</div>
			</show-more>

			<Tabs value="0">
				<TabList class="!border-b !border-surface-300 dark:!border-dark-600">
					<Tab value="0" tabindex="0" class="!w-1/2 border-none !px-6 !py-2 !text-[14px] !font-bold sm:!w-auto">Details</Tab>
					<!-- temporarily hide Logs tab while it's under construction -->
					<!-- <Tab value="1" tabindex="0" class="!w-1/2 border-none !px-6 !py-2 !text-[14px] !font-bold sm:!w-auto">Logs</Tab> -->
				</TabList>

				<TabPanels class="mt-6 !bg-transparent !p-0">
					<TabPanel v-if="probeDetails" value="0" tabindex="-1">
						<ProbeTabDetails v-model:probe-details-updating="probeDetailsUpdating" v-model:probe="probeDetails"/>
					</TabPanel>

					<TabPanel value="1" tabindex="-1">
						NO LOGS FOR NOW
					</TabPanel>
				</TabPanels>
			</Tabs>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { readItem, aggregate } from '@directus/sdk';
	import capitalize from 'lodash/capitalize';
	import { useAuth } from '~/store/auth';
	import { sendErrorToast } from '~/utils/send-toast';

	const { $directus } = useNuxtApp();
	const route = useRoute();
	const router = useRouter();
	const auth = useAuth();
	const { user } = storeToRefs(auth);
	const probeId = route.params.id as string;
	const probeDetails = ref<Probe | null>(null);
	const probeDetailsUpdating = ref(false);
	const showMoreIps = ref(false);

	useHead(() => {
		return {
			title: probeDetails.value ? `Probe '${probeDetails.value.name || probeDetails.value.city}' -` : 'Probe -',
		};
	});

	const loadProbeData = async (id: string) => {
		try {
			probeDetails.value = await $directus.request(readItem('gp_probes', id));
		} catch (e) {
			const response = (e as { response?: Response } | undefined)?.response;

			if (response?.status === 403) {
				return navigateTo('/probes');
			}

			sendErrorToast(e);
		}
	};

	await loadProbeData(probeId);

	// HANDLE PRIMARY, ALT IPS
	const limitIpsToShow = () => {
		if (showMoreIps.value) {
			return probeDetails?.value?.altIps;
		}

		return probeDetails?.value?.altIps?.slice(0, 1) ?? [];
	};


	// HANDLE STATUS COLORS
	const getProbeStatusColor = (status: string) => {
		switch (status.toLowerCase()) {
		case 'ready':
			return 'text-green-500';

		case 'offline':
			return 'text-bluegray-500';

		case 'ping-test-failed':
			return 'text-red-500';

		default:
			return 'text-yellow-600';
		}
	};

	// HANDLE CREDITS
	const probeCreditsPerMonth = ref<number | null>(null);

	// TODO: update loadCreditsData once BE is ready
	const loadCreditsData = async () => {
		try {
			const creditsResponse = await $directus.request<[{ sum: { amount: number }, adopted_probe: string}]>(aggregate('gp_credits_additions', {
				query: {
					filter: {
						github_id: { _eq: user.value.external_identifier || 'admin' },
						adopted_probe: { _eq: probeDetails?.value?.id },
						date_created: { _gte: '$NOW(-30 day)' },
					},
				},
				groupBy: [ 'adopted_probe' ],
				aggregate: { sum: 'amount' },
			}));

			probeCreditsPerMonth.value = creditsResponse[0]?.sum?.amount;
		} catch (e) {
			sendErrorToast(e);
		}
	};

	watch(probeDetails, async () => {
		loadCreditsData();
	}, { immediate: true });

	// HANDLE GO BACK TO PROBES
	const getBackToProbesHref = () => {
		const defaultPath = '/probes';
		const prevPath = typeof router.options.history.state.back === 'string' ? router.options.history.state.back : defaultPath;
		const isPrevPathValid = prevPath.startsWith(defaultPath);

		return isPrevPathValid ? prevPath : defaultPath;
	};
</script>
