<template>
	<section class="grid" style="min-height: 100vh;">
		<aside>
			<h1>Sidebar</h1>
			<Button label="Check" icon="pi pi-check"/>
		</aside>
		<slot/>
	</section>
</template>

<script lang="ts" setup>
	console.log('loaded');
</script>

<style scoped>
	.grid {
		display: grid;
		grid-template-columns: 1fr 6fr;
	}
</style>
