<template>
	<div class="flex w-full flex-col justify-between gap-2 rounded-lg border px-4 py-3">
		<div class="flex justify-between gap-6">
			<b>Name</b>
			<span class="truncate">{{ app.name }}</span>
		</div>

		<div class="flex justify-between gap-6">
			<b>Owner</b>
			<a v-if="app.owner_url" class="underline" :href="app.owner_url" target="_blank" rel="noopener">{{ app.owner_name }}</a>
			<span v-else>{{ app.owner_name }}</span>
		</div>

		<div class="flex justify-between gap-6">
			<b>Last used</b>
			<span class="truncate">{{ getRelativeTimeString(app.date_last_used, true) || 'Never' }}</span>
		</div>

		<button class="flex w-full items-center justify-center gap-2 rounded-lg border p-2 text-red-500 duration-200 hover:bg-surface-200 dark:hover:bg-dark-600" @click="emit('revoke')">
			<i class="pi pi-undo"/> Revoke access
		</button>
	</div>
</template>

<script setup lang="ts">
	import { getRelativeTimeString } from '~/utils/date-formatters';

	const emit = defineEmits([ 'revoke' ]);

	const { app } = defineProps({
		app: {
			type: Object as PropType<Application>,
			required: true,
		},
	});
</script>
