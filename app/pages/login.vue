<template>
	<section class="grid grid-cols-[480px_auto] max-md:grid-cols-1 dark:bg-dark-800">
		<div class="flex flex-col px-20 py-12 shadow-xl max-[480px]:px-10 dark:shadow-dark-800" style="z-index: 2;">
			<div class="mb-auto flex flex-col">
				<div class="flex items-center">
					<picture class="inline-flex">
						<img class="h-10 " src="~/assets/icons/gp.svg" alt="Globalping logo">
					</picture>
					<div class="ml-3">
						<h1 class="text-xl font-bold">Globalping Dashboard</h1>
						<NuxtLink to="https://www.jsdelivr.com" class="text-s relative top-[-.25rem] text-bluegray-400 hover:underline" target="_blank">
							by jsDelivr <i class="pi pi-external-link text-2xs"/>
						</NuxtLink>
					</div>
				</div>
				<h2 class="mt-8 text-xl text-bluegray-400">Manage your probes, credits, and access tokens</h2>
			</div>

			<div class="mb-auto mt-4">
				<h2 class="text-4xl font-bold">Sign In</h2>
				<Divider class="h-2 before:border-t-2"/>
				<Button
					class="h-12 w-full bg-black !text-left"
					severity="contrast"
					icon="pi pi-github"
					icon-pos="right"
					label="Sign in with GitHub"
					@click="auth.login"
				/>
				<Button
					v-if="showLocalLogin"
					class="mt-3 h-12 w-full !text-left"
					style="--p-primary-color: #64f; --p-primary-hover-color: #53e;"
					icon-pos="right"
					label="Sign in with Directus"
					@click="auth.loginLocal"
				>
					<template #icon>
						<NuxtIcon class="order-1 text-xl" name="directus" aria-hidden="true"/>
					</template>
				</Button>
			</div>

			<NuxtLink to="https://globalping.io/" class="mt-4 text-bluegray-400 hover:underline" target="_blank">
				Learn more about Globalping <i class="pi pi-external-link text-2xs"/>
			</NuxtLink>
		</div>

		<div class="bg-[url('~/assets/images/login-bg.svg')] bg-cover max-md:hidden dark:bg-[url('~/assets/images/login-bg-dark.svg')]"/>

		<GPDialog
			v-model:visible="addCreditsDialog"
			header="Add credits"
			content-class="!p-0"
			size="w-[700px]"
		>
			<GpDialogContentAddCredits @cancel="addCreditsDialog = false"/>
		</GPDialog>

		<GPDialog
			v-model:visible="startAProbeDialog"
			header="Start a probe"
			content-class="!p-0"
			size="w-[700px]"
		>
			<GpDialogContentStartProbeLogin @cancel="startAProbeDialog = false"/>
		</GPDialog>
	</section>
</template>

<script setup lang="ts">
	import { useAuth } from '~/store/auth';

	definePageMeta({
		layout: 'custom',
	});

	useHead({
		title: 'Sign In -',
	});

	const auth = useAuth();
	const route = useRoute();
	const showLocalLogin = computed(() => route.query['sign-in'] === undefined
		? [ 'localhost', '127.0.0.1', '[::1]' ].includes(location.hostname)
		: route.query['sign-in'] === 'directus');
	let redirectHasCreditsView = false;
	let redirectHasProbeView = false;

	const redirect = Array.isArray(route.query.redirect) ? route.query.redirect[0] : route.query.redirect;

	if (redirect) {
		const redirectUrl = new URL(redirect);
		redirectHasCreditsView = redirectUrl.searchParams.get('view') === 'add-credits';
		redirectHasProbeView = redirectUrl.searchParams.get('view') === 'start-a-probe';
	}

	const addCreditsDialog = ref(route.query.view === 'add-credits' || redirectHasCreditsView);
	const startAProbeDialog = ref(route.query.view === 'start-a-probe' || redirectHasProbeView);
</script>
