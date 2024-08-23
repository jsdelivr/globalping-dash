<template>
	<!-- TODO: P1: @MartinKolarik - review including all texts after the design update. -->
	<div class="flex min-h-full flex-col p-6" :class="{'min-w-[1024px]': probes?.length}">
		<div class="mb-6 flex">
			<h1 class="col-span-2 text-2xl font-bold">Probes</h1>
			<Button class="ml-auto" @click="adoptProbeDialog = true">
				<nuxt-icon class="pi" name="capture"/>
				<span class="font-bold">Adopt a probe</span>
			</Button>
		</div>
		<div v-if="probes.length || loading">
			<DataTable
				:value="probes"
				lazy
				:first="first"
				:rows="itemsPerPage"
				data-key="id"
				:total-records="probesCount"
				:loading="loading"
				table-class="table-fixed"
				:row-class="() => 'cursor-pointer hover:bg-surface-50 dark:hover:bg-dark-700'"
				@row-click="openprobeDetails"
			>
				<template #header>
					<h3>List of probes</h3>
				</template>
				<Column header="Name" class="w-1/4" body-class="!p-0">
					<template #body="slotProps">
						<ProbeHeader
							:name="slotProps.data.name || slotProps.data.city"
							:ip="slotProps.data.ip"
							:status="slotProps.data.status"
							:hardware-device="!!slotProps.data.hardwareDevice"
							ip-css="text-bluegray-900 dark:text-bluegray-400"
							class="px-2 py-3"
						/>
					</template>
				</Column>
				<Column header="Location" class="w-1/4" body-class="!p-0">
					<template #body="slotProps">
						<div class="px-2 py-3">
							<div class="mb-1 flex items-center">
								<CountryFlag :country="slotProps.data.country" size="small"/>
								<p class="ml-2 font-bold">{{ slotProps.data.city }}, {{ slotProps.data.country }}</p>
							</div>
							<p>{{ slotProps.data.network }}, {{ slotProps.data.asn }}</p>
						</div>
					</template>
				</Column>
				<Column header="Tags" class="w-[34%]" body-class="!p-0">
					<template #body="slotProps">
						<div class="px-2 py-4">
							<Tag v-if="slotProps.data.tags[0]" :key="slotProps.data.tags[0]" class="my-0.5 mr-1 flex bg-surface-0 py-0.5 font-normal dark:bg-dark-800" severity="secondary" :value="`${slotProps.data.tags[0].prefix}-${slotProps.data.tags[0].value}`"/>
							<Tag v-if="slotProps.data.tags[1]" :key="slotProps.data.tags[1]" class="my-0.5 mr-1 flex bg-surface-0 py-0.5 font-normal dark:bg-dark-800" severity="secondary" :value="`${slotProps.data.tags[1].prefix}-${slotProps.data.tags[1].value}`"/>
							<Tag v-if="slotProps.data.tags.length > 2" key="other" class="my-0.5 mr-1 flex bg-surface-0 py-0.5 font-normal dark:bg-dark-800" severity="secondary" :value="`+${slotProps.data.tags.length - 2}`"/>
						</div>
					</template>
				</Column>
				<Column header="Credits past month" class="w-[13%]" body-class="!p-0">
					<template #body="slotProps">
						<div class="px-2 py-4">
							<Tag class="flex items-center !text-sm" severity="success" value="Success">
								<nuxt-icon class="mr-1 mt-0.5" name="coin"/>+{{ credits[slotProps.data.id] || 0 }}
							</Tag>
						</div>
					</template>
				</Column>
				<Column expander class="w-[3%]" body-class="!p-0">
					<template #body="">
						<div class="px-2 py-4">
							<i class="pi pi-chevron-right"/>
						</div>
					</template>
				</Column>
				<template v-if="!loading" #footer>
					<div class="flex items-center">
						<div class="w-3/4">
							<Button
								class="mt-2"
								severity="secondary"
								outlined
								label="Start a probe"
								icon="pi pi-question-circle"
								@click="startProbeDialog = true"
							/>
						</div>
						<div class="w-[10%] pt-4">Total</div>
						<div class="pt-4">
							<Tag class="flex items-center !text-sm" severity="success" value="Success">
								<nuxt-icon class="mr-1 mt-0.5" name="coin"/>+{{ totalCredits }}
							</Tag>
						</div>
					</div>
				</template>
			</DataTable>
			<Paginator
				v-if="probes.length !== probesCount"
				class="mt-9"
				:first="first"
				:rows="itemsPerPage"
				:total-records="probesCount"
				template="PrevPageLink PageLinks NextPageLink"
				@page="onPage($event)"
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
		<Dialog
			v-model:visible="probeDetailsDialog"
			position="top"
			class="mt-8 min-w-[700px] max-md:min-w-[95%]"
			modal
			dismissable-mask
			:draggable="false"
			header="Probe details"
			content-class="!p-0"
		>
			<ProbeDetails
				:credits="credits[probeDetails!.id] || 0"
				:probe="probeDetails!"
				@cancel="probeDetailsDialog = false"
				@save="handleSave"
			/>
		</Dialog>
		<Dialog
			v-model:visible="startProbeDialog"
			position="top"
			class="min-w-[700px] max-md:min-w-[95%]"
			modal
			dismissable-mask
			:draggable="false"
			header="Start a probe"
		>
			<StartProbe/>
		</Dialog>
		<Dialog
			v-model:visible="adoptProbeDialog"
			position="top"
			class="min-w-[700px] max-md:min-w-[95%]"
			modal
			dismissable-mask
			:draggable="false"
			header="Adopt a probe"
			content-class="!p-0"
		>
			<AdoptProbe @cancel="adoptProbeDialog = false" @adopted="loadLazyData"/>
		</Dialog>
	</div>
