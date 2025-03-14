<template>
	<div class="p-5">
		<div class="rounded-xl bg-green-400/10 p-6">
			<p class="flex items-center justify-center text-center text-lg font-bold">
				<i class="pi pi-verified mr-2 text-green-600"/>
				Congratulations!
			</p>
			<p class="mt-4 text-center">You are now the owner of the following probe:</p>
			<div v-for="probe in probes" :key="probe.id" class="mt-4 rounded-xl border bg-surface-0 p-3 text-center dark:border-dark-400 dark:bg-dark-800">
				<p class="flex items-center justify-center font-bold"><CountryFlag :country="probe.country" size="small"/><span class="ml-2">{{ probe.city }}</span></p>
				<p>{{ probe.network }}</p>
			</div>
		</div>
		<p class="mt-4">The probe will generate credits that you can use to run more tests. We also recommend you verify and correct the probe's location.</p>
		<div class="mt-7 flex justify-end">
			<Button label="Finish" @click="$emit('cancel')"/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import CountryFlag from 'vue-country-flag-next';

	defineProps({
		probes: {
			type: Array as PropType<Probe[]>,
			default: () => [],
		},
	});

	defineEmits([ 'cancel' ]);
</script>
