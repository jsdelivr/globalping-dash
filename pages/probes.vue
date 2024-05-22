<template>
	<div class="bg-surface-50 flex h-full flex-col p-6">
		<div class="flex">
			<h1 class="title col-span-2 text-2xl font-bold">Probes</h1>
			<Button class="ml-auto">
				<nuxt-icon class="pi mr-2 mt-[2px]" name="capture"/>
				<span class="font-bold">Adopt a probe</span>
			</Button>
		</div>
		<div class="bg-surface-0 mt-6 flex h-full grow flex-col rounded-xl border">
			<p class="text-bluegray-700 flex border-b px-6 py-3 font-bold">List of probes</p>
			<div v-if="!adoptedProbes?.length" class="bg-surface-50 m-6 flex grow flex-col items-center justify-center rounded-xl text-center">
				<img class="mx-auto w-24" src="~/assets/images/hw-probe.png" alt="Hardware probe">
				<p class="mt-6 leading-tight">
					<b>You don't have any probes yet.</b><br><br>
					Get started in 30 seconds by running a Docker container with our probe.  It's free and simple.<br>
					Each probe will generate additional credits for you to use. Nowhere to run the container?<br>
					<NuxtLink class="text-primary font-semibold hover:underline" to="https://github.com/sponsors/jsdelivr">Become a GitHub Sponsor</NuxtLink> and get a hardware ARM powered probe delivered to you.<br>
					Plug-and-play simplicity guaranteed.
				</p>
				<Button class="mt-6" label="Start a probe" @click="startProbeDialog = true"/>
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
		</div>
	</div>
	<!-- <div>
		<h1>Probes</h1>
		<span class="edit-input">
			<InputText v-model="value" type="text" class="edit-input__input"/>
			<i class="pi pi-check edit-input__save" @click="edit"/>
		</span>
		<br>
		<br>
		<br>
		<br>
		<DataTable :value="adoptedProbes" table-style="min-width: 50rem">
			<Column field="id" header="id"/>
			<Column field="asn" header="asn"/>
			<Column field="city" header="city"/>
			<Column field="country" header="country"/>
			<Column field="date_created" header="date_created"/>
			<Column field="hardwareDevice" header="hardwareDevice"/>
			<Column field="ip" header="ip"/>
			<Column field="lastSyncDate" header="lastSyncDate"/>
			<Column field="latitude" header="latitude"/>
			<Column field="longitude" header="longitude"/>
			<Column field="name" header="name"/>
			<Column field="network" header="network"/>
			<Column field="nodeVersion" header="nodeVersion"/>
			<Column field="status" header="status"/>
			<Column field="tags" header="tags"/>
			<Column field="version" header="version"/>
		</DataTable>
	</div> -->
</template>

<script setup lang="ts">
	import { readItems, updateItem } from '@directus/sdk';

	const { $directus } = useNuxtApp();

	const { data: adoptedProbes } = await useAsyncData('gp_adopted_probes', () => {
		// return $directus.request(readItems('gp_adopted_probes'));
		return [];
	});

	const startProbeDialog = ref(false);

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
