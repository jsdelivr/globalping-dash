<template>
	<div class="bg-surface-50 flex h-full min-w-[1280px] flex-col p-6">
		<div class="mb-6 flex">
			<h1 class="title col-span-2 text-2xl font-bold">Probes</h1>
			<Button class="ml-auto">
				<nuxt-icon class="pi mr-2 mt-[2px]" name="capture"/>
				<span class="font-bold">Adopt a probe</span>
			</Button>
		</div>
		<div v-if="!probes?.length && !loading" class="bg-surface-0 mt-6 flex grow flex-col overflow-hidden rounded-xl border">
			<p class="text-bluegray-700 flex border-b px-6 py-3 font-bold">List of probes</p>
			<div class="bg-surface-50 m-6 flex grow flex-col items-center justify-center rounded-xl text-center">
				<img class="mx-auto w-24" src="~/assets/images/hw-probe.png" alt="Hardware probe">
				<p class="mt-6 leading-tight">
					<b>You don't have any probes yet.</b><br><br>
					Get started in 30 seconds by running a Docker container with our probe.  It's free and simple.<br>
					Each probe will generate additional credits for you to use. Nowhere to run the container?<br>
					<NuxtLink class="text-primary font-semibold hover:underline" to="https://github.com/sponsors/jsdelivr">Become a GitHub Sponsor</NuxtLink> and get a hardware ARM powered probe delivered to you.<br>
					Plug-and-play simplicity guaranteed.
				</p>
				<Button class="mt-6" label="Start a probe" @click="startProbeDialog = true"/>
			</div>
		</div>
		<div v-if="probes?.length">
			<DataTable
				v-model:expandedRows="expandedRows"
				:value="probes"
				lazy
				:first="first"
				:rows="5"
				data-key="id"
				:total-records="probesCount"
				:loading="loading"
				table-class="table-fixed"
				@row-click="toggleRow"
			>
				<template #header>
					<h3>List of probes</h3>
				</template>
				<Column header="Name" class="w-1/4" body-class="!p-0">
					<template #body="slotProps">
						<div v-if="expandedRow === slotProps.data.id">
							<div class="mx-2 grid grid-cols-[auto_1fr] grid-rows-[auto_auto] gap-x-3 pt-3">
								<BigIcon class="col-span-1 row-span-2" :name="slotProps.data.hardwareDevice ? 'gp' : 'docker'" border :status="slotProps.data.status"/>
								<div v-if="isEditingName" v-focustrap class="-mt-0.5 flex items-center border-b">
									<InputText v-model="name" class="w-full rounded-none border-0 bg-transparent !px-0 !py-1 font-bold" autofocus @keyup.enter="saveName(slotProps.data.id)"/>
									<Button
										icon="pi pi-check"
										class="text-surface-900 h-6 w-4"
										severity="secondary"
										text
										aria-label="Save name"
										size="small"
										@click="saveName(slotProps.data.id)"
									/>
									<Button
										icon="pi pi-times"
										class="text-surface-900 h-6 w-4"
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
										class="text-surface-900 mx-1 w-6 !py-0"
										severity="secondary"
										text
										aria-label="Edit name"
										size="small"
										@click="editName(slotProps.data.name)"
									/>
								</p>
								<p class="text-bluegray-900 col-start-2 col-end-3 row-start-2 row-end-3">{{ slotProps.data.ip }}</p>
							</div>
							<div class="mb-6 mt-24 w-[200%] pl-16 pr-2">
								<p class="border-surface-300 border-b pb-2 font-bold">Probe details</p>
								<div class="mt-3 flex h-32 items-center justify-center rounded-md bg-green-100">
									Map goes here
								</div>
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
							:hardware-device="slotProps.data.hardwareDevice"
							ip-css="text-bluegray-900"
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
									<InputText v-model="city" class="w-full rounded-none border-0 bg-transparent !px-0 !py-1 font-bold" autofocus @keyup.enter="saveCity(slotProps.data.id)"/>
									<Button
										icon="pi pi-check"
										class="text-surface-900 h-6 w-4"
										severity="secondary"
										text
										aria-label="Save city"
										size="small"
										@click="saveCity(slotProps.data.id)"
									/>
									<Button
										icon="pi pi-times"
										class="text-surface-900 h-6 w-4"
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
										class="text-surface-900 mx-1 w-6 !py-0"
										severity="secondary"
										text
										aria-label="Edit city"
										size="small"
										@click="editCity(slotProps.data.city)"
									/>
								</p>
							</div>
							<p>{{ slotProps.data.network }}, {{ slotProps.data.asn }}</p>
							<p class="text-bluegray-400 text-2xs mt-3">City where the probe is located. If you know that city is wrong it can be changed here: type in the valid city and click save.</p>
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
						<div v-if="expandedRow === slotProps.data.id" class="flex flex-col py-3">
							<div class="px-2">
								<div v-if="isEditingTags">
									<div>
										<div v-for="(tag, index) in tags" :key="index" class="mb-2 flex items-center">
											<Dropdown v-model="tag.uPrefix" class="w-40" :options="uPrefixes"/>
											<span class="mx-2">-</span>
											<InputText v-model="tag.value" class="w-[115px]"/>
											<Button icon="pi pi-trash" text aria-label="Remove" class="text-surface-900" @click="removeTag(index)"/>
										</div>
									</div>
									<div class="mt-6">
										<Button label="Add tag" icon="pi pi-plus" severity="secondary" @click="addTag"/>
										<Button label="Save" icon="pi pi-check" severity="secondary" class="bg-surface-300 ml-12" @click="saveTags(slotProps.data.id)"/>
										<Button label="Cancel" severity="secondary" class="ml-1" @click="cancelTags"/>
									</div>
									<p class="text-bluegray-400 text-2xs mt-3">
										Public tags of the probe. They can be used as location filters for a measurement. Format is <code class="font-bold">u-${prefix}-${value}</code> where prefix is user/organization github login, and value is your custom string.

										E.g. for user with github username <code class="font-bold">"jimaek"</code>
										and tag <code class="font-bold">"home1"</code> location filter is<br>
										<code class="font-bold">{ "tags": ["u-jimaek-home1"] }</code>.
									</p>
								</div>
								<div v-else>
									<div>
										<Tag v-for="tag in slotProps.data.tags" :key="tag" class="my-0.5 mr-1 flex py-0.5 font-normal" severity="secondary" :value="`${tag.prefix}-${tag.value}`"/>
									</div>
									<Button class="mt-3" label="Edit tags" icon="pi pi-pencil" severity="secondary" @click="editTags(slotProps.data.tags)"/>
									<p class="text-bluegray-400 text-2xs mt-3">Public tags of the probe. They can be used as location filters for a measurement.</p>
								</div>
							</div>
							<div class="mt-6 w-[145%] px-2">
								<p class="border-surface-300 border-b pb-2 font-bold">Tests (last 24h)</p>
								<p class="mt-2">Coming soon</p>
							</div>
						</div>
						<div v-else class="px-2 py-3">
							<Tag v-for="tag in slotProps.data.tags" :key="tag" class="my-0.5 mr-1 flex py-0.5 font-normal" severity="secondary" :value="`${tag.prefix}-${tag.value}`"/>
						</div>
					</template>
				</Column>
				<Column header="Credits past month" class="w-[13%]" body-class="!p-0">
					<template #body="slotProps">
						<div class="px-2 py-3">
							<Tag class="flex items-center !text-sm" severity="success" value="Success">
								<nuxt-icon class="mr-1 mt-0.5" name="coin"/>+{{ credits[slotProps.data.id] || 0 }}
							</Tag>
						</div>
					</template>
				</Column>
				<Column expander class="w-[3%]" body-class="!p-0">
					<template #body="slotProps">
						<div v-if="expandedRow === slotProps.data.id" class="cursor-pointer px-2 py-5" @click.stop="expandedRow = ''">
							<i class="pi pi-chevron-down"/>
						</div>
						<div v-else class="px-2 py-3">
							<i class="pi pi-chevron-right"/>
						</div>
					</template>
				</Column>
				<template #footer>
					<Button
						class=""
						severity="secondary"
						label="Start a probe"
						icon="pi pi-question-circle"
						@click="startProbeDialog = true"
					/>
				</template>
			</DataTable>
			<Paginator
				class="mt-9"
				:first="first"
				:rows="5"
				:total-records="probesCount"
				template="PrevPageLink PageLinks NextPageLink"
				@page="onPage($event)"
			/>
		</div>
		<Dialog
			v-model:visible="startProbeDialog"
			class="min-w-[700px]"
			modal
			dismissable-mask
			:draggable="false"
			header="Start a probe"
		>
			<StartAProbe/>
		</Dialog>
	</div>
