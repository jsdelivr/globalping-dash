<template>
	<div :class="{'flex size-10 shrink-0 items-center justify-center rounded-full border bg-surface-0 dark:bg-dark-900': border}" class="relative">
		<nuxt-icon class="text-base text-primary" :class="{'text-xl': border}" :name="name" :filled="filled"/>
		<slot/>
	</div>
</template>

<script setup lang="ts">
	defineProps({
		name: {
			type: String,
			default: '',
		},
		filled: Boolean,
		border: Boolean,
	});
</script>
