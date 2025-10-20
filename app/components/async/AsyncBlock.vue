<template>
	<AsyncBlockLoading v-if="status === 'pending'"/>
	<AsyncBlockError v-else-if="status === 'error'"/>

	<div v-else>
		<slot/>
	</div>
</template>

<script setup lang="ts">
	defineProps({
		status: {
			type: String,
			required: true,
		},
	});
</script>
