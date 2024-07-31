<template>
	<div class="relative rounded-xl border bg-surface-0 p-4 pr-0 dark:bg-dark-900">
		<div class="no-scrollbar overflow-scroll">
			<pre v-for="line in commands" :key="line.toString()"><code>{{ line[0] }}</code><code class="mr-16 text-bluegray-300">{{ line[1] }}</code></pre>
		</div>
		<div class="!absolute right-2 top-2">
			<Button
				icon="pi pi-copy"
				severity="secondary"
				outlined
				aria-label="Copy"
				@click="copyCommand"
			/>
			<div v-if="copyTooltip" class="absolute -top-10 left-1/2 -translate-x-1/2 rounded-md bg-bluegray-700 p-2 text-surface-0">
				Copied!
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	const props = defineProps({
		commands: {
			type: Array as () => string[][],
			default: () => [],
		},
	});

	const copyTooltip = ref(false);
	const copyCommand = async () => {
		const content = props.commands.map(parts => parts.join('')).join('\n');

		await navigator.clipboard.writeText(content);
		copyTooltip.value = true;
		setTimeout(() => copyTooltip.value = false, 1000);
	};
</script>
