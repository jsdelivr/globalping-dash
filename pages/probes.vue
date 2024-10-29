<template>
	<div class="min-h-full p-6" :class="{'md:min-w-[940px]': probes?.length}">
		<div class="mb-4 flex">
			<h1 class="page-title">Probes</h1>
			<Button class="ml-auto" @click="adoptProbeDialog = true">
				<nuxt-icon class="pi" name="capture"/>
				<span class="font-bold">Adopt a probe</span>
			</Button>
		</div>
		<div v-if="probes.length || loading">
			<div class="max-md:hidden">
				<DataTable
					ref="dataTableRef"
					:value="probes"
					lazy
					:rows="itemsPerPage"
					data-key="id"
					:total-records="probesCount"
					:loading="loading"
					:row-class="() => 'cursor-pointer hover:bg-surface-50 dark:hover:bg-dark-700'"
					:pt="{footer: '!pt-0 border-t-0'}"
					:pt-options="{ mergeProps: true }"
				>
					<template #header>
						<h3 class="px-2">List of probes</h3>
					</template>
					<Column class="w-96" body-class="!p-0 h-16" :style="{ width: `${columnWidths.name}px` }">
						<template #header>
							Name <i v-tooltip.top="'Private name of the probe, visible only to you'" class="pi pi-info-circle"/>
						</template>

						<template #body="slotProps">
							<NuxtLink :to="`/probes/${slotProps.data.id}`" class="flex h-full items-center" @click="openProbeDetails(slotProps.data.id)">
								<div class="grid grid-cols-[auto_1fr] grid-rows-[auto_auto] gap-x-3 px-2 py-3">
									<BigIcon class="col-span-1 row-span-2" :name="slotProps.data.hardwareDevice ? 'gp' : 'docker'" border :status="slotProps.data.status"/>
									<p class="col-start-2 col-end-3 flex items-center font-bold">{{ slotProps.data.name || slotProps.data.city }}</p>
									<p class="col-start-2 col-end-3 row-start-2 row-end-3 text-[13px] text-bluegray-900 dark:text-bluegray-400">{{ slotProps.data.ip }}</p>
								</div>
							</NuxtLink>
						</template>
					</Column>
					<Column class="w-96" body-class="!p-0 h-16" :style="{ width: `${columnWidths.location}px` }">
						<template #header>
							Location <i v-tooltip.top="'Current probe location. If the auto-detected value is wrong, you can adjust it in probe details.'" class="pi pi-info-circle"/>
						</template>

						<template #body="slotProps">
							<NuxtLink :to="`/probes/${slotProps.data.id}`" class="flex h-full items-center" @click="openProbeDetails(slotProps.data.id)">
								<div class="px-2 py-3">
									<div class="mb-1 flex items-center">
										<CountryFlag :country="slotProps.data.country" size="small"/>
										<p class="ml-2 font-bold">{{ slotProps.data.city }}, {{ slotProps.data.country }}</p>
									</div>
									<p>{{ slotProps.data.network }}, AS{{ slotProps.data.asn }}</p>
								</div>
							</NuxtLink>
						</template>
					</Column>
					<Column body-class="h-16" :style="{ width: `${columnWidths.tags}px` }">
						<template #header>
							Tags <i ref="tagsHeaderContentRef" v-tooltip.top="'Public tags that can be used to target the probe in measurements.'" class="pi pi-info-circle"/>
						</template>

						<template #body="slotProps">
							<NuxtLink :to="`/probes/${slotProps.data.id}`" class="flex h-full items-center" @click="openProbeDetails(slotProps.data.id)">
								<TagsList :tags="getAllTags(slotProps.data)" :number-of-tags-to-show="numberOfTagsToShow"/>
							</NuxtLink>
						</template>
					</Column>
					<template #footer>
						<div class="flex h-14 items-center rounded-b-xl border-t bg-gradient-to-r from-[#F4FCF7] to-[#E5FCF6] px-3 dark:from-dark-700 dark:to-dark-700">
							<div class="flex items-center">
								<span>Credits gained past month:</span>
								<Tag v-tooltip.top="'Credits are assigned once a day for probes that have been up for at least 20 hours.'" class="ml-2 flex items-center border bg-surface-0 !text-sm" severity="success">
									<nuxt-icon class="mr-2" name="coin"/>+{{ totalCredits.toLocaleString('en-US') }}
								</Tag>
							</div>
							<div class="ml-8">
								<span>Number of probes:</span>
								<Tag class="ml-2 flex items-center border bg-surface-0 !text-sm" severity="success">{{ probesCount }}</Tag>
							</div>
							<Button
								class="ml-auto"
								severity="secondary"
								outlined
								label="Start a probe"
								icon="pi pi-question-circle"
								@click="startProbeDialog = true"
							/>
						</div>
					</template>
				</DataTable>
			</div>
			<div class="hidden max-md:block">
				<div class="rounded-xl border bg-surface-0 dark:bg-dark-800">
					<div class="flex h-10 items-center border-b px-4 font-bold text-bluegray-700 dark:text-dark-0">
						List of probes
					</div>
					<AsyncBlock :status="loading ? 'pending' : 'success'">
						<div class="px-4 pb-3 pt-1">
							<div v-if="probes.length">
								<div v-for="probe in probes" :key="probe.id" class="probe box-content block pb-2 pt-4">
									<NuxtLink :to="`/probes/${probe.id}`" @click="openProbeDetails(probe.id)">
										<div class="mb-6 grid grid-cols-[auto_1fr] grid-rows-[auto_auto] gap-x-3">
											<BigIcon class="col-span-1 row-span-2" :name="probe.hardwareDevice ? 'gp' : 'docker'" border :status="probe.status"/>
											<div class="col-start-2 col-end-3 flex items-center font-bold">
												<p>{{ probe.name || probe.city }}</p>
											</div>
											<p class="col-start-2 col-end-3 max-w-full overflow-hidden text-ellipsis text-[13px] text-bluegray-400">{{ probe.ip }}</p>
										</div>
										<div>
											<div class="mb-2 flex items-center text-nowrap">
												<span class="mr-6 font-semibold">Location:</span>
												<span class="ml-auto mr-2 flex items-center justify-end">
													{{ probe.city }}, {{ probe.country }}
												</span>
												<CountryFlag :country="probe.country" size="small"/>
											</div>
											<div class="mb-2 flex items-center justify-between text-nowrap">
												<span class="mr-6 font-semibold">Version:</span>
												<span>{{ probe.version }}</span>
											</div>
											<div ref="mobileTagsWrapperRef">
												<TagsList :tags="getAllTags(probe)" :number-of-tags-to-show="numberOfTagsToShowMobile"/>
											</div>
										</div>
									</NuxtLink>
								</div>
							</div>
							<div class="rounded-xl bg-gradient-to-r from-[#F4FCF7] to-[#E5FCF6] p-3 dark:from-dark-700 dark:to-dark-700">
								<div class="flex items-center justify-between">
									<span class="text-xs font-bold">Credits gained past month:</span>
									<Tag v-tooltip.top="'Credits are assigned once a day for probes that have been up for at least 20 hours.'" class="flex items-center border bg-surface-0 !text-sm" severity="success">
										<nuxt-icon class="mr-2" name="coin"/>+{{ totalCredits.toLocaleString('en-US') }}
									</Tag>
								</div>
								<div class="mt-2 flex items-center justify-between">
									<span class="text-xs font-bold">Number of probes:</span>
									<Tag class="ml-2 flex items-center border bg-surface-0 !text-sm" severity="success">{{ probesCount }}</Tag>
								</div>
								<Button
									class="mt-2 w-full"
									severity="secondary"
									outlined
									label="Start a probe"
									icon="pi pi-question-circle"
									@click="startProbeDialog = true"
								/>
							</div>
						</div>
					</AsyncBlock>
				</div>
			</div>
			<Paginator
				v-if="probes.length !== probesCount"
				class="mt-7"
				:first="first"
				:rows="itemsPerPage"
				:total-records="probesCount"
				template="PrevPageLink PageLinks NextPageLink"
				@page="page = $event.page"
			/>
		</div>
		<div v-else class="flex grow flex-col overflow-hidden rounded-xl border bg-surface-0 dark:bg-dark-800">
			<p class="flex border-b px-6 py-3 font-bold text-bluegray-700 dark:text-dark-0">List of probes</p>
			<div class="m-6 flex grow flex-col items-center justify-center rounded-xl bg-surface-50 p-6 text-center dark:bg-dark-600">
				<img class="mx-auto w-24" src="~/assets/images/hw-probe.png" alt="Hardware probe">
				<p class="mt-6 leading-tight">
					<b>You don't have any probes yet.</b><br><br>
					Get started in 30 seconds by running a Docker container with our probe.  It's free and simple.<br>
					Each probe will generate additional credits for you to use. Nowhere to run the container?<br>
					<NuxtLink class="font-semibold text-primary hover:underline" to="https://github.com/sponsors/jsdelivr">Become a GitHub Sponsor</NuxtLink> and get a hardware ARM powered probe delivered to you.<br>
					Plug-and-play simplicity guaranteed.
				</p>
				<Button class="mt-6" label="Start a probe" @click="startProbeDialog = true"/>
			</div>
		</div>
		<div v-if="probeDetails">
			<NuxtPage
				:credits="credits[probeDetails!.id] || 0"
				:probe="probeDetails"
				:gmaps-loaded="gmapsLoaded"
				@save="loadLazyData"
				@hide="onHide"
				@delete="onDelete"
			/>
		</div>
		<GPDialog
			v-model:visible="startProbeDialog"
			header="Start a probe"
		>
			<StartProbe/>
		</GPDialog>
		<GPDialog
			v-model:visible="adoptProbeDialog"
			header="Adopt a probe"
			content-class="!p-0"
		>
			<AdoptProbe @cancel="adoptProbeDialog = false" @adopted="loadLazyData"/>
		</GPDialog>
	</div>
