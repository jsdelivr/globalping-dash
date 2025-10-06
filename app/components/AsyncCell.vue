<template>
	<Skeleton v-if="loading" class="flex max-w-40 self-center"/>
	<slot v-else/>
</template>

<script setup lang="ts">
	defineProps({
		loading: {
			type: Boolean,
			required: true,
		},
	});
</script>