</template>

<script setup lang="ts">
	import { aggregate, readItems, updateItem } from '@directus/sdk';
	import memoize from 'lodash/memoize';
	import type { DataTablePageEvent, DataTableRowClickEvent } from 'primevue/datatable';
	import type { PageState } from 'primevue/paginator';
	import CountryFlag from 'vue-country-flag-next';
	import { useAuth } from '~/store/auth';
	import { sendErrorToast } from '~/utils/send-toast';

	const config = useRuntimeConfig();

	useHead({
		title: 'Probes -',
		script: [{
			src: `https://maps.googleapis.com/maps/api/js?key=${config.public.googleMapsKey}&loading=async`,
			async: true,
			defer: true,
		}],
	});

	const { $directus } = useNuxtApp();

	const itemsPerPage = config.public.itemsPerTablePage;
	const startProbeDialog = ref(false);
	const adoptProbeDialog = ref(false);
	const loading = ref(false);
	const probesCount = ref(0);
	const probes = ref<Probe[]>([]);
	const credits = ref<Record<string, number>>({});
	const first = ref(0);
	const lazyParams = ref<Partial<DataTablePageEvent>>({});
	const totalCredits = ref(0);

	const loadLazyData = async (event?: PageState) => {
		loading.value = true;
		lazyParams.value = { ...lazyParams.value, first: event?.first || first.value };

		try {
			const [ adoptedProbes, [{ count }], creditsAdditions ] = await Promise.all([
				$directus.request(readItems('gp_adopted_probes', {
					filter: { userId: { _eq: user.id } },
					offset: lazyParams.value.first,
					limit: itemsPerPage,
				})),
				$directus.request<[{count: number}]>(aggregate('gp_adopted_probes', {
					query: { filter: { userId: { _eq: user.id } } },
					aggregate: { count: '*' },
				})),
				$directus.request(readItems('gp_credits_additions', {
					filter: {
						github_id: { _eq: user.external_identifier || 'admin' },
						// @ts-ignore
						date_created: { _gte: '$NOW(-1 month)' },
					},
				})),
			]);

			const creditsByProbeId: Record<number, number> = {};

			for (const addition of creditsAdditions) {
				const { adopted_probe: adoptedProbe, amount } = addition;

				if (!adoptedProbe) {
					continue;
				}

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

	onMounted(() => {
		loading.value = true;

		lazyParams.value = {
			first: 0,
			rows: itemsPerPage,
		};

		loadLazyData();
	});

	const onPage = (event: PageState) => {
		lazyParams.value = event;
		loadLazyData(event);
	};

	// PROBE DETAILS

	const probeDetails = ref<Probe | null>(null);

	const probeDetailsDialog = ref(false);

	const openprobeDetails = (event: DataTableRowClickEvent) => {
		const probe = probes.value.find(probe => probe.id === event.data.id);

		if (probe) {
			probeDetails.value = { ...probe };
			probeDetailsDialog.value = true;
		}
	};

	const handleSave = async () => {
		await loadLazyData();
		probeDetailsDialog.value = false;
	};

	//  EDIT NAME

	const isEditingName = ref<boolean>(false);
	const name = ref<string>('');

	const editName = (currentName: string) => {
		isEditingName.value = true;
		name.value = currentName;
	};

	const saveName = async (id: number) => {
		isEditingName.value = false;
		await updateProbe(id, { name: name.value });
	};

	const cancelName = () => {
		name.value = '';
		isEditingName.value = false;
	};

	// EDIT CITY

	const isEditingCity = ref<boolean>(false);
	const city = ref<string>('');

	const editCity = (currentCity: string) => {
		isEditingCity.value = true;
		city.value = currentCity;
	};

	const saveCity = async (id: number) => {
		isEditingCity.value = false;
		await updateProbe(id, { city: city.value });
	};

	const cancelCity = () => {
		city.value = '';
		isEditingCity.value = false;
	};

	// EDIT TAGS

	const auth = useAuth();
	const user = auth.getUser as User;

	const isEditingTags = ref<boolean>(false);
	const tags = ref<{ uPrefix: string, value: string }[]>([]);

	const uPrefixes = [ user.github_username, ...user.github_organizations ].map(value => `u-${value}`);

	const editTags = (currentTags: Probe['tags']) => {
		currentTags = currentTags || [];
		isEditingTags.value = true;

		tags.value = currentTags.map(({ prefix, value }) => ({
			uPrefix: `u-${prefix}`,
			value,
		}));
	};

	const addTag = () => {
		tags.value.push({ uPrefix: '', value: '' });
	};

	const removeTag = (index: number) => {
		tags.value?.splice(index, 1);
	};

	const saveTags = async (id: number) => {
		isEditingTags.value = false;

		await updateProbe(id, { tags: tags.value.map(({ uPrefix, value }) => ({
			prefix: uPrefix.replace('u-', ''),
			value,
		})) });
	};

	const tagRegex = /^[a-zA-Z0-9-]+$/;
	const isTagValid = memoize((value: string) => {
		return value === '' || (value.length <= 32 && tagRegex.test(value));
	});

	const cancelTags = () => {
		tags.value = [];
		isEditingTags.value = false;
	};

	// UTILS

	const updateProbe = async (id: number, newData: Partial<Probe>) => {
		try {
			const updatedProbe = await $directus.request(updateItem('gp_adopted_probes', id, newData));
			probes.value = [ ...probes.value.map(probe => probe.id === updatedProbe.id ? updatedProbe : probe) ];
		} catch (e) {
			sendErrorToast(e);
		}
	};
</script>
