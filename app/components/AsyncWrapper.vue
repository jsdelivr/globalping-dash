<template>
	<div class="relative">
		<div :class="{ 'opacity-0 transition-none': loading }">
			<slot/>
		</div>
		<Skeleton v-show="loading" width="100%" height="100%" class="!absolute inset-0 dark:opacity-20"/>
	</div>
</template>

<script setup lang="ts">
	defineProps({
		loading: {
			type: Boolean,
			required: true,
		},
	});
</script>
