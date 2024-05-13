<template>
	<div>
		<h1>Settings</h1>
	</div>
</template>

<script setup lang="ts">
	import { readMe } from '@directus/sdk';

	const { $directus } = useNuxtApp();

	const { data: me } = await useAsyncData('me', () => {
		return $directus.request(readMe());
	});

	console.log('me', me.value);
</script>
