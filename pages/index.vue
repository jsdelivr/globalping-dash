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
	const { getItems } = useDirectusItems();

	const adoptedProbes = await getItems({
		collection: 'gp_adopted_probes',
	});
</script>
