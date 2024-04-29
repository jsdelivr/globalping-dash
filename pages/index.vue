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
	import { createDirectus, rest, authentication, readItems } from '@directus/sdk';

	const { data: adoptedProbes, error } = useAsyncData('tokens', async () => {
		const directus = createDirectus('http://localhost:18055') // TODO: make it configurable
			.with(authentication('cookie', { credentials: 'include' }))
			.with(rest({ credentials: 'include' }));

		// TODO: extend logic to call this as needed
		await directus.refresh();

		const adoptedProbes = directus.request(readItems('gp_adopted_probes'));
		return adoptedProbes;
	}, { server: false });
</script>
