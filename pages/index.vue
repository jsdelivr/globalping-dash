<template>
	<div>
		<h2>Probes</h2>
		<DataTable :value="adoptedProbes" table-style="min-width: 50rem">
			<Column field="id" header="ID"/>
			<Column field="name" header="Name"/>
			<Column field="ip" header="ip"/>
			<Column field="city" header="city"/>
			<Column field="country" header="country"/>
		</DataTable>
		<h2>Credits</h2>
		<DataTable :value="credits" table-style="min-width: 50rem">
			<Column field="amount" header="Amount"/>
		</DataTable>
	</div>
</template>

<script setup lang="ts">
	const { getItems } = useDirectusItems();

	const [ adoptedProbes, credits ] = await Promise.all([ getItems({
			collection: 'gp_adopted_probes',
		}),
		getItems({
			collection: 'gp_credits',
		}) ]);
</script>
