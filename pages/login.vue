<template>
	<section>
		<div class="login">
			<div class="login__logo">
				<a href="/">
					<img class="login__main-logo" src="~/assets/images/gp-logo.svg" alt="Globalping logo">
				</a>
				<a href="https://www.jsdelivr.com/" class="login__jsd-link">by jsDelivr</a>
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
		position: relative;
	}

	.login__logo {
		display: flex;
		align-items: center;
		margin-bottom: 48px;
	}

	.login__main-logo {
		width: 178px;
		height: 36px;
	}

	.login__jsd-link {
		font-size: 12px;
		margin: 8px;
		color: var(--surface-400);

	}

	.login__title {
		font-size: 28px;
		line-height: 34px;
		color: var(--bluegray-900);
		margin-bottom: 24px;
	}

	.login__text {
		font-size: 14px;
		margin-bottom: 24px;
	}

	.login__gh-button {
		width: 336px;
		height: 40px;
		font-size: 14px;
		font-weight: bold;
		text-align: left;
		padding-left: 18px;
		padding-right: 18px;
	}

	.image {
		background-image: url(~/assets/images/right.svg);
		background-size: cover;
		margin: 8px;
		border-radius: 12px;
	}

	.login__bottom-text {
		color: var(--bluegray-500);
		position: absolute;
		bottom: 48px;
		left: 48px;
	}
</style>
