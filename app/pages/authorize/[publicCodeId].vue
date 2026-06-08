<template>
	<div class="my-4">
		<BlockLoading v-if="status === 'pending'"/>

		<div v-else-if="status === 'success' && code">
			<h2 class="text-3xl font-bold">Authorize<br>{{ code?.client.name }}</h2>
			<NuxtLink v-if="code?.client.owner.name" :to="code?.client.owner.url as string" class="text-bluegray-400 hover:underline" target="_blank">by {{ code?.client.owner.name }} <i class="pi pi-external-link text-2xs"/></NuxtLink>
			<span v-else class="text-bluegray-400">by Globalping <i class="pi pi-check-circle text-2xs text-primary"/></span>
			<h3 class="mt-8">to perform measurements under your <strong>{{ user.github_username }}</strong> account.</h3>

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
</template>

<script setup lang="ts">
	import { useAuth } from '~/store/auth';

	definePageMeta({
		layout: 'info',
	});

	const auth = useAuth();
	const { user } = storeToRefs(auth);
	const route = useRoute();
	const config = useRuntimeConfig();

	const { status, data: code, error: codeError } = await useLazyFetch<CodeApprovalDetails>(`${config.public.gpAuthUrl}/oauth/approve/${route.params.publicCodeId}`);

	watch(code, () => {
		useHead({
			title: `Authorize ${code.value?.client.name ? `${code.value?.client.name} ` : ''}- `,
		});
	});
</script>
