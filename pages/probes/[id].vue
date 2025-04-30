<template>
	<div class="min-h-full p-6">
		<div class="flex flex-col gap-4">
			<div class="flex gap-2">
				<NuxtLink
					:href="getBackToProbesHref()"
					class="mr-auto flex cursor-pointer items-center gap-2"
					aria-label="Go back to the list of probes"
				>
					<i class="pi pi-arrow-left text-bluegray-500"/>
					<span class="font-bold text-bluegray-500">Back to probes</span>
				</NuxtLink>

				<div v-if="probeDetails" class="flex h-8 items-center gap-1 rounded-full border border-surface-300 md:hidden dark:border-dark-600">
					<span class="flex items-center gap-2 pl-3">
						<i class="pi pi-circle-fill text-[8px]" :class="getProbeStatusColor(probeDetails.status)"/>

						<span class="font-bold text-bluegray-900 dark:text-[var(--bluegray-0)]">
							{{ capitalize(probeDetails.status) }}
						</span>
					</span>

					<span class="mx-1 rounded-full bg-surface-200 px-2 py-0.5 font-bold text-bluegray-900 dark:text-[var(--bluegray-0)]">
						v{{ probeDetails.version }}
					</span>
				</div>
			</div>

			<div v-if="probeDetails" class="flex w-full flex-col items-center gap-4 sm:flex-row sm:flex-wrap">
				<div
					v-if="probeDetails"
					id="probeNameInput"
					class="relative flex h-[42px] w-full cursor-pointer items-center gap-1 sm:w-auto"
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
					<img v-if="isDarkMode" class="h-10" src="~/assets/icons/gp-dark.svg" alt="Globalping Dark Logo">
					<img v-else class="h-10" src="~/assets/icons/gp-white.svg" alt="Globalping White Logo">

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

				<div class="hidden h-8 items-center gap-1 rounded-full border border-surface-300 md:flex dark:border-dark-600">
					<span class="flex items-center gap-2 pl-3">
						<i class="pi pi-circle-fill text-[8px]" :class="getProbeStatusColor(probeDetails.status)"/>

						<span class="font-bold text-bluegray-900 dark:text-[var(--bluegray-0)]">
							{{ capitalize(probeDetails.status) }}
						</span>
					</span>

					<span class="mx-1 rounded-full bg-surface-200 px-2 py-0.5 font-bold text-bluegray-900 dark:bg-dark-600 dark:text-[var(--bluegray-0)]">
						v{{ probeDetails.version }}
					</span>
				</div>

				<div v-if="probeCreditsPerMonth" class="ml-auto flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-normal">
					<span class="whitespace-nowrap text-bluegray-900 dark:text-[var(--bluegray-0)]">
						Credits per month
					</span>

					<span class="flex h-[30px] items-center gap-2 rounded-md border border-surface-300 px-2 dark:border-dark-600">
						<nuxt-icon class="text-green-500" name="coin"/>
						<span class="font-bold text-green-500">+{{ probeCreditsPerMonth }}</span>
					</span>
				</div>
			</div>

			<div
				v-if="probeDetails"
				ref="ipsContentRef"
				class="flex flex-wrap content-start gap-2 rounded-xl bg-surface-100 p-4 transition-all ease-in-out dark:bg-dark-600"
				:class="getIpsOpeningClass()"
				:style="{
					maxHeight: ipsContentHeight,
					height: ipsContentHeight,
				}"
			>
				<span class="flex h-[38px] w-full items-center whitespace-nowrap sm:w-auto">Primary IP:</span>
				<span class="relative flex h-9 items-center rounded-xl border border-surface-300 bg-white pl-3 pr-8 font-bold text-dark-800 dark:border-dark-600 dark:bg-dark-800 dark:text-[var(--bluegray-0)]">
					{{ probeDetails.ip }}
					<CopyButton :content="probeDetails.ip" class="!top-[7px] size-5 cursor-pointer [&>button]:!size-full [&>button]:!border-none [&>button]:!p-0"/>
				</span>

				<template v-if="probeDetails?.altIps?.length">
					<span class="flex h-[38px] w-full items-center whitespace-nowrap sm:w-auto">Alternative IPs:</span>
					<span
						v-for="(altIp, index) in limitIpsToShow()"
						:key="index"
						class="relative flex h-9 items-center rounded-xl border border-surface-300 bg-white pl-3 pr-8 font-bold text-dark-800 dark:border-dark-600 dark:bg-dark-800 dark:text-[var(--bluegray-0)]"
					>
						{{ altIp }}
						<CopyButton :content="altIp" class="!top-[7px] mb-px size-5 cursor-pointer [&>button]:!size-full [&>button]:!border-none [&>button]:!p-0"/>
					</span>
				</template>

				<button
					v-if="(probeDetails?.altIps?.length || 0) > 1"
					:aria-label="showMoreIps ? 'Show less IPs' : 'Show more IPs'"
					class="flex h-[38px] w-28 cursor-pointer items-center justify-center font-bold text-bluegray-900 focus:!border-[var(--p-primary-color)] focus:!ring-[var(--p-primary-color)] dark:text-[var(--bluegray-0)]"
					@click="showHideMoreIps"
				>
					{{ showMoreIps ? 'Show less' : 'Show more' }}
				</button>
			</div>

			<Tabs value="0">
				<TabList class="!border-b !border-surface-300 dark:!border-dark-600">
					<Tab value="0" tabindex="0" class="!w-1/2 border-none !px-6 !py-2 !text-[14px] !font-bold sm:!w-auto">Details</Tab>
					<Tab value="1" tabindex="0" class="!w-1/2 border-none !px-6 !py-2 !text-[14px] !font-bold sm:!w-auto">Logs</Tab>
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
	// TODO: uncomment this line and remove the line below once loadCreditsData is updated
	// import { readItem, updateItem, aggregate } from '@directus/sdk';
	import { readItem, updateItem } from '@directus/sdk';
	import capitalize from 'lodash/capitalize';
	import ProbeTabDetails from '~/components/probes/ProbeTabDetails.vue';
	import { useAuth } from '~/store/auth';
	import { sendErrorToast, sendToast } from '~/utils/send-toast';

	const { $directus } = useNuxtApp();
	const route = useRoute();
	const router = useRouter();
	const probeId = route.params.id as string;
	const probeDetails = ref<Probe | null>(null);
	const emit = defineEmits([ 'save', 'hide', 'delete' ]);
	const auth = useAuth();
	const { user } = storeToRefs(auth);
	const probeDetailsUpdating = ref(false);

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

	loadProbeData(probeId);

	// HANDLE SCREEN SIZE
	const screenWidth = ref(0);
	const updateScreenWidth = () => {
		screenWidth.value = window.innerWidth;
	};

	onMounted(() => {
		screenWidth.value = window.innerWidth;

		window.addEventListener('resize', updateScreenWidth);
	});

	onBeforeUnmount(() => {
		window.removeEventListener('resize', updateScreenWidth);
	});

	watch(screenWidth, () => {
		nextTick(() => {
			updateIpsContentHeight(true);
		});
	});

	// HANDLE PROBE NAME
	const isEditingName = ref(false);
	const editedName = ref('');
	const originalName = ref('');
	const inputNameRef = ref<HTMLInputElement | null>(null);

	const name = computed(() => {
		if (probeDetails.value) {
			if (probeDetails.value.name) {
				return probeDetails.value.name;
			}

			return `${probeDetails.value.city} ${probeDetails.value.country} ${probeDetails.value.asn}`;
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
		const parentEl = document.getElementById('probeNameInput');

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

		if (!probeDetails.value) {
			probeDetailsUpdating.value = false;

			return;
		}

		if (editedName.value === originalName.value) {
			isEditingName.value = false;
			probeDetailsUpdating.value = false;

			return;
		}

		try {
			await $directus.request(updateItem('gp_probes', probeDetails.value.id, { name: editedName.value }));

			sendToast('success', 'Done', 'The probe has been successfully updated');
			emit('save');

			originalName.value = editedName.value;
			isEditingName.value = false;
			probeDetails.value.name = editedName.value;
		} catch (e) {
			sendErrorToast(e);

			if (inputNameRef.value) {
				inputNameRef.value.focus();
			}
		} finally {
			probeDetailsUpdating.value = false;
		}
	};

	// HANDLE PRIMARY, ALT IPS
	const showMoreIps = ref(false);
	const ipsContentRef = ref<HTMLDivElement | null>(null);
	const ipsContentHeight = ref('auto');
	const initialIpsContentHeight = ref('auto');
	const ipsOpening = ref(false);
	const ipsOpeningDuration = ref(500);

	const showHideMoreIps = () => {
		showMoreIps.value = !showMoreIps.value;

		nextTick(updateIpsContentHeight);
	};

	const limitIpsToShow = () => {
		if (showMoreIps.value) {
			return probeDetails?.value?.altIps;
		}

		return probeDetails?.value?.altIps?.slice(0, 1) ?? [];
	};

	const updateIpsContentHeight = async (onResize: boolean = false) => {
		if (!ipsContentRef.value) { return; }

		if (onResize) {
			showMoreIps.value = false;
			initialIpsContentHeight.value = 'auto';
			ipsContentHeight.value = 'auto';

			await nextTick();

			initialIpsContentHeight.value = `${ipsContentRef.value.scrollHeight}px`;
		}

		if (showMoreIps.value) {
			ipsContentHeight.value = `${ipsContentRef.value.scrollHeight}px`;
		} else {
			ipsContentHeight.value = initialIpsContentHeight.value;
		}
	};

	watch(probeDetails, async () => {
		await nextTick();

		if (ipsContentRef.value) {
			const initialHeight = `${ipsContentRef.value.scrollHeight}px`;
			initialIpsContentHeight.value = initialHeight;
			ipsContentHeight.value = initialHeight;
		}
	});

	watch(showMoreIps, () => {
		ipsOpening.value = true;

		setTimeout(() => {
			ipsOpening.value = false;
		}, ipsOpeningDuration.value);
	});

	const getIpsOpeningClass = () => {
		return `duration-${ipsOpeningDuration.value} ${ipsOpening.value ? 'overflow-hidden' : ''}`;
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
	// const loadCreditsData = async () => {
	// 	try {
	// 		const creditsResponse = await $directus.request<[{ sum: { amount: number }, adopted_probe: string}]>(aggregate('gp_credits_additions', {
	// 			query: {
	// 				filter: {
	// 					github_id: { _eq: user.value.external_identifier || 'admin' },
	// 					// adopted_probe: { _eq: probeDetails?.value?.id },
	// 					date_created: { _gte: '$NOW(-30 day)' },
	// 				},
	// 			},
	// 			// groupBy: [ 'adopted_probe' ],
	// 			aggregate: { sum: 'amount' },
	// 		}));

	// 		probeCreditsPerMonth.value = creditsResponse[0]?.sum?.amount;
	// 	} catch (e) {
	// 		sendErrorToast(e);
	// 	}
	// };

	// watch(probeDetails, async () => {
	// 	loadCreditsData();
	// });

	// HANDLE TOP LOGO IMG SRC
	const isDarkMode = computed(() => user.value.appearance === 'dark');


	// HANDLE GO BACK TO PROBES
	const getBackToProbesHref = () => {
		const defaultPath = '/probes';
		const prevPath = typeof router.options.history.state.back === 'string' ? router.options.history.state.back : defaultPath;
		const isPrevPathValid = prevPath.startsWith(defaultPath);

		return isPrevPathValid ? prevPath : defaultPath;
	};
</script>
