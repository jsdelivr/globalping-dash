<template>
	<NuxtLayout>
		<NuxtWelcome/>
	</NuxtLayout>
</template>

<script setup lang="ts">
	import { createDirectus, rest, authentication, readItems } from '@directus/sdk';

	useAsyncData('tokens', async () => {
		const directus = createDirectus('http://localhost:18055') // TODO: make it configurable
			.with(authentication('cookie', { credentials: 'include' }))
			.with(rest({ credentials: 'include' }));

		// TODO: extend logic to call this as needed
		await directus.refresh();

		console.log(await directus.request(readItems('gp_tokens')));
	}, { server: false });
</script>
