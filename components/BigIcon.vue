<template>
	<div :class="{'w-10 h-10 rounded-full flex justify-center items-center border border-surface-300 relative': border}">
		<nuxt-icon class="text-primary text-base" :class="{'text-xl': border}" :name="name" :filled="filled"/>
		<i v-if="online" v-tooltip.top="'Available'" class="pi pi-circle-fill text-[0.6rem] absolute top-0 right-[-3px] border-2 border-surface-0 rounded-full text-green-500"/>
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
		online: Boolean,
	});
</script>
