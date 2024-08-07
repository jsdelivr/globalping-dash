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
				v-model:expandedRows="expandedRows"
				:value="probes"
				lazy
				:first="first"
				:rows="itemsPerPage"
				data-key="id"
				:total-records="probesCount"
				:loading="loading"
				table-class="table-fixed"
				:row-class="() => 'cursor-pointer hover:bg-surface-50 dark:hover:bg-dark-700'"
				@row-click="toggleRow"
			>
				<template #header>
					<h3>List of probes</h3>
				</template>
				<Column header="Name" class="w-1/4" body-class="!p-0">
					<template #body="slotProps">
						<div v-if="expandedRow === slotProps.data.id">
							<div class="mx-2 grid grid-cols-[auto_1fr] grid-rows-[auto_auto] gap-x-3 pt-3">
								<BigIcon class="col-span-1 row-span-2" :name="slotProps.data.hardwareDevice ? 'probe' : 'docker'" border :status="slotProps.data.status"/>
								<div v-if="isEditingName" v-focustrap class="-mt-0.5 flex items-center border-b">
									<InputText v-model="name" class="w-full rounded-none border-0 !bg-transparent !px-0 !py-1 font-bold" autofocus @keyup.enter="saveName(slotProps.data.id)"/>
									<Button
										icon="pi pi-check"
										class="h-6 w-4 text-surface-900"
										severity="secondary"
										text
										aria-label="Save name"
										size="small"
										@click="saveName(slotProps.data.id)"
									/>
									<Button
										icon="pi pi-times"
										class="h-6 w-4 text-surface-900"
										severity="secondary"
										text
										aria-label="Close edit"
										size="small"
										@click="cancelName"
									/>
								</div>
								<p v-else class="col-start-2 col-end-3 flex items-center font-bold">
									{{ slotProps.data.name || slotProps.data.city }}
									<Button
										icon="pi pi-pencil"
										class="mx-1 w-6 !py-0 text-surface-900"
										severity="secondary"
										text
										aria-label="Edit name"
										size="small"
										@click="editName(slotProps.data.name)"
									/>
								</p>
								<p class="col-start-2 col-end-3 row-start-2 row-end-3 text-bluegray-900 dark:text-bluegray-400">{{ slotProps.data.ip }}</p>
							</div>
							<div class="mb-6 mt-24 w-[200%] pl-16 pr-2">
								<p class="border-b pb-2 font-bold">Probe details</p>
								<div id="gp-map" class="mt-3 h-32 rounded-md"/>
								<p class="mt-3">
									Type:
									<span class="ml-2 mr-8 font-bold">
										{{ slotProps.data.hardwareDevice || 'Container' }}
									</span>
									Version
									<span class="ml-2 font-bold">
										{{ slotProps.data.version }}
									</span>
								</p>
							</div>
						</div>
						<ProbeHeader
							v-else
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
						<div v-if="expandedRow === slotProps.data.id" class="px-2 py-3">
							<div class="mb-1 flex items-center">
								<CountryFlag :country="slotProps.data.country" size="small" class="px-6"/>
								<div v-if="isEditingCity" v-focustrap class="-mt-0.5 ml-2 flex w-full items-center border-b">
									<InputText v-model="city" class="w-full rounded-none border-0 !bg-transparent !px-0 !py-1 font-bold" autofocus @keyup.enter="saveCity(slotProps.data.id)"/>
									<Button
										icon="pi pi-check"
										class="h-6 w-4 text-surface-900"
										severity="secondary"
										text
										aria-label="Save city"
										size="small"
										@click="saveCity(slotProps.data.id)"
									/>
									<Button
										icon="pi pi-times"
										class="h-6 w-4 text-surface-900"
										severity="secondary"
										text
										aria-label="Close edit"
										size="small"
										@click="cancelCity"
									/>
								</div>
								<p v-else class="ml-2 font-bold">
									{{ slotProps.data.city }}, {{ slotProps.data.country }}
									<Button
										icon="pi pi-pencil"
										class="mx-1 w-6 !py-0 text-surface-900"
										severity="secondary"
										text
										aria-label="Edit city"
										size="small"
										@click="editCity(slotProps.data.city)"
									/>
								</p>
							</div>
							<p>{{ slotProps.data.network }}, {{ slotProps.data.asn }}</p>
							<p class="mt-3 text-2xs text-bluegray-400">City where the probe is located. If you know that city is wrong it can be changed here: type in the valid city and click save.</p>
						</div>
						<div v-else class="px-2 py-3">
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
						<div v-if="expandedRow === slotProps.data.id" class="flex flex-col py-4">
							<div class="px-2">
								<div v-if="isEditingTags">
									<div>
										<div v-for="(tag, index) in tags" :key="index" class="mb-2 flex items-center" :class="{ 'mb-5': !isTagValid(tag.value) }">
											<Select v-model="tag.uPrefix" class="grow" :options="uPrefixes" :scroll-height="'200px'"/>
											<span class="mx-2">-</span>
											<span class="grow">
												<InputText v-model="tag.value" :invalid="!isTagValid(tag.value)" class="w-full"/>
												<p v-if="!isTagValid(tag.value)" class="absolute pl-1 text-red-500">Invalid tag</p>
											</span>
											<Button icon="pi pi-trash" text aria-label="Remove" class="text-surface-900 dark:text-surface-0" @click="removeTag(index)"/>
										</div>
									</div>
									<div class="mt-6 flex">
										<Button
											label="Add tag"
											icon="pi pi-plus"
											severity="secondary"
											class="dark:!bg-dark-800"
											outlined
											@click="addTag"
										/>
										<Button
											label="Save"
											icon="pi pi-check"
											severity="secondary"
											outlined
											class="ml-auto bg-surface-200"
											@click="saveTags(slotProps.data.id)"
										/>
										<Button label="Cancel" severity="secondary" outlined class="ml-1 dark:!bg-dark-800" @click="cancelTags"/>
									</div>
									<p class="mt-3 text-2xs text-bluegray-400">
										Public tags of the probe. They can be used as location filters for a measurement. Format is <code class="font-bold">u-${prefix}-${value}</code> where prefix is user/organization github login, and value is your custom string.

										E.g. for user with github username <code class="font-bold">"jimaek"</code>
										and tag <code class="font-bold">"home1"</code> location filter is<br>
										<code class="font-bold">{ "tags": ["u-jimaek-home1"] }</code>.
									</p>
								</div>
								<div v-else>
									<div>
										<Tag v-for="tag in slotProps.data.tags" :key="tag" class="my-0.5 mr-1 flex bg-surface-0 py-0.5 font-normal dark:bg-dark-800" severity="secondary" :value="`${tag.prefix}-${tag.value}`"/>
									</div>
									<Button
										class="mt-3"
										label="Edit tags"
										icon="pi pi-pencil"
										severity="secondary"
										outlined
										@click="editTags(slotProps.data.tags)"
									/>
									<p class="mt-3 text-2xs text-bluegray-400">Public tags of the probe. They can be used as location filters for a measurement.</p>
								</div>
							</div>
							<div class="mt-6 w-[145%] px-2">
								<p class="border-b pb-2 font-bold">Tests (last 24h)</p>
								<div class="pb-4 pt-8 text-center">
									<i class="pi pi-chart-bar py-4 text-lg text-primary"/>
									<p class="font-bold">Tests data coming soon.</p>
									<p>Here you will see the probe tests statistics.</p>
								</div>
							</div>
						</div>
						<div v-else class="px-2 py-4">
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
					<template #body="slotProps">
						<div
							v-if="expandedRow === slotProps.data.id"
							class="cursor-pointer px-2 py-5"
							tabindex="0"
							@click.stop="expandedRow = 0"
							@keydown.stop="onKeyDown"
						>
							<i class="pi pi-chevron-down"/>
						</div>
						<div v-else class="px-2 py-4">
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
			v-model:visible="startProbeDialog"
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
	import { initGoogleMap } from '~/utils/init-google-map';
	import { sendToast } from '~/utils/send-toast';

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
	const expandedRow = ref<number>(0);
	const expandedRows = computed(() => ({ [expandedRow.value]: true }));
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
			sendToast(e);
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

	const toggleRow = (event: DataTableRowClickEvent) => {
		if (event.data.id !== expandedRow.value) {
			isEditingName.value = false;
			isEditingCity.value = false;
			isEditingTags.value = false;
			expandedRow.value = event.data.id;
			const probe = probes.value.find(probe => probe.id === expandedRow.value);
			probe && initGoogleMap(probe);
		}
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

	// OPEN/CLOSE DETAILS

	const onKeyDown = async (event: KeyboardEvent) => {
		if (event.key === 'Enter' || event.key === ' ') {
			expandedRow.value = 0;
		}
	};

	// UTILS

	const updateProbe = async (id: number, newData: Partial<Probe>) => {
		try {
			const updatedProbe = await $directus.request(updateItem('gp_adopted_probes', id, newData));
			probes.value = [ ...probes.value.map(probe => probe.id === updatedProbe.id ? updatedProbe : probe) ];
		} catch (e) {
			sendToast(e);
		}
	};
</script>
