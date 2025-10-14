<template>
	<Skeleton v-if="loading" class="flex self-center" :class="sizeClass"/>
	<slot v-else/>
</template>

<script setup lang="ts">
	const props = defineProps({
		loading: {
			type: Boolean,
			required: true,
		},
		size: {
			type: String,
			default: 'normal',
		},
	});

	const sizeClass = computed(() => props.size === 'small' ? 'max-w-20' : 'max-w-40');
</script>
