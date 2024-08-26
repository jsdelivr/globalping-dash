<template>
	<div :class="{'flex size-10 items-center justify-center rounded-full border bg-surface-0 dark:bg-dark-900': border}" class="relative">
		<nuxt-icon class="text-base text-primary" :class="{'text-xl': border}" :name="name" :filled="filled"/>
		<StatusIcon :status="props.status" class="absolute right-[-3px] top-0" border/>
	</div>
</template>

<script setup lang="ts">
	const props = defineProps({
		name: {
			type: String,
			default: '',
		},
		status: {
			type: String,
			default: '',
		},
		filled: Boolean,
		border: Boolean,
	});
</script>
