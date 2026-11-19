<template>
	<p>Run the following commands to recreate the container with the latest probe software.</p>
	<ProbeStartCommands class="my-4" :account-id="props.accountId" :adopt="true" :recreate="true"/>
	<p>Once the container starts, the updated probe will be ready to run measurements.</p>
</template>

<script setup lang="ts">
	const props = defineProps({
		accountId: {
			type: String,
			default: undefined,
		},
	});
</script>
