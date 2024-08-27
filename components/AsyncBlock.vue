<template>
	<BlockLoading v-if="status === 'pending'"/>
	<BlockError v-else-if="status === 'error'"/>

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
