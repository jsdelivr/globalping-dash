<template>
	<section class="grid grid-cols-[420px_auto] max-md:grid-cols-1">
		<div class="flex flex-col p-12">
			<div class="mb-auto flex flex-col">
				<div class="flex items-center">
					<picture class="inline-flex">
						<img class="h-10 " src="~/assets/icons/gp.svg" alt="Globalping logo">
					</picture>
					<div class="ml-3">
						<h1 class="text-xl font-bold">Globalping Dashboard</h1>
						<NuxtLink to="https://www.jsdelivr.com" class="text-bluegray-400 text-s relative top-[-.25rem] hover:underline" target="_blank">
							by jsDelivr <i class="pi pi-external-link text-2xs"/>
						</NuxtLink>
					</div>
				</div>
				<h2 class="text-bluegray-400 mt-8 text-xl">Manage your probes, credits, and access tokens</h2>
			</div>

			<div class="mb-auto">
				<h2 class="text-3xl font-bold">Sign in</h2>
				<Divider class="h-2 before:border-t-2"/>
				<Button
					class="h-12 w-full bg-black !text-left"
					severity="contrast"
					icon="pi pi-github"
					icon-pos="right"
					label="Sign in with GitHub"
					@click="auth.login"
				/>
			</div>

			<NuxtLink to="https://globalping.io/" class="text-bluegray-400 hover:underline" target="_blank">Learn more about Globaling <i class="pi pi-external-link text-2xs"/></NuxtLink>
		</div>

		<div class="m-2 rounded-xl bg-[url('~/assets/images/login-bg.svg')] bg-cover max-md:hidden dark:bg-[url('~/assets/images/login-bg-dark.svg')]"/>
	</section>
</template>

<script setup lang="ts">
	import { useAuth } from '~/store/auth';

	definePageMeta({
		layout: false,
	});

	useHead({
		title: 'Log In -',
	});

	const auth = useAuth();
</script>
