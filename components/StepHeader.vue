<template>
	<div class="w-full">
		<div class="flex items-center">
			<div class="bg-surface-300 h-px w-full" :class="{'!bg-primary': active || highlighted}"/>
			<Button
				rounded
				:label="buttonText"
				class="size-8 !p-4"
				:class="{'border-surface-300': !active && !highlighted}"
				:outlined="!active"
				:severity="!active && !highlighted ? 'secondary' : undefined"
				@click="onClick"
			/>
			<div class="bg-surface-300 h-px w-full" :class="{'!bg-primary': highlighted}"/>
		</div>
		<div class="text-bluegray-500 mt-2 text-center" :class="{'text-bluegray-700 font-bold': active}">{{ headerText }}</div>
	</div>
</template>

<script setup lang="ts">
	defineProps({
		onClick: {
			type: Function as any,
			default: () => {},
		},
		buttonText: {
			type: String,
			default: '',
		},
		headerText: {
			type: String,
			default: '',
		},
		active: {
			type: Boolean,
			default: false,
		},
		highlighted: {
			type: Boolean,
			default: false,
		},
	});
</script>
