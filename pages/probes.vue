<template>
	<div>
		<h1>Probes</h1>
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
	import { readItems } from '@directus/sdk';

	const { $directus } = useNuxtApp();

	const { data: adoptedProbes } = await useAsyncData('adoptedProbes', () => {
		return $directus.request(readItems('gp_adopted_probes'));
	});

	console.log(adoptedProbes);
</script>
