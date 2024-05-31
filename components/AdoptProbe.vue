<template>
	<TabView class="border-t" :pt="{ inkbar: {class: 'hidden'}}">
		<TabPanel>
			<template #header>
				<i class="pi pi-check mr-2"/>I'm already running a probe
			</template>
			<p class="mb-4 mt-2 text-lg font-bold">Set up your probe</p>
		</TabPanel>
		<TabPanel>
			<template #header>
				<i class="pi pi-times mr-2"/>I'm not running a probe
			</template>
			<p class="mb-4 mt-2 text-lg font-bold">Join the network</p>
			<StartProbe/>
		</TabPanel>
	</TabView>
</template>

<script setup lang="ts">
</script>
