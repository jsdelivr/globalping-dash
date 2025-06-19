<template>
	<BigIcon :name="probe.hardwareDevice ? 'probe' : 'docker'" :filled="filled" :border="border">
		<StatusIcon :probe="probe" class="absolute right-[-3px] top-0" border/>
	</BigIcon>
</template>

<script setup lang="ts">
	defineProps({
		probe: {
			type: Object as PropType<Probe>,
			required: true,
		},
		filled: Boolean,
		border: Boolean,
	});
</script>
