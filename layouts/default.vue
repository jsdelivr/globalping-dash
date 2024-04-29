<template>
	<section class="grid" style="min-height: 100vh;">
		<header class="header"><h2>Header</h2></header>
		<aside class="sidebar">
			<h2>Sidebar</h2>
		</aside>
		<div class="content">
			<slot/>
		</div>
	</section>
</template>

<script lang="ts" setup>
</script>

<style>
body {
	margin: 0;
}
</style>

<style scoped>
	.header, .sidebar, .content {
		border: 2px solid black;
		border-radius: 10px;
	}

	.grid {
		display: grid;
		grid-template-columns: 300px auto;
		grid-template-rows: 80px auto;
	}

	.header {
		grid-column: 1 / 3;
	}
</style>
