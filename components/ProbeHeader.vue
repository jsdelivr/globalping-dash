<template>
	<div class="grid grid-cols-[auto_1fr] grid-rows-[auto_auto] gap-x-3">
		<BigIcon class="col-span-1 row-span-2" :name="hardwareDevice ? 'gp' : 'docker'" border :status="status"/>
		<p class="col-start-2 col-end-3 flex items-center font-bold">{{ name }}</p>
		<p class="col-start-2 col-end-3 row-start-2 row-end-3 text-bluegray-400" :class="ipCss">{{ ip }}</p>
	</div>
</template>

<script setup lang="ts">
	defineProps({
		hardwareDevice: {
			type: Boolean,
			default: false,
		},
		name: {
			type: String,
			default: '',
		},
		status: {
			type: String,
			default: '',
		},
		ip: {
			type: String,
			default: '',
		},
		ipCss: {
			type: String,
			default: '',
		},
	});
</script>
