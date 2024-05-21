<template>
	<section class="grid grid-cols-[480px_auto]">
		<div class="flex flex-col p-12">
			<div class="mb-12 flex items-center">
				<NuxtLink to="/">
					<img class="h-9 w-44" src="~/assets/images/gp-logo.svg" alt="Globalping logo">
				</NuxtLink>
				<NuxtLink to="https://www.jsdelivr.com/" class="text-bluegray-200 m-2 text-xs no-underline hover:underline">by jsDelivr</NuxtLink>
			</div>
			<h1 class="mb-6 text-3xl font-bold">Manage your jsDelivr and Globalping statistics</h1>
			<p class="mb-6">Welcome! Log in to your account.</p>
			<Button
				class="h-10 w-80 bg-black !text-left"
				severity="contrast"
				icon="pi pi-github"
				icon-pos="right"
				label="Log in with GitHub"
				@click="auth.login"
			/>
			<p class="text-bluegray-500 mt-auto">Not authenticated</p>
		</div>
		<div class="m-2 rounded-xl bg-[url('~/assets/images/right.svg')] bg-cover"/>
	</section>
</template>

<script setup>
	import { useAuth } from '~/store/auth';

	definePageMeta({
		layout: false,
	});

	const auth = useAuth();
</script>
