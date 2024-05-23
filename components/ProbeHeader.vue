<template>
	<div class="grid grid-cols-[auto_1fr] grid-rows-[auto_auto] gap-x-3">
		<BigIcon class="probe__icon col-span-1 row-span-2" name="gp" border :status="status"/>
		<p class="col-start-2 col-end-3 font-bold">{{ name || city }}</p>
		<p class="text-bluegray-400 col-start-2 col-end-3 row-start-2 row-end-3 text-[13px]" :class="ipCss">{{ ip }}</p>
	</div>
</template>

<script setup lang="ts">
	defineProps({
		name: {
			type: String,
			default: '',
		},
		city: {
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
