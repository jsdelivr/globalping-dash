<template>
	<div class="relative rounded-xl border bg-surface-0 p-4 dark:bg-dark-900">
		<CopyButton :content="props.commands"/>
		<div class="no-scrollbar overflow-scroll">
			<pre v-for="line in commands" :key="line.toString()" class="flex min-h-[22px] items-center"><span class="pr-12"><code>{{ line[0] }}</code><code class="text-bluegray-300">{{ line[1] }}</code></span></pre>
		</div>
	</div>
</template>

<script setup lang="ts">
	const props = defineProps({
		commands: {
			type: Array as PropType<string[][]>,
			default: () => [],
		},
	});
</script>
