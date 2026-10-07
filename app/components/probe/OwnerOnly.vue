<template>
	<span v-tooltip.top="hint">
		<slot :disabled="disabled"/>
	</span>
</template>

<script setup lang="ts">
	import { useProbeEditing } from '~/composables/useProbeEditing';

	const { hint, disabled } = useProbeEditing();
</script>
