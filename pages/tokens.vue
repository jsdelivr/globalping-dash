<template>
	<div class="bg-surface-50 flex h-full flex-col p-6">
		<div class="mb-4 flex">
			<h1 class="col-span-2 text-2xl font-bold">Tokens</h1>
			<Button class="ml-auto" label="Generate new token"/>
		</div>
		<p class="xl:w-1/2">Generate a token and add it to your Globalping requests to upper your hourly measurements limit. After the limit is exhausted, you can proceed with measurements by spending the earned credits.</p>
		<div v-if="false" class="mt-6">data</div>
		<div v-else class="bg-surface-0 mt-6 rounded-xl border px-4 py-3">
			<div class="bg-surface-50 rounded-xl py-6 text-center">
				<p class="font-semibold">No data to show</p>
				<p class="mt-4">Adopt a probe or become a sponsor to track your credit usage</p>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { readItems } from '@directus/sdk';

	const { $directus } = useNuxtApp();

	const { data: tokens } = await useAsyncData('gp_tokens', () => {
		return $directus.request(readItems('gp_tokens'));
	});

	console.log('tokens', tokens);
</script>
