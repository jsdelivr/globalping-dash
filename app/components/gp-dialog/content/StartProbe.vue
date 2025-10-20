<template>
	<p>To join the Globalping probe network, all you have to do is run our container.</p>
	<ProbeStartCommands class="my-4" :adopt="props.adopt"/>
	<p>Once the container starts, you become part of the global community that powers the Globalping Platform. The container works on both x86 and ARM architectures.</p>
</template>

<script setup lang="ts">
	const props = defineProps({
		adopt: {
			type: Boolean,
			default: undefined,
		},
	});
</script>
