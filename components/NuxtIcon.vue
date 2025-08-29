<!-- This component is a copy of nuxt-icons lib, but with fixed "noUncheckedIndexedAccess" errors. Source: https://github.com/gitFoxCode/nuxt-icons/issues/60 -->

<template>
	<!-- eslint-disable-next-line vue/no-v-html -->
	<span class="nuxt-icon" :class="{ 'nuxt-icon--fill': !filled, 'nuxt-icon--stroke': hasStroke && !filled }" v-html="icon"/>
</template>

  <script setup lang="ts">
	import { ref, watchEffect } from '#imports';

	const props = withDefaults(defineProps<{
		name: string;
		filled?: boolean;
	}>(), { filled: false });


	const icon = ref<string | Record<string, any>>('');
	let hasStroke = false;

	async function getIcon () {
		try {
			const iconsImport = import.meta.glob('assets/icons/**/**.svg', {
				eager: false,
				query: '?raw',
				import: 'default',
			});
			const iconPath = `/assets/icons/${props.name}.svg`;
			const rawIcon = await iconsImport[iconPath]!() as string;

			if (rawIcon.includes('stroke')) { hasStroke = true; }

			icon.value = rawIcon;
		} catch {
			console.error(`[nuxt-icons] Icon '${props.name}' doesn't exist in 'assets/icons'`);
		}
	}

	await getIcon();

	watchEffect(getIcon);
  </script>

  <style>
	.nuxt-icon svg {
		width: 1em;
		height: 1em;
		vertical-align: middle;
	}

	.nuxt-icon.nuxt-icon--fill,
	.nuxt-icon.nuxt-icon--fill * {
		fill: currentColor !important;
	}

	.nuxt-icon.nuxt-icon--stroke,
	.nuxt-icon.nuxt-icon--stroke * {
		stroke: currentColor !important;
	}
  </style>
