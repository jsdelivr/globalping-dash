<template>
	<div class="min-h-full p-4 sm:p-6" :class="{'md:min-w-[940px]': probes?.length}">
		<div class="mb-4 flex">
			<h1 class="page-title">Probes</h1>

			<Button
				v-if="selectedProbes.length"
				class="ml-auto max-md:hidden"
				label="Delete selected"
				severity="danger"
				icon="pi pi-trash"
				outlined
				@click="deleteProbesDialog = true"
			/>
			<span class="ml-auto max-md:inline-block" :class="{ 'hidden': selectedProbes.length }"/>

			<Button class="ml-2" @click="adoptProbeDialog = true">
				<nuxt-icon class="pi" name="capture"/>
				<span class="font-bold">Adopt a probe</span>
			</Button>
		</div>
		<div v-if="hasAnyProbes || loading">
			<div class="max-md:hidden">
				<DataTable
					ref="dataTableRef"
					v-model:selection="selectedProbes"
					:value="probes"
					lazy
					:rows="itemsPerPage"
					data-key="id"
					:total-records="paginatedRecords"
					sort-mode="single"
					:sort-field="filter.by"
					:sort-order="filter.desc ? -1 : 1"
					:loading="firstLoading"
					:row-class="() => 'cursor-pointer hover:bg-surface-50 dark:hover:bg-dark-700'"
					:pt="{footer: '!pt-0 border-t-0'}"
					:pt-options="{ mergeProps: true }"
					@sort="onSortChange"
				>
					<template #header>
						<div class="flex w-full items-center">
							<h3 class="px-2">List of probes</h3>

							<div class="ml-auto flex h-9 items-stretch gap-x-4 self-end font-normal">
								<span class="flex items-center font-bold">Status:</span>
								<Select
									v-model="filter.status"
									:options="STATUS_CODES"
									:pt="{ listContainer: { class: '!max-h-64' } }"
									option-label="code"
									class="min-w-64"
									@change="onStatusChange"
								>
									<template #option="{option}">
										<span class="flex h-full items-center gap-2">
											<span
												:class="{
													'font-bold text-bluegray-900 dark:text-white': option === filter.status,
													'text-bluegray-400': option.code !== filter.status
												}">
												{{ STATUS_MAP[option].name }}
											</span>
											<Tag
												class="-my-0.5"
												:class="{
													'bg-primary text-white dark:bg-white dark:text-bluegray-900 ': option === filter.status,
													'border border-surface-300 bg-surface-0 text-bluegray-900 dark:border-dark-600 dark:bg-dark-800 dark:text-surface-0': option !== filter.status
												}">
												{{ statusCounts[option] }}
											</Tag>
										</span>
									</template>

									<template #value="{value}">
										<span class="flex h-full items-center gap-2">
											<span class="text-bluegray-400">{{ STATUS_MAP[value].name }}</span>
											<Tag class="-my-1 border ">{{ statusCounts[value] }}</Tag>
										</span>
									</template>
								</Select>
								<InputGroup class="!w-auto">
									<IconField>
										<InputIcon class="pi pi-search"/>
										<InputText v-model="searchInput" class="m-0 h-full min-w-[280px]" placeholder="Filter by name, location, or tags" @input="onFilterChangeDebounced"/>
									</IconField>
								</InputGroup>
							</div>
						</div>
					</template>

					<Column :selection-mode="firstLoading ? undefined : 'multiple'" class="px-3"/>

					<Column field="name" :sortable="true" class="w-96" body-class="!p-0 h-16" :style="{ width: `${columnWidths.name}px` }">
						<template #header>
							Name <i v-tooltip.top="'Private name of the probe, visible only to you'" class="pi pi-info-circle"/>
						</template>

						<template #body="slotProps">
							<AsyncCell :loading="loading">
								<NuxtLink :to="`/probes/${slotProps.data.id}`" class="flex h-full items-center">
									<div class="grid grid-cols-[auto_1fr] grid-rows-[auto_auto] gap-x-3 px-2 py-3">
										<BigProbeIcon class="col-span-1 row-span-2" :probe="slotProps.data" border/>
										<p class="col-start-2 col-end-3 flex items-center font-bold">{{ slotProps.data.name || slotProps.data.city }}</p>
										<p class="col-start-2 col-end-3 row-start-2 row-end-3 text-[13px] text-bluegray-900 dark:text-bluegray-400">{{ slotProps.data.ip }}</p>
									</div>
								</NuxtLink>
							</AsyncCell>
						</template>
					</Column>

					<Column field="location" :sortable="true" class="w-96" body-class="!p-0 h-16" :style="{ width: `${columnWidths.location}px` }">
						<template #header>
							Location <i v-tooltip.top="'Current probe location. If the auto-detected value is wrong, you can adjust it in probe details.'" class="pi pi-info-circle"/>
						</template>

						<template #body="slotProps">
							<AsyncCell :loading="loading">
								<NuxtLink :to="`/probes/${slotProps.data.id}`" class="flex h-full items-center">
									<div class="px-2 py-3">
										<div class="mb-1 flex items-center">
											<CountryFlag :country="slotProps.data.country" size="small"/>
											<p class="ml-2 font-bold">{{ slotProps.data.city }}, {{ slotProps.data.country }}</p>
										</div>
										<p>{{ slotProps.data.network }}, AS{{ slotProps.data.asn }}</p>
									</div>
								</NuxtLink>
							</AsyncCell>
						</template>
					</Column>

					<Column field="tags" :sortable="true" body-class="!py-0.5 h-16" :style="{ width: `${columnWidths.tags}px` }">
						<template #header>
							Tags <i ref="desktopTagsHeaderContentRef" v-tooltip.top="'Public tags that can be used to target the probe in measurements.'" class="pi pi-info-circle"/>
						</template>

						<template #body="slotProps">
							<AsyncCell :loading="loading">
								<NuxtLink :to="`/probes/${slotProps.data.id}`" class="flex h-full items-center">
									<TagsList :tags="getAllTags(slotProps.data)" :wrapper="desktopTagsWrapperRef"/>
								</NuxtLink>
							</AsyncCell>
						</template>
					</Column>
					<template #footer>
						<div class="flex h-14 items-center justify-between rounded-b-xl border-t bg-gradient-to-r from-[#F4FCF7] to-[#E5FCF6] px-3 dark:from-dark-700 dark:to-dark-700">
							<div class="flex items-center">
								<span>Credits gained past month:</span>
								<Tag v-tooltip.top="'Credits are assigned once a day for probes that have been up for at least 20 hours.'" class="ml-2 flex items-center border bg-surface-0 !text-sm" severity="success">
									<nuxt-icon class="mr-2" name="coin"/>+{{ totalCredits.toLocaleString('en-US') }}
								</Tag>
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

					<template #empty><div class="p-6 text-center">No probes match the filter.</div></template>
				</DataTable>
			</div>
			<div class="hidden max-md:block">
				<div class="rounded-xl border bg-surface-0 dark:bg-dark-800">
					<div class="flex h-10 items-center justify-between border-b px-4 font-bold text-bluegray-700 dark:text-dark-0">
						List of probes

						<Button class="relative" severity="secondary" size="small" text @click="mobileFiltersRef.toggle($event)">
							<i class="pi pi-sliders-h"/>
							<i v-if="anyFilterApplied" class="pi pi-circle-fill absolute right-2 top-1 text-[0.4rem] text-primary"/>
						</Button>

						<Popover
							ref="mobileFiltersRef"
							class="!left-1/2 w-[95%] !-translate-x-1/2 !transform p-6 [&>*]:border-none"
							role="dialog">
							<FilterSettings
								:status-counts="statusCounts as Record<StatusCode, number>"
								:filter="filter"
								@apply="(newFilter) => {mobileFiltersRef.toggle(); onBatchChange(newFilter)}"
								@cancel="mobileFiltersRef.hide()"
							/>
						</Popover>
					</div>

					<AsyncBlock :status="loading ? 'pending' : 'success'">
						<div class="px-4 pb-3 pt-1">
							<div v-if="probes.length">
								<div v-for="probe in probes" :key="probe.id" class="probe box-content block pb-2 pt-4">
									<NuxtLink :to="`/probes/${probe.id}`">
										<div class="mb-6 grid grid-cols-[auto_1fr] grid-rows-[auto_auto] gap-x-3">
											<BigProbeIcon class="col-span-1 row-span-2" :probe="probe" border/>
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
											<div>
												<TagsList :tags="getAllTags(probe)"/>
											</div>
										</div>
									</NuxtLink>
								</div>
							</div>
							<div v-else class="py-12 text-center">
								No probes match the filter.
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
									<Tag class="ml-2 flex items-center border bg-surface-0 !text-sm" severity="success">{{ statusCounts[filter.status] }}</Tag>
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
				v-if="displayPagination"
				class="mt-6"
				:first="first"
				:rows="itemsPerPage"
				:total-records="paginatedRecords"
				:page-link-size="pageLinkSize"
				:template="template"
				@page="page = $event.page"
			/>
		</div>
		<div v-else class="flex grow flex-col overflow-hidden rounded-xl border bg-surface-0 dark:bg-dark-800">
			<p class="flex border-b px-6 py-3 font-bold text-bluegray-700 dark:text-dark-0">List of probes</p>
			<div class="m-6 flex grow flex-col items-center justify-center rounded-xl bg-surface-50 p-4 text-center sm:p-6 dark:bg-dark-600">
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

		<GPDialog
			v-model:visible="startProbeDialog"
			view-name="start-a-probe"
			header="Start a probe"
			size="large"
		>
			<StartProbe/>
		</GPDialog>
		<GPDialog
			v-model:visible="adoptProbeDialog"
			header="Adopt a probe"
			content-class="!p-0"
			size="large"
		>
			<AdoptProbe @cancel="adoptProbeDialog = false" @adopted="refresh"/>
		</GPDialog>
		<GPDialog
			v-model:visible="deleteProbesDialog"
			:header="`Delete ${pluralize('probe', selectedProbes.length)}`"
		>
			<DeleteProbes :probes="selectedProbes" @cancel="deleteProbesDialog = false" @success="onDeleteSuccess"/>
		</GPDialog>
		<GPDialog
			view-name="update-a-probe"
			header="Update a probe"
			size="large"
		>
			<UpdateProbe/>
		</GPDialog>
	</div>
