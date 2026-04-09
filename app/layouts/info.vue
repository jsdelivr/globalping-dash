<template>
	<section class="grid max-md:grid-cols-1 dark:bg-dark-800">
		<Toast class="max-[440px]:left-5 max-[440px]:w-auto"/>
		<div class="absolute flex w-full max-w-[480px] flex-col place-self-center bg-white px-20 py-12 shadow-xl max-[480px]:h-full max-[480px]:max-w-none dark:bg-dark-800 dark:shadow-dark-900" style="z-index: 2;">
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
				<slot/>
			</div>

			<NuxtLink to="https://globalping.io/" class="mt-16 text-bluegray-400 hover:underline max-[480px]:mt-4" target="_blank" rel="noopener noreferrer">
				Learn more about Globalping <i class="pi pi-external-link text-2xs"/>
			</NuxtLink>
		</div>

		<div class="bg-[url('~/assets/images/login-bg.svg')] bg-cover max-[480px]:hidden dark:bg-[url('~/assets/images/login-bg-dark.svg')]"/>
	</section>
</template>

<script setup lang="ts">
	import { useAppearance } from '~/store/appearance';
	const appearance = useAppearance();

	useHead({
		meta: [
			{ name: 'theme-color', content: () => appearance.theme === 'light' ? '#ffffff' : '#17233a' },
		],
	});
</script>
