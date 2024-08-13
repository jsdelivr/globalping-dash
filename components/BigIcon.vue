<template>
	<div :class="{'flex size-10 items-center justify-center rounded-full border bg-surface-0 dark:bg-dark-900': border}" class="relative">
		<nuxt-icon class="text-base text-primary" :class="{'text-xl': border}" :name="name" :filled="filled"/>
		<i v-if="statusColor" v-tooltip.top="capitalize(props.status.replaceAll('-', ' '))" class="pi pi-circle-fill absolute right-[-3px] top-0 rounded-full border-2 border-surface-0 text-2xs dark:border-dark-900" :class="statusColor"/>
	</div>
</template>

<script setup lang="ts">
	import capitalize from 'lodash/capitalize';

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

	const statusColor = computed(() => {
		if (props.status === '') {
			return '';
		} else if (props.status === 'ready') {
			return 'text-green-500';
		} else if (props.status === 'offline') {
			return 'text-bluegray-500';
		}

		return 'text-yellow-600';
	});
</script>
