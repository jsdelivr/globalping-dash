<template>
	<div>
		<div v-if="isUnsubscribed">
			<Message severity="success" class="font-normal">
				<p>Successfully unsubscribed from <b>{{ type }}</b> probe emails.</p>
				<p class="mt-4">You can configure your notifications on the <NuxtLink to="/settings" class="underline">settings page</NuxtLink>.</p>
			</Message>
		</div>
		<div v-else>
			<h3>Do you want to unsubscribe from <b>{{ type }}</b> probe emails?</h3>
			<p class="mt-4">You can configure your notifications on the <NuxtLink to="/settings" class="underline">settings page</NuxtLink>.</p>
			<Divider class="h-2 before:border-t-2"/>
			<div class="mt-8 flex justify-center">
				<Button
					class="h-12 min-w-40 bg-black"
					severity="contrast"
					label="Unsubscribe"
					:loading="isSubmitting"
					:disabled="!unsubscribeData"
					@click="unsubscribe"
				/>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { customEndpoint } from '@directus/sdk';

	definePageMeta({
		layout: 'info',
	});

	useHead({
		title: 'Unsubscribe -',
	});

	const { $directus } = useNuxtApp();
	const route = useRoute();
	const isSubmitting = ref(false);
	const isUnsubscribed = ref(false);
	const unsubscribeData = computed(() => typeof route.query.data === 'string' ? route.query.data.trim() : '');
	const typeFromData = computed(() => formatEmailTypeLabel(getTypeFromJwt(unsubscribeData.value)));
	const type = computed(() => typeFromData.value ? `"${typeFromData.value}"` : 'all');

	async function unsubscribe () {
		if (!unsubscribeData.value || isSubmitting.value || isUnsubscribed.value) {
			return;
		}

		isSubmitting.value = true;

		try {
			await $directus.request(customEndpoint({ method: 'POST', path: '/email-unsubscribe/unsubscribe', params: { data: unsubscribeData.value } }));
			isUnsubscribed.value = true;
		} finally {
			isSubmitting.value = false;
		}
	}

	function getTypeFromJwt (token: string) {
		const payload = token.split('.')[1];

		if (!payload) {
			return '';
		}

		try {
			const { type } = JSON.parse(decodeBase64Url(payload)) as { type?: string };
			return type ?? '';
		} catch {
			return '';
		}
	}

	function decodeBase64Url (value: string) {
		const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
		return atob(normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), '='));
	}

	function formatEmailTypeLabel (type: string) {
		type = type.trim();

		if (type === '') {
			return '';
		}

		const normalized = type.split(/[_-]+/).filter(Boolean).map(word => word.toLowerCase()).join('\u00A0');
		return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : '';
	}
</script>
