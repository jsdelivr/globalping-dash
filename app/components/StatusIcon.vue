<template>
	<i v-tooltip.top="getProbeStatusText(probe, true)" class="pi pi-circle-fill touch-events-none rounded-full text-2xs" :class="[getProbeStatusColor(probe), {'border-2 border-surface-0 dark:border-dark-900': border}]"/>
</template>

<script setup lang="ts">
	import { getProbeStatusColor, getProbeStatusText } from '~/utils/probe-status';

	defineProps({
		probe: {
			type: Object as PropType<Probe>,
			required: true,
		},
		border: Boolean,
	});
</script>

<style scoped>
	/* Disable tooltip on touch devices.
	The probe icon is clickable, so the tooltip would only flash briefly, which does not look good. */
	@media (pointer: coarse) {
		.touch-events-none {
			pointer-events: none;
		}
	}
</style>
