<template>
	<div class="flex w-full flex-col justify-between gap-2 rounded-lg border px-4 py-3">
		<div class="flex justify-between gap-6">
			<b>Name</b>
			<span class="truncate">{{ token.name }}</span>
		</div>

		<div class="flex justify-between gap-6">
			<b>Created</b>
			<span class="truncate">{{ getRelativeTimeString(token.date_created) || 'Never' }}</span>
		</div>

		<div class="flex justify-between gap-6">
			<b>Last used</b>
			<span class="truncate">{{ getRelativeTimeString(token.date_last_used, true) || 'Never' }}</span>
		</div>

		<div class="flex justify-between gap-6">
			<b>Expires in</b>
			<span class="truncate">{{ formatDate(token.expire) || 'Never' }}</span>
		</div>

		<div v-if="token.origins.length" class="flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
			<b class="mr-auto">Origins</b>
			<Tag v-for="origin in token.origins" :key="origin" class="flex py-0.5 font-normal" severity="secondary" :value="origin"/>
		</div>

		<div class="grid grid-cols-3 grid-rows-1 gap-2">
			<button aria-label="Edit token" class="rounded-lg border p-2 duration-200 hover:bg-surface-200 dark:hover:bg-dark-600" @click="emit('edit')">
				<i class="pi pi-pencil"/>
			</button>
			<button aria-label="Regenerate token" class="rounded-lg border p-2 duration-200 hover:bg-surface-200 dark:hover:bg-dark-600" @click="emit('regenerate')">
				<i class="pi pi-refresh"/>
			</button>
			<button aria-label="Delete token" class="rounded-lg border p-2 duration-200 hover:bg-surface-200 dark:hover:bg-dark-600" @click="emit('delete')">
				<i class="pi pi-trash text-red-500"/>
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { formatDate, getRelativeTimeString } from '~/utils/date-formatters';

	const emit = defineEmits([ 'edit', 'regenerate', 'delete' ]);

	const { token } = defineProps({
		token: {
			type: Object as PropType<Token>,
			required: true,
		},
	});
</script>
