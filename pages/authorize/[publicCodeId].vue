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
				<BlockLoading v-if="status === 'pending'"/>

				<div v-else-if="status === 'success' && code">
					<h2 class="text-4xl font-bold">Authorize<br>{{ code?.client.name }}</h2>
					<NuxtLink v-if="code?.client.owner.name" :to="code?.client.owner.url as string" class="text-bluegray-400 hover:underline" target="_blank">by {{ code?.client.owner.name }} <i class="pi pi-external-link text-2xs"/></NuxtLink>
					<span v-else class="text-bluegray-400">by Globalping <i class="pi pi-check-circle text-2xs text-primary"/></span>
					<h3 class="mt-8">to perform measurements under your <strong>{{ auth.user.github_username }}</strong> account.</h3>

					<Divider class="h-2 before:border-t-2"/>

					<div class="flex gap-2">
						<form :action="`${config.public.gpAuthUrl}/oauth/approve/${route.params.publicCodeId}`" method="post" class="w-1/2">
							<input type="hidden" name="approved" value="0">

							<Button
								type="submit"
								class="h-12 w-full bg-black"
								severity="secondary"
								label="Cancel"
							/>
						</form>

						<form :action="`${config.public.gpAuthUrl}/oauth/approve/${route.params.publicCodeId}`" method="post" class="w-1/2">
							<input type="hidden" name="approved" value="1">

							<Button
								type="submit"
								class="h-12 w-full bg-black"
								severity="contrast"
								label="Authorize"
							/>
						</form>
					</div>
				</div>

				<div v-else>
					<Message severity="error" class="font-normal">
						Failed to load the application details.
						Please try refreshing the page.
						<div v-if="codeError"><br>Error code: {{ codeError.statusCode }}</div>
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
	import { useAuth } from '~/store/auth';

	definePageMeta({
		layout: false,
	});

	const auth = useAuth();
	const route = useRoute();
	const config = useRuntimeConfig();

	const { status, data: code, error: codeError } = await useLazyFetch<CodeApprovalDetails>(`${config.public.gpAuthUrl}/oauth/approve/${route.params.publicCodeId}`);

	watch(code, () => {
		useHead({
			title: `Authorize ${code.value?.client.name ? `${code.value?.client.name} ` : ''}- `,
		});
	});
</script>
