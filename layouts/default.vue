<template>
	<section class="grid" style="min-height: 100vh;">
		<header class="header">
			<h2>{{ username }}</h2>
			<Button label="Logout" @click="logoutClick"/>
		</header>
		<aside class="sidebar">
			<h2>Sidebar</h2>
		</aside>
		<div class="content">
			<slot/>
		</div>
	</section>
</template>

<script lang="ts" setup>
	const { logout } = useDirectusAuth();
	const user = useDirectusUser();

	const username = user.value.github_username;

	const logoutClick = async () => {
		try {
			await logout();
		} catch (error) {
			console.error(error);
		} finally {
			reloadNuxtApp({ force: true });
		}
	};
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
