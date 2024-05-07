<template>
	<div>
		<h1>Tokens</h1>
		<DataTable :value="tokens" table-style="min-width: 50rem">
			<Column field="id" header="id"/>
			<Column field="date_created" header="date_created"/>
			<Column field="date_last_used" header="date_last_used"/>
			<Column field="date_updated" header="date_updated"/>
			<Column field="expire" header="expire"/>
			<Column field="id" header="id"/>
			<Column field="name" header="name"/>
			<Column field="origins" header="origins"/>
			<Column field="user_created" header="user_created"/>
			<Column field="user_updated" header="user_updated"/>
			<Column field="value" header="value"/>
		</DataTable>
	</div>
</template>

<script setup lang="ts">
	import { readItems } from '@directus/sdk';

	const { $directus } = useNuxtApp();

	const { data: tokens } = await useAsyncData('tokens', () => {
		return $directus.request(readItems('gp_tokens'));
	});

	console.log('tokens', tokens);
</script>
