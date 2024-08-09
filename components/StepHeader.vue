<template>
	<div class="w-full">
		<div class="flex items-center">
			<div class="h-px w-full bg-surface-300 dark:bg-dark-400" :class="{'!bg-primary': active || highlighted || isSuccess}"/>
			<div
				class="flex size-8 items-center justify-center rounded-full border bg-surface-0 p-4 text-base dark:border-dark-400 dark:bg-dark-600 dark:text-dark-0"
				:class="{
					'!border-primary !bg-primary text-surface-0': active && !isSuccess,
					'!border-primary !text-primary': highlighted || isSuccess,
				}"
			>
				{{ Number(buttonText) + 1 }}
			</div>
			<div class="h-px w-full bg-surface-300 dark:bg-dark-400" :class="{'!bg-primary': highlighted || isSuccess}"/>
		</div>
		<div class="mt-2 text-center text-bluegray-500 dark:text-dark-0" :class="{'font-bold text-bluegray-700 dark:text-surface-0': active && !isSuccess}">{{ headerText }}</div>
	</div>
</template>

<script setup lang="ts">
	defineProps({
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
		isSuccess: {
			type: Boolean,
			default: false,
		},
	});
</script>
