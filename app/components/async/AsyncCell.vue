<template>
	<div v-if="preserveHeight" class="relative">
		<div :class="{ 'invisible': loading }">
			<slot/>
		</div>
		<Skeleton v-if="loading" class="!absolute inset-y-0 left-0 my-auto flex self-center" :class="sizeClass"/>
	</div>
	<Skeleton v-else-if="loading" class="flex self-center" :class="sizeClass"/>
	<slot v-else/>
</template>

<script setup lang="ts">
	const props = defineProps({
		loading: {
			type: Boolean,
			required: true,
		},
		preserveHeight: {
			type: Boolean,
			default: false,
		},
		size: {
			type: String,
			default: 'normal',
		},
	});

	const sizeClass = computed(() => props.size === 'small' ? 'max-w-20' : 'max-w-40');
</script>
