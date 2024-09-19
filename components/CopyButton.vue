<template>
	<div class="!absolute right-2 top-2">
		<Button
			icon="pi pi-copy"
			severity="secondary"
			aria-label="Copy"
			outlined
			@click="copyCommand"
		/>
		<div v-if="copyTooltip" class="absolute -top-10 left-1/2 -translate-x-1/2 rounded-md bg-bluegray-700 p-2 text-surface-0">
			Copied!
		</div>
	</div>
</template>

<script setup lang="ts">
	const props = defineProps({
		content: {
			type: [
				String,
				Array as () => string[] | string[][],
			],
			required: true,
		},
	});

	const copyTooltip = ref(false);
	const copyCommand = async () => {
		let result: string;

		if (Array.isArray(props.content)) {
			result = props.content.map(parts => Array.isArray(parts) ? parts.join('') : parts).join('\n');
		} else {
			result = props.content;
		}

		await navigator.clipboard.writeText(result);
		copyTooltip.value = true;
		setTimeout(() => copyTooltip.value = false, 1000);
	};
</script>
