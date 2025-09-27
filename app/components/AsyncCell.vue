<template>
	<Skeleton v-if="loading" width="10rem" class="flex self-center"/>
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
