<template>
	<div class="relative rounded-xl border p-4 pr-0">
		<div class="no-scrollbar overflow-scroll">
			<pre v-for="line in commands" :key="line.toString()"><code>{{ line[0] }}</code><code class="text-bluegray-300 mr-16">{{ line[1] }}</code></pre>
		</div>
		<div class="!absolute right-2 top-2">
			<Button
				class="!bg-surface-0"
				icon="pi pi-copy"
				severity="secondary"
				outlined
				@click="copyCommand"
			/>
			<div v-if="copyTooltip" class="bg-bluegray-700 text-surface-0 absolute left-1/2 top-[-40px] -translate-x-1/2 rounded-md p-2">
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
