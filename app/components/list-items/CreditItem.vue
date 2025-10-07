<template>
	<div class="flex w-full flex-col justify-between gap-2 rounded-lg border px-4 py-3">
		<div class="flex justify-between gap-6">
			<b>Date</b>
			<span>{{ creditChange.date_created }}</span>
		</div>

		<div class="flex justify-between gap-6">
			<b>Comment</b>
			<span class="truncate">{{ formatCreditComment(creditChange) }}</span>
		</div>

		<div class="flex justify-between gap-6">
			<b>Amount</b>
			<Tag v-if="creditChange.type === 'addition'" class="flex items-center !text-sm" severity="success">
				<NuxtIcon class="mr-2" name="coin" aria-hidden="true"/>+{{ (creditChange.amount || 0).toLocaleString('en-US') }}
			</Tag>
			<Tag v-else class="flex items-center !text-sm" severity="danger">
				<NuxtIcon class="mr-2" name="coin" aria-hidden="true"/>-{{ (creditChange.amount || 0).toLocaleString('en-US') }}
			</Tag>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { formatCreditComment } from '~/utils/format-credit-comment';

	const { creditChange } = defineProps({
		creditChange: {
			type: Object as PropType<CreditsChange>,
			required: true,
		},
	});
</script>
