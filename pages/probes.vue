<template>
	<div class="bg-surface-50 flex h-full flex-col p-6">
		<div class="mb-6 flex">
			<h1 class="title col-span-2 text-2xl font-bold">Probes</h1>
			<Button class="ml-auto">
				<nuxt-icon class="pi mr-2 mt-[2px]" name="capture"/>
				<span class="font-bold">Adopt a probe</span>
			</Button>
		</div>
		<div v-if="!adoptedProbes?.length && !loading" class="bg-surface-0 mt-6 flex grow flex-col overflow-hidden rounded-xl border">
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
		<div v-if="adoptedProbes?.length">
			<DataTable
				v-model:expandedRows="expandedRows"
				:value="adoptedProbes"
				lazy
				:first="first"
				:rows="5"
				data-key="id"
				:total-records="totalRecords"
				:loading="loading"
				@row-click="toggleRow"
			>
				<template #header>
					<h3>List of probes</h3>
				</template>
				<Column header="Name">
					<template #body="slotProps">
						<div v-if="expandedRow === slotProps.data.id" class="relative min-h-48">
							<h1>detailed</h1>
							<div class="absolute bottom-0 h-1/2 w-full bg-green-300">map</div>
						</div>
						<ProbeHeader
							v-else
							:name="slotProps.data.name"
							:city="slotProps.data.city"
							:ip="slotProps.data.ip"
							:status="slotProps.data.status"
							ip-css="text-bluegray-900"
						/>
					</template>
				</Column>
				<Column header="Location">
					<template #body="slotProps">
						<div class="mb-1 flex items-center">
							<CountryFlag :country="slotProps.data.country" size="small"/>
							<p class="ml-2 font-bold">{{ slotProps.data.city }}, {{ slotProps.data.country }}</p>
						</div>
						<p>{{ slotProps.data.network }}, {{ slotProps.data.asn }}</p>
					</template>
				</Column>
				<Column header="Tags">
					<template #body="slotProps">
						<Tag v-for="tag in slotProps.data.tags" :key="tag" class="my-0.5 mr-1 flex font-normal" severity="secondary" :value="`${tag.prefix}-${tag.value}`"/>
					</template>
				</Column>
				<Column header="Credits past month">
					<template #body="slotProps">
						<Tag class="flex items-center !text-sm" severity="success" value="Success">
							<nuxt-icon class="mr-1 mt-0.5" name="coin"/>+{{ slotProps.data.credits }}
						</Tag>
					</template>
				</Column>
				<Column expander>
					<template #body="slotProps">
						<i class="pi" :class="{'pi-chevron-down': expandedRow === slotProps.data.id, 'pi-chevron-right': expandedRow !== slotProps.data.id}"/>
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
				:total-records="totalRecords"
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
	import CountryFlag from 'vue-country-flag-next';
	import { aggregate, readItems, updateItem } from '@directus/sdk';

	const { $directus } = useNuxtApp();

	// const { data: adoptedProbes } = await useAsyncData('gp_adopted_probes', () => {
	// 	return $directus.request(readItems('gp_adopted_probes'));
	// });

	const startProbeDialog = ref(false);

	const loading = ref(false);
	const totalRecords = ref(0);
	const adoptedProbes = ref([]);
	const first = ref(0);
	const lazyParams = ref({});

	const loadLazyData = async (event) => {
		loading.value = true;
		lazyParams.value = { ...lazyParams.value, first: event?.first || first.value };

		const probes = await $directus.request(readItems('gp_adopted_probes', {
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

		adoptedProbes.value = probes.map(probe => ({ ...probe, credits: creditsByProbeId[probe.id] || 0 }));
		totalRecords.value = count;
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
			expandedRow.value = event.data.id;
		}
	};

	// const edit = async () => {
	// 	const result = await $directus.request(updateItem('gp_adopted_probes', '1', { name: 'asdf' }));
	// 	adoptedProbes.value = [ ...adoptedProbes.value.map(probe => probe.id === result.id ? result : probe) ];
	// };
</script>
