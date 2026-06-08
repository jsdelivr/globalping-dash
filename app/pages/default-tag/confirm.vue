<template>
	<div>
		<div v-if="isConfirmed">
			<Message severity="success" class="font-normal">
				<p>Your default probe tag change has been confirmed.</p>
			</Message>
			<p class="mt-4">You can change your tag prefix any time on the <NuxtLink to="/settings" class="underline">settings page</NuxtLink>.</p>
		</div>
		<div v-else>
			<h3>Confirm your default probe tag change?</h3>
			<p class="mt-4">Confirming stops your previous default tag from being used to target your probes. You can change your tag prefix any time on the <NuxtLink to="/settings" class="underline">settings page</NuxtLink>.</p>
			<Divider class="h-2 before:border-t-2"/>

			<div class="flex gap-2">
				<NuxtLink to="/settings" class="w-1/2">
					<Button
						class="h-12 w-full bg-black"
						severity="secondary"
						label="Configure"
					/>
				</NuxtLink>

				<Button
					class="h-12 w-1/2 bg-black"
					severity="contrast"
					label="Confirm"
					:loading="isSubmitting"
					:disabled="!confirmData"
					@click="confirm"
				/>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { customEndpoint } from '@directus/sdk';
	import { sendErrorToast } from '~/utils/send-toast';

	definePageMeta({
		layout: 'info',
	});

	useHead({
		title: 'Confirm prefix change -',
	});

	const { $directus } = useNuxtApp();
	const route = useRoute();
	const isSubmitting = ref(false);
	const isConfirmed = ref(false);
	const confirmData = computed(() => typeof route.query.data === 'string' ? route.query.data.trim() : '');

	async function confirm () {
		if (!confirmData.value || isSubmitting.value || isConfirmed.value) {
			return;
		}

		isSubmitting.value = true;

		try {
			await $directus.request(customEndpoint({ method: 'POST', path: '/sync-github-data/default-tag/confirm', params: { data: confirmData.value } }));
			isConfirmed.value = true;
		} catch (err) {
			sendErrorToast(err);
		} finally {
			isSubmitting.value = false;
		}
	}
</script>
