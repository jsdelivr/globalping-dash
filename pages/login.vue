<template>
	<section>
		<div class="login">
			<div class="login__logo">
				<NuxtLink to="/">
					<img class="login__main-logo" src="~/assets/images/gp-logo.svg" alt="Globalping logo">
				</NuxtLink>
				<NuxtLink to="https://www.jsdelivr.com/" class="login__jsd-link">by jsDelivr</NuxtLink>
			</div>
			<h1 class="login__title">Manage your jsDelivr and Globalping statistics</h1>
			<p class="login__text">Welcome! Log in to your account.</p>
			<Button
				class="login__gh-button"
				severity="contrast"
				icon="pi pi-github"
				icon-pos="right"
				label="Log in with GitHub"
				@click="auth.login"
			/>
			<div class="login__filler"/>
			<p class="login__bottom-text">Not authenticated</p>
		</div>
		<div class="image"/>
	</section>
</template>

<script setup>
	import { useAuth } from '~/store/auth';

	definePageMeta({
		layout: false,
	});

	const auth = useAuth();
</script>

<style scoped>
	section {
		min-height: 100vh;
		display: grid;
		grid-template-columns: 480px auto;
	}

	.login {
		padding: 48px;
		display: flex;
		flex-direction: column;
	}

	.login__logo {
		display: flex;
		align-items: center;
		margin-bottom: 48px;
	}

	.login__main-logo {
		width: 180px;
		height: 36px;
	}

	.login__jsd-link {
		text-decoration: none;
		font-size: 12px;
		margin: 8px;
		color: var(--bluegray-200);
	}

	.login__jsd-link:hover {
		text-decoration: underline;
	}

	.login__title {
		font-size: 28px;
		line-height: 34px;
		margin-bottom: 24px;
	}

	.login__text {
		margin-bottom: 24px;
	}

	.login__gh-button {
		width: 336px;
		height: 40px;
		text-align: left;
	}

	.image {
		background-image: url(~/assets/images/right.svg);
		background-size: cover;
		margin: 8px;
		border-radius: 12px;
	}

	.login__filler {
		flex-grow: 1;
	}

	.login__bottom-text {
		color: var(--bluegray-500);
	}
</style>
