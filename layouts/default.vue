<template>
	<section class="grid">
		<header class="header">
			<h2>{{ auth.getUser.github_username }}</h2>
			<Button label="Logout" @click="auth.logout"/>
		</header>
		<aside class="sidebar">
			<h2>Sidebar</h2>
			<ul>
				<li><NuxtLink to="/">Overview</NuxtLink></li>
				<li><NuxtLink to="/probes">Probes</NuxtLink></li>
				<li><NuxtLink to="/credits">Credits</NuxtLink></li>
				<li><NuxtLink to="/tokens">Tokens</NuxtLink></li>
			</ul>
		</aside>
		<div class="content">
			<slot/>
		</div>
	</section>
</template>

<script lang="ts" setup>
	import { useAuth } from '~/store/auth';

	const auth = useAuth();
</script>

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
		display: flex;
	}
</style>