</template>

<script setup lang="ts">
	import { useAuth } from '~/store/auth';
	import CountryFlag from 'vue-country-flag-next';
	import { aggregate, readItems, updateItem } from '@directus/sdk';

	const { $directus } = useNuxtApp();

	// const { data: probes } = await useAsyncData('gp_adopted_probes', () => {
	// 	return $directus.request(readItems('gp_adopted_probes'));
	// });

	const startProbeDialog = ref(false);

	const loading = ref(false);
	const probesCount = ref(0);
	const probes = ref([]);
	const credits = ref({});
	const first = ref(0);
	const lazyParams = ref({});

	const loadLazyData = async (event) => {
		loading.value = true;
		lazyParams.value = { ...lazyParams.value, first: event?.first || first.value };

		const adoptedProbes = await $directus.request(readItems('gp_adopted_probes', {
			offset: lazyParams.value.first,
			limit: 5,
		}));

		const [{ count }] = await $directus.request(aggregate('gp_adopted_probes', { aggregate: { count: '*' } }));

		const creditsAdditions = await $directus.request(readItems('gp_credits_additions', {
			filter: {
				date_created: { _gte: '$NOW(-1 month)' },
			},
		}));

		const creditsByProbeId = creditsAdditions.reduce((result, { adopted_probe, amount }) => {
			if (adopted_probe && !result[adopted_probe]) {
				result[adopted_probe] = amount;
			} else if (adopted_probe) {
				result[adopted_probe] += amount;
			}

			return result;
		}, {});

		credits.value = creditsByProbeId;
		probes.value = adoptedProbes;
		probesCount.value = count;
		loading.value = false;
	};

	onMounted(() => {
		loading.value = true;

		lazyParams.value = {
			first: 0,
			rows: 5,
		};

		loadLazyData();
	});

	const onPage = (event) => {
		lazyParams.value = event;
		loadLazyData(event);
	};

	// PROBE DETAILS

	const expandedRow = ref<string>('');
	const expandedRows = computed(() => ({ [expandedRow.value]: true }));
	const toggleRow = (event) => {
		if (event.data.id !== expandedRow.value) {
			isEditingName.value = false;
			isEditingCity.value = false;
			isEditingTags.value = false;
			expandedRow.value = event.data.id;
		}
	};

	//  EDIT NAME

	const isEditingName = ref<boolean>(false);
	const name = ref<string>('');

	const editName = (currentName) => {
		isEditingName.value = true;
		name.value = currentName;
	};

	const saveName = async (id) => {
		isEditingName.value = false;
		const updatedProbe = await $directus.request(updateItem('gp_adopted_probes', id, { name: name.value }));
		updateProbes(updatedProbe);
	};

	const cancelName = () => {
		name.value = '';
		isEditingName.value = false;
	};

	// EDIT CITY

	const isEditingCity = ref<boolean>(false);
	const city = ref<string>('');

	const editCity = (currentCity) => {
		isEditingCity.value = true;
		city.value = currentCity;
	};

	const saveCity = async (id) => {
		isEditingCity.value = false;
		const updatedProbe = await $directus.request(updateItem('gp_adopted_probes', id, { city: city.value }));
		updateProbes(updatedProbe);
	};

	const cancelCity = () => {
		city.value = '';
		isEditingCity.value = false;
	};

	// EDIT TAGS

	const auth = useAuth();
	const user = auth.getUser;

	const isEditingTags = ref<boolean>(false);
	const tags = ref<object[]>();

	const uPrefixes = [ user.github_username, ...user.github_organizations ].map(value => `u-${value}`);

	const editTags = (currentTags) => {
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

	const removeTag = (index) => {
		tags.value?.splice(index, 1);
	};

	const saveTags = async (id) => {
		isEditingTags.value = false;
		const updatedProbe = await $directus.request(updateItem('gp_adopted_probes', id, { tags: tags.value.map(({ uPrefix, value }) => ({
			prefix: uPrefix.replace('u-', ''),
			value,
		})) }));
		updateProbes(updatedProbe);
	};

	const cancelTags = () => {
		tags.value = [];
		isEditingTags.value = false;
	};

	// UTILS

	const updateProbes = (updatedProbe) => {
		probes.value = [ ...probes.value.map(probe => probe.id === updatedProbe.id ? updatedProbe : probe) ];
	};
</script>
