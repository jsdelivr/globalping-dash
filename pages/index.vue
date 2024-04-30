<template>
	<div>
		<h1>Index page</h1>
		<DataTable :value="adoptedProbes" table-style="min-width: 50rem">
			<Column field="id" header="ID"/>
			<Column field="name" header="Name"/>
			<Column field="ip" header="ip"/>
			<Column field="city" header="city"/>
			<Column field="country" header="country"/>
		</DataTable>
	</div>
</template>

<script setup lang="ts">
	import { readItems } from '@directus/sdk';

	const { $directus } = useNuxtApp();

	const { data: adoptedProbes } = await useAsyncData('gp_adopted_probes', () => {
		return $directus.request(readItems('gp_adopted_probes'));
	});
</script>
