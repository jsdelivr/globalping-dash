<template>
	<div :class="{'bg-surface-0 dark:bg-dark-800 relative flex size-10 items-center justify-center rounded-full border': border}">
		<nuxt-icon class="text-primary text-base" :class="{'text-xl': border}" :name="name" :filled="filled"/>
		<i v-if="statusColor" v-tooltip.top="capitalize(props.status.replaceAll('-', ' '))" class="pi pi-circle-fill border-surface-0 dark:border-dark-900 absolute right-[-3px] top-0 rounded-full border-2 text-[0.6rem]" :class="statusColor"/>
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
