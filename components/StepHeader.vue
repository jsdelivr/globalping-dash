<template>
	<div class="w-full">
		<div class="flex items-center">
			<div class="bg-surface-300 h-px w-full" :class="{'!bg-primary': active || highlighted || isSuccess}"/>
			<div
				class="bg-surface-0 flex size-8 items-center justify-center rounded-full border p-4 text-base"
				:class="{
					'!bg-primary text-surface-0 border-primary': active && !isSuccess,
					'border-primary text-primary': highlighted || isSuccess,
				}"
			>
				{{ buttonText }}
			</div>
			<div class="bg-surface-300 h-px w-full" :class="{'!bg-primary': highlighted || isSuccess}"/>
		</div>
		<div class="text-bluegray-500 mt-2 text-center" :class="{'text-bluegray-700 font-bold': active && !isSuccess}">{{ headerText }}</div>
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
