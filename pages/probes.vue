<template>
	<div>
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
	</div>
</template>

<script setup lang="ts">
	import { readItems, updateItem } from '@directus/sdk';

	const { $directus } = useNuxtApp();

	const { data: adoptedProbes } = await useAsyncData('gp_adopted_probes', () => {
		return $directus.request(readItems('gp_adopted_probes'));
	});

	const edit = async () => {
		const result = await $directus.request(updateItem('gp_adopted_probes', '1', { name: 'asdf' }));
		adoptedProbes.value = [ ...adoptedProbes.value.map(probe => probe.id === result.id ? result : probe) ];
	};
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
