<template>
	<div class="min-h-full p-6">
		<div class="mb-4 flex">
			<NuxtLink to="/probes" class="mr-auto">
				<Button label="Back to probes" icon="pi pi-arrow-left"/>
			</NuxtLink>
		</div>

		<div>
			<h1>Probe Details</h1>

			<p>ID: {{ probeId }}</p>
		</div>
	</div>
</template>

<script setup lang="ts">
	const route = useRoute();
	const probeId = route.params.id;

	useHead(() => {
		return {
			title: `${probeId}`,
		};
	});
</script>
