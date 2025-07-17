<template>
	<div class="!absolute right-2 top-2">
		<Button
			v-tooltip.top="'Copy'"
			icon="pi pi-copy"
			severity="secondary"
			aria-label="Copy"
			outlined
			@click="copyCommand"
		/>
		<!-- This needs to match the v-tooltip styles. -->
		<div v-if="copyTooltip" role="tooltip" style="display: inline-block; width: fit-content; z-index: 1000;" class="p-fadein absolute left-1/2 top-[-45px] -translate-x-1/2 px-0 py-1  font-normal text-surface-0">
			<div class="absolute left-1/2 -ml-2.5 size-0 border-x-[10px] border-b-0 border-t-[10px] border-solid border-transparent border-t-bluegray-700" style="bottom: 0; left: 50%;"/>
			<div class="rounded-md bg-bluegray-700 p-3 leading-none">Copied!</div>
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
	const copyCommand = async (event: Event) => {
		const button = event.currentTarget as HTMLButtonElement;
		let result: string;

		if (Array.isArray(props.content)) {
			result = props.content.map(parts => Array.isArray(parts) ? parts.join('') : parts).join('\n');
		} else {
			result = props.content;
		}

		await navigator.clipboard.writeText(result);
		copyTooltip.value = true;

		setTimeout(() => {
			copyTooltip.value = false;
			button.blur();
		}, 1000);
	};
</script>