</template>

<script setup lang="ts">
	import { aggregate, readItems } from '@directus/sdk';
	import debounce from 'lodash/debounce';
	import CountryFlag from 'vue-country-flag-next';
	import BigProbeIcon from '~/components/BigProbeIcon.vue';
	import FilterSettings from '~/components/FilterSettings.vue';
	import { useGoogleMaps } from '~/composables/maps';
	import { usePagination } from '~/composables/pagination';
	import { useErrorToast } from '~/composables/useErrorToast';
	import { type StatusCode, useProbeFilters, STATUS_MAP } from '~/composables/useProbeFilters';
	import { useUserFilter } from '~/composables/useUserFilter';
	import { pluralize } from '~/utils/pluralize';

	const config = useRuntimeConfig();

	const router = useRouter();
	const route = useRoute();
	const { $directus } = useNuxtApp();

	const itemsPerPage = ref(config.public.itemsPerTablePage);
	const startProbeDialog = ref(false);
	const adoptProbeDialog = ref(false);
	const mobileFiltersRef = ref();
	const firstLoading = ref(true);
	const hasAnyProbes = ref(false);
	const active = ref(true);
	const { page, first, pageLinkSize, template } = usePagination({ itemsPerPage, active });
	const gmapsLoaded = ref(false);
	const selectedProbes = ref<Probe[]>([]);
	const deleteProbesDialog = ref(false);
	const paginatedRecords = ref(0);

	const STATUS_CODES = Object.keys(STATUS_MAP) as StatusCode[];

	const { getUserFilter } = useUserFilter();

	useHead(() => {
		return {
			title: 'Probes -',
		};
	});

	useGoogleMaps(() => { gmapsLoaded.value = true; });

	const {
		filter,
		anyFilterApplied,
		onSortChange,
		onFilterChange,
		onStatusChange,
		onBatchChange,
		getSortSettings,
		getCurrentFilter,
	} = useProbeFilters();

	const filterDeps = computed(() => { return { ...filter.value }; });

	const { data: totalCredits, error: creditError } = await useLazyAsyncData(() => $directus.request<[{ sum: { amount: number } }]>(aggregate('gp_credits_additions', {
		query: {
			filter: {
				...getUserFilter('github_id'),
				reason: { _eq: 'adopted_probe' },
				date_created: { _gte: '$NOW(-30 day)' },
			},
		},
		aggregate: { sum: 'amount' },
	})), { default: () => 0, transform: data => data[0]?.sum?.amount ?? 0 });

	const { data: probes, pending: loading, error: probeError, refresh: refreshProbes } = await useLazyAsyncData(() => $directus.request<Probe[]>(readItems('gp_probes', {
		filter: getCurrentFilter(true),
		sort: getSortSettings() as any, // the directus QuerySort type does not include the count(...) versions of fields, leading to a TS error.
		offset: first.value,
		limit: itemsPerPage.value,
	})), { watch: [ page, filterDeps, first, itemsPerPage ], immediate: true, default: () => [] });

	const { data: statusCounts, error: statusCntError, refresh: refreshStatusCounts } = await useLazyAsyncData(() => $directus.request<[{ count: number; status: Status; isOutdated: boolean }]>(aggregate('gp_probes', {
		query: {
			filter: getCurrentFilter(),
			groupBy: [ 'status', 'isOutdated' ],
		},
		aggregate: { count: '*' },
	})), {
		watch: [ filterDeps ],
		default: () => Object.fromEntries(STATUS_CODES.map(status => [ status, 0 ])),
		transform: (data) => {
			const counts = Object.fromEntries(STATUS_CODES.map(status => [ status, 0 ]));

			STATUS_CODES.forEach((code) => {
				counts[code] = data.reduce((sum, status) => {
					return STATUS_MAP[code].options.includes(status.status) && (status.isOutdated || !STATUS_MAP[code].outdatedOnly)
						? sum + status.count
						: sum;
				}, 0);
			});

			return counts;
		},
	});

	useErrorToast(creditError, probeError, statusCntError);

	const refresh = () => Promise.all([ refreshProbes(), refreshStatusCounts() ]);

	watch([ probes, loading ], async ([ adoptedProbes, isLoading ]) => {
		if (isLoading) {
			return;
		}

		if (!adoptedProbes.length && page.value) {
			try {
				await router.replace({
					query: {
						...route.query,
						page: 1,
					},
				});
			} catch (error) {
				console.error(error);
				await router.replace('/probes'); // reset all filters
			}
		}
	}, { deep: true, immediate: true });

	watch(loading, (isLoading) => {
		if (isLoading) {
			selectedProbes.value = [];
		} else {
			firstLoading.value = false;
		}
	}, { immediate: true });

	watch(statusCounts, (newStatusCounts) => {
		paginatedRecords.value = newStatusCounts[filter.value.status];
		hasAnyProbes.value = hasAnyProbes.value || !!newStatusCounts['all'];
	}, { deep: true, immediate: true });

	const displayPagination = computed(() => probes.value.length !== statusCounts.value[filter.value.status]);
	const onFilterChangeDebounced = debounce(() => onFilterChange(searchInput.value), 500);
	const searchInput = ref(filter.value.search);

	// PROBES LIST
	onMounted(async () => {
		if (!route.query.limit) {
			itemsPerPage.value = Math.min(Math.max(Math.floor((window.innerHeight - 420) / 65), 5), 15);
		}

		const [{ count }] = await $directus.request<[{ count: number }]>(aggregate('gp_probes', {
			query: {
				filter: getUserFilter('userId'),
			},
			aggregate: { count: '*' },
		}));

		if (count) {
			hasAnyProbes.value = true;
		}
	});

	const getAllTags = (probe: Probe) => {
		const systemTags = probe.systemTags;
		const userTags = probe.tags.map(({ prefix, value, format }) => format === 'v1' ? `u-${prefix}-${value}` : `u-${prefix}:${value}`);
		const allTags = userTags.concat(systemTags);
		return allTags;
	};

	// Calculate the number of tags to show, based on the expected average tag width <= 200px (in two rows).
	const desktopTagsHeaderContentRef = ref(null);
	const desktopTagsWrapperRef = useParentElement(desktopTagsHeaderContentRef);

	// Calculate the column widths based on the table size.
	const dataTableRef = ref(null);
	const { width: dataTableWidth } = useElementSize(dataTableRef);
	const columnWidths = computed(() => {
		const columns = [
			{ width: 0, min: 32, max: 32, preferred: 0 }, // padding
			{ width: 0, min: 44, max: 44, preferred: 0 }, // checkbox
			{ width: 0, min: 96 * 4, max: 96 * 4 * 1.375, preferred: .25 }, // name
			{ width: 0, min: 96 * 4, max: 96 * 4 * 1.375, preferred: .25 }, // location
			{ width: 0, min: 174, preferred: .5 }, // tags
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
			name: columns[2].width,
			location: columns[3].width,
			tags: columns[4].width,
		};
	});

	const onDeleteSuccess = () => {
		deleteProbesDialog.value = false;
		refresh();
	};

	onBeforeUnmount(() => {
		onFilterChangeDebounced.cancel();
	});

	onBeforeRouteLeave(() => { active.value = false; });
</script>

<style scoped>
	@media (max-width: 767.99px) {
		.probe + .probe {
			@apply border-t;
		}
	}
</style>
