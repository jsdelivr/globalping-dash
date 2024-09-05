<template>
	<i v-if="statusColor" v-tooltip.top="capitalize(props.status.replaceAll('-', ' '))" class="pi pi-circle-fill rounded-full text-2xs" :class="[statusColor, {'border-2 border-surface-0 dark:border-dark-900': props.border}]"/>
</template>

<script setup lang="ts">
	import capitalize from 'lodash/capitalize';

	const props = defineProps({
		status: {
			type: String,
			default: '',
		},
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
