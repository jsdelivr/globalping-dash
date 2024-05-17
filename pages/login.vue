<template>
	<section class="grid grid-cols-[480px_auto]">
		<div class="p-12 flex flex-col">
			<div class="flex items-center mb-12">
				<NuxtLink to="/">
					<img class="w-44 h-9" src="~/assets/images/gp-logo.svg" alt="Globalping logo">
				</NuxtLink>
				<NuxtLink to="https://www.jsdelivr.com/" class="m-2 text-xs text-surface-200 no-underline hover:underline">by jsDelivr</NuxtLink>
			</div>
			<h1 class="text-3xl mb-6">Manage your jsDelivr and Globalping statistics</h1>
			<p class="mb-6">Welcome! Log in to your account.</p>
			<Button
				class="w-80 h-10 !text-left bg-black"
				severity="contrast"
				icon="pi pi-github"
				icon-pos="right"
				label="Log in with GitHub"
				@click="auth.login"
			/>
			<div class="filler"/>
			<p class="text-surface-500">Not authenticated</p>
		</div>
		<div class="bg-[url('~/assets/images/right.svg')] bg-cover m-2 rounded-xl"/>
	</section>
</template>

<script setup>
	import { useAuth } from '~/store/auth';

	definePageMeta({
		layout: false,
	});

	const auth = useAuth();
</script>