</template>

<script setup lang="ts">
	import { aggregate, readItem, readItems } from '@directus/sdk';
	import CountryFlag from 'vue-country-flag-next';
	import { useGoogleMaps } from '~/composables/maps';
	import { usePagination } from '~/composables/pagination';
	import { useAuth } from '~/store/auth';
	import { sendErrorToast } from '~/utils/send-toast';

	const auth = useAuth();
	const user = auth.getUser as User;

	const config = useRuntimeConfig();

	const { $directus } = useNuxtApp();
	const route = useRoute();

	const itemsPerPage = config.public.itemsPerTablePage;
	const startProbeDialog = ref(false);
	const adoptProbeDialog = ref(false);
	const loading = ref(false);
	const probesCount = ref(0);
	const probes = ref<Probe[]>([]);
	const credits = ref<Record<string, number>>({});
	const { page, first } = usePagination({ itemsPerPage, active: () => !route.params.id });
	const totalCredits = ref(0);
	const gmapsLoaded = ref(false);

	useHead(() => {
		return {
			title: 'Probes -',
		};
	});

	useGoogleMaps(() => { gmapsLoaded.value = true; });

	const loadLazyData = async () => {
		loading.value = true;

		try {
			const [ adoptedProbes, [{ count }], creditsAdditions ] = await Promise.all([
				$directus.request(readItems('gp_adopted_probes', {
					filter: { userId: { _eq: user.id } },
					sort: [ 'status', 'name' ],
					offset: first.value,
					limit: itemsPerPage,
				})),
				$directus.request<[{count: number}]>(aggregate('gp_adopted_probes', {
					query: { filter: { userId: { _eq: user.id } } },
					aggregate: { count: '*' },
				})),
				$directus.request<[{ sum: { amount: number }, adopted_probe: number}]>(aggregate('gp_credits_additions', {
					query: { filter: { github_id: { _eq: user.external_identifier || 'admin' }, adopted_probe: { _null: false }, date_created: { _gte: '$NOW(-30 day)' } } },
					groupBy: [ 'adopted_probe' ],
					aggregate: { sum: 'amount' },
				})),
			]);

			const creditsByProbeId: Record<number, number> = {};

			totalCredits.value = 0;

			for (const addition of creditsAdditions) {
				const { adopted_probe: adoptedProbe, sum: { amount } } = addition;

				totalCredits.value += amount;
				creditsByProbeId[adoptedProbe] = creditsByProbeId[adoptedProbe] ? creditsByProbeId[adoptedProbe] + amount : amount;
			}

			credits.value = creditsByProbeId;
			probes.value = adoptedProbes;
			probesCount.value = count;
		} catch (e) {
			sendErrorToast(e);
		}

		loading.value = false;
	};

	// PROBES LIST

	onMounted(async () => {
		await loadLazyData();
	});

	// Update list data only when navigating list to list (e.g. page 1 to page 2), not list to details or details to list.
	watch([ () => page.value, () => route.params.id ], async ([ newPage, newId ], [ oldPage, oldId ]) => {
		if (newPage !== oldPage && !oldId && !newId) {
			await loadLazyData();
		}
	});

	const getAllTags = (probe: Probe) => {
		const systemTags = probe.systemTags;
		const userTags = probe.tags.map(({ prefix, value }) => `u-${prefix}-${value}`);
		const allTags = userTags.concat(systemTags);
		return allTags;
	};

	// Calculate the number of tags to show, based on the expected average tag width <= 200px (in two rows).
	const tagsHeaderContentRef = ref(null);
	const tagsHeaderRef = useParentElement(tagsHeaderContentRef);
	const mobileTagsWrapperRef = ref(null);

	const getNumberOfTagsToShow = (elem: Ref<HTMLElement | SVGElement | null | undefined>) => {
		const { width } = useElementSize(elem);
		return computed(() => Math.max(Math.floor(width.value / 100), 1));
	};

	const numberOfTagsToShow = getNumberOfTagsToShow(tagsHeaderRef);
	const numberOfTagsToShowMobile = getNumberOfTagsToShow(mobileTagsWrapperRef);

	// Calculate the column widths based on the table size.
	const dataTableRef = ref(null);
	const { width: dataTableWidth } = useElementSize(dataTableRef);
	const columnWidths = computed(() => {
		const columns = [
			{ width: 0, min: 96 * 4, max: 96 * 4 * 1.375, preferred: .25 },
			{ width: 0, min: 96 * 4, max: 96 * 4 * 1.375, preferred: .25 },
			{ width: 0, min: 174, preferred: .5 },
		];

		columns.forEach((column) => {
			column.width = Math.min(
				Math.max(Math.floor(dataTableWidth.value * column.preferred), column.min || -Infinity),
				column.max || Infinity,
			);
		});

		const usedWidth = columns.reduce((total, column) => total + column.width, 0);
		columns.at(-1)!.width += dataTableWidth.value - usedWidth;

		return {
			name: columns[0].width,
			location: columns[1].width,
			tags: columns[2].width,
		};
	});

	// PROBE DETAILS
	onMounted(async () => {
		const probeId = route.params.id as string;

		if (probeId) {
			await loadProbeData(probeId);
		}
	});

	watch(() => route.path, async () => {
		const probeId = route.params.id as string;

		if (probeId) {
			await loadProbeData(probeId);
		} else {
			probeDetails.value = null;
		}
	});

	const loadProbeData = async (id: string) => {
		try {
			const probe = await $directus.request(readItem('gp_adopted_probes', id));

			probeDetails.value = probe;
		} catch (e) {
			const response = (e as { response?: Response } | undefined)?.response;

			if (response?.status === 403) {
				return navigateTo('/probes');
			}

			sendErrorToast(e);
		}
	};

	const probeDetails = ref<Probe | null>(null);

	const openProbeDetails = (id: string) => {
		const probe = probes.value.find(probe => probe.id === id);

		if (probe) {
			probeDetails.value = probe;
		}
	};

	const onHide = async () => {
		await navigateTo(page.value ? `/probes?page=${page.value + 1}` : '/probes');
	};

	const onDelete = async () => {
		// Go to prev page if that is last item.
		if (probes.value.length === 1 && page.value) {
			page.value--;
		}

		await loadLazyData();
	};
</script>

<style scoped>
	@media (max-width: 767.99px) {
		.probe + .probe {
			@apply border-t;
		}
	}
</style>
