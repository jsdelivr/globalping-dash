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
				:value="adoptedProbes"
				lazy
				:first="first"
				:rows="5"
				data-key="id"
				:total-records="totalRecords"
				:loading="loading"
			>
				<template #header>
					<h3>List of probes</h3>
				</template>
				<Column header="Name">
					<template #body="slotProps">
						<ProbeHeader :name="slotProps.data.name" :city="slotProps.data.city" :ip="slotProps.data.ip" ip-css="text-bluegray-900"/>
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
					<template #body="">
						<Tag class="flex items-center !text-sm" severity="success" value="Success">
							<nuxt-icon class="mr-1 mt-0.5" name="coin"/>+150
						</Tag>
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
				<Column expander style="width: 5rem"/>
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

		adoptedProbes.value = probes;
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

	// const edit = async () => {
	// 	const result = await $directus.request(updateItem('gp_adopted_probes', '1', { name: 'asdf' }));
	// 	adoptedProbes.value = [ ...adoptedProbes.value.map(probe => probe.id === result.id ? result : probe) ];
	// };
</script>

<style>
	.edit-input {
		position: relative;
	}

	.edit-input__save {
		position: absolute;
		right: 0.75rem;
		margin-top: -0.5rem;
		cursor: pointer;
		top: 50%;
	}

	.edit-input__save:hover {
		font-weight: 600;
	}

	.edit-input__input {
		padding-right: 2.5rem;
	}
</style>
