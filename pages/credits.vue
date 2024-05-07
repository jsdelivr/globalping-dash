<template>
	<div>
		<h1>Credits</h1>
		<DataTable :value="creditsData?.credits" table-style="min-width: 50rem">
			<Column field="amount" header="amount"/>
		</DataTable>
		<h1>Credits Additions</h1>
		<DataTable :value="creditsData?.creditsAdditions" table-style="min-width: 50rem">
			<Column field="date_created" header="date_created"/>
			<Column field="amount" header="amount"/>
			<Column field="adopted_probe" header="adopted_probe"/>
			<Column field="comment" header="comment"/>
		</DataTable>
		<h1>Credits Deductions</h1>
		<DataTable :value="creditsData?.creditsDeductions" table-style="min-width: 50rem">
			<Column field="date" header="date"/>
			<Column field="amount" header="amount"/>
		</DataTable>
	</div>
</template>

<script setup lang="ts">
	import { readItems } from '@directus/sdk';

	const { $directus } = useNuxtApp();

	const { data: creditsData } = await useAsyncData('creditsData', async () => {
		const [ credits, creditsAdditions, creditsDeductions ] = await Promise.all([
			$directus.request(readItems('gp_credits')),
			$directus.request(readItems('gp_credits_additions')),
			$directus.request(readItems('gp_credits_deductions')),
		]);
		console.log('creditsDeductions', creditsDeductions);

		return { credits, creditsAdditions, creditsDeductions };
	});

	console.log(creditsData.value?.creditsDeductions);
</script>
