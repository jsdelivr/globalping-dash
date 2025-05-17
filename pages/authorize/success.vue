<template>
	<section class="grid max-md:grid-cols-1 dark:bg-dark-800">
		<div class="absolute flex w-full max-w-[480px] flex-col self-center justify-self-center bg-white px-20 py-12 shadow-xl max-[480px]:h-full max-[480px]:max-w-none dark:bg-dark-800 dark:shadow-dark-900" style="z-index: 2;">
			<div class="mb-12 flex flex-col max-[480px]:mb-auto">
				<div class="flex items-center">
					<picture class="inline-flex">
						<img class="h-10 " src="~/assets/icons/gp.svg" alt="Globalping logo">
					</picture>
					<div class="ml-3">
						<h1 class="text-xl font-bold">Globalping</h1>
					</div>
				</div>
			</div>

			<div class="mb-auto mt-4">
				<div>
					<Message severity="success" class="font-normal">
						Success! You may close this tab and return to your application.
					</Message>
				</div>
			</div>

			<NuxtLink to="https://globalping.io/" class="mt-16 text-bluegray-400 hover:underline max-[480px]:mt-4" target="_blank">
				Learn more about Globalping <i class="pi pi-external-link text-2xs"/>
			</NuxtLink>
		</div>

		<div class="bg-[url('~/assets/images/login-bg.svg')] bg-cover max-[480px]:hidden dark:bg-[url('~/assets/images/login-bg-dark.svg')]"/>
	</section>
</template>

<script setup lang="ts">
	definePageMeta({
		layout: 'custom',
	});

	useHead({
		title: `Authentication Successful -`,
	});
</script>
