<template>
	<GPDialog v-model:visible="visible" :header="confirmation?.header" class="sm:min-w-[32rem]" @after-hide="confirmation?.afterHide?.()">
		<div class="flex items-start gap-4">
			<i class="pi pi-exclamation-triangle mt-0.5 text-xl text-red-500 dark:text-red-400"/>
			<div>
				<p>
					<template v-for="(part, index) in confirmation?.message" :key="index">
						<span v-if="typeof part === 'string'">{{ part }}</span>
						<span v-else class="font-bold">{{ part.bold }}</span>
					</template>
				</p>
				<p v-if="confirmation?.note" class="mt-2 text-sm text-bluegray-500 dark:text-bluegray-300">{{ confirmation.note }}</p>
				<p v-if="confirmation?.warning" class="mt-4 font-bold">{{ confirmation.warning }}</p>
			</div>
		</div>
		<div class="mt-6 text-right">
			<Button class="mr-2" label="Cancel" severity="secondary" text @click="visible = false"/>
			<Button :label="confirmation?.label" severity="danger" :loading="confirming" @click="run"/>
		</div>
	</GPDialog>
</template>

<script setup lang="ts">
	import { sendErrorToast } from '~/utils/send-toast';

	type Confirmation = {
		header: string;
		message: (string | { bold: string })[];
		note?: string;
		warning?: string;
		label: string;
		action: () => Promise<void>;
		afterHide?: () => void;
	};

	const confirmation = ref<Confirmation | null>(null);
	const visible = ref(false);
	const confirming = ref(false);

	const confirm = (value: Confirmation) => {
		confirmation.value = value;
		visible.value = true;
	};

	const run = async () => {
		confirming.value = true;

		try {
			await confirmation.value?.action();
			visible.value = false;
		} catch (e) {
			sendErrorToast(e);
		}

		confirming.value = false;
	};

	defineExpose({ confirm });
</script>
