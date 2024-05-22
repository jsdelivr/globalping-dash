<template>
	<div :class="{'border-surface-300 relative flex size-10 items-center justify-center rounded-full border': border}">
		<nuxt-icon class="text-primary text-base" :class="{'text-xl': border}" :name="name" :filled="filled"/>
		<i v-if="online" v-tooltip.top="'Available'" class="pi pi-circle-fill border-surface-0 absolute right-[-3px] top-0 rounded-full border-2 text-[0.6rem] text-green-500"/>
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
