<template>
	<section>
		<slot/>
	</section>
</template>

<script setup lang="ts">
	import { useAppearance } from '~/store/appearance';
	const appearance = useAppearance();

	useHead({
		meta: [
			{ name: 'theme-color', content: appearance.theme === 'light' ? '#ffffff' : '#17233a' },
		],
	});
</script>
