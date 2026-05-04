<template>
	<div>
		<div v-if="isUnsubscribed">
			<Message severity="success" class="font-normal">
				<p>Successfully unsubscribed from <strong>{{ type }}</strong> emails.</p>
			</Message>
			<p class="mt-4">You can also configure all notification types on the <NuxtLink to="/settings" class="underline">settings page</NuxtLink>.</p>
		</div>
		<div v-else>
			<h3>Do you want to unsubscribe from <strong>{{ type }}</strong> emails?</h3>
			<p class="mt-4">You can also configure all notification types on the <NuxtLink to="/settings" class="underline">settings page</NuxtLink>.</p>
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
	import { useErrorToast } from '~/composables/useErrorToast';
	import { useAuth } from '~/store/auth';
	import { sendErrorToast } from '~/utils/send-toast';

	definePageMeta({
		layout: 'info',
	});

	useHead({
		title: 'Unsubscribe -',
	});

	const { $directus } = useNuxtApp();
	const auth = useAuth();
	const route = useRoute();
	const isSubmitting = ref(false);
	const isUnsubscribed = ref(false);
	const unsubscribeData = computed(() => typeof route.query.data === 'string' ? route.query.data.trim() : '');

	const { data: notificationTypes, error: notificationTypesError } = useLazyAsyncData(
		'settings-notification-types',
		() => $directus.request<NotificationTypes>(customEndpoint({
			method: 'GET',
			path: '/metadata/notification-types',
		})),
		{ default: () => ({}) as NotificationTypes },
	);
	useErrorToast(notificationTypesError);
	const type = computed(() => {
		const jwtType = getTypeFromJwt(unsubscribeData.value) || 'all';
		return notificationTypes.value[jwtType]?.description ?? jwtType;
	});

	async function unsubscribe () {
		if (!unsubscribeData.value || isSubmitting.value || isUnsubscribed.value) {
			return;
		}

		isSubmitting.value = true;

		try {
			await $directus.request(customEndpoint({ method: 'POST', path: '/email-unsubscribe/unsubscribe', params: { data: unsubscribeData.value } }));
			isUnsubscribed.value = true;
			await auth.refresh();
		} catch (err) {
			sendErrorToast(err);
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
</script>
