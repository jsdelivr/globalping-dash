<template>
	<div class="flex min-h-full flex-col gap-y-6 bg-surface-50 p-6">
		<div class="flex h-10 items-center justify-between">
			<h1 class="text-2xl font-bold leading-8">Your notifications</h1>
			<Button class="flex h-10 items-center gap-x-2 border border-solid border-[var(--p-surface-300)] bg-white !text-bluegray-900 hover:border-[var(--p-primary-500)] hover:bg-[var(--p-primary-500)] hover:!text-white">
				<i class="pi pi-check-circle text-lg "/>
				<span class="text-sm font-semibold">Mark all as read</span>
			</Button>
		</div>

		<Accordion v-if="displayedNotifications.length" class="flex w-full max-w-[calc(100vw-16px)] flex-col gap-y-2" expand-icon="pi pi-chevron-right">
			<AccordionPanel
				v-for="notification in displayedNotifications"
				:key="notification.id"
				:value="notification.id"
				class="notification rounded-xl border border-surface-300 bg-white p-6"
				@click="markNotificationAsRead(notification.id)"
			>
				<!-- <AccordionHeader :class="{ '!font-normal': notification.status !== 'inbox'}"> -->
				<AccordionHeader class="!p-0">
					<div class="flex flex-col !items-start gap-y-1">
						<span class="n-header-subj text-lg font-bold leading-5">{{ notification.subject }}</span>
						<span class="flex items-center gap-x-2 text-bluegray-500">
							<i class="pi pi-clock text-sm"/>
							<span class="text-sm font-normal leading-4">{{ formatNotificationDate(notification.timestamp) }}</span>
						</span>
					</div>
				</AccordionHeader>
				<AccordionContent class="pt-4 text-sm font-normal leading-[18px] text-bluegray-900">
					<!-- eslint-disable-next-line vue/no-v-html -->
					<span v-if="notification.message" v-html="notification.message"/>
				</AccordionContent>
			</AccordionPanel>
		</Accordion>

		<Paginator
			class="mt-9"
			:first="first"
			:rows="itemsPerPage"
			:totalRecords="notificationsCount"
			template="PrevPageLink PageLinks NextPageLink"
			@page="page = $event.page"
		/>
	</div>
</template>

<script setup lang="ts">
	import { aggregate, readNotifications, updateNotifications } from '@directus/sdk';
	import { usePagination } from '~/composables/pagination';
	import { useAuth } from '~/store/auth';
	import { formatNotificationDate } from '~/utils/date-formatters';
	import { sendErrorToast } from '~/utils/send-toast';

	const config = useRuntimeConfig();
	const { $directus } = useNuxtApp();
	const auth = useAuth();
	const user = auth.getUser as User;
	const itemsPerPage = config.public.itemsPerTablePage;
	const { page, first } = usePagination({ itemsPerPage });
	const displayedNotifications = ref<DirectusNotification[]>([]);
	const notificationsCount = ref<number>(0);

	const markNotificationAsRead = async (id: number) => {
		const notification = notifications.value.find(notification => notification.id === id);

		if (!notification) {
			return;
		}

		notification.status = 'archived';
		await $directus.request(updateNotifications([ notification.id ], { status: notification.status }));
	};

	// get initial notifications, server side
	const { data: notifications } = await useAsyncData('directus_notifications', async () => {
		// TOO: 43, check this, it seems this func is never called at all
		return $directus.request<DirectusNotification[]>(readNotifications({
			format: 'html',
			limit: itemsPerPage,
			offset: 0,
			filter: {
				recipient: { _eq: user.id },
			},
		}));
	}, { default: () => [] });

	type NotificationCntResponse = {
		count: {
			id: number;
		};
	}[];

	// get the count of notifications
	const { data: cntResponse } = await useAsyncData('directus_notifications_cnt', async () => {
		return $directus.request(readNotifications({
			filter: {
				recipient: { _eq: user.id },
			},
			aggregate: {
				count: ['id'],
			},
		}));
	}, { default: () => [] });

	notificationsCount.value = (cntResponse.value as NotificationCntResponse)?.[0]?.count?.id ?? 0;
	displayedNotifications.value = notifications.value.reverse();

	const loadNotifications = async (pageNumber: number) => {
		try {
			const [ notificationsResp, notificationsCntResp ] = await Promise.all([
				$directus.request<DirectusNotification[]>(readNotifications({
					format: 'html',
					limit: itemsPerPage,
					offset: pageNumber * itemsPerPage,
					filter: {
						recipient: { _eq: user.id },
					},
				})),
				$directus.request<NotificationCntResponse>(readNotifications({
					filter: {
						recipient: { _eq: user.id },
					},
					aggregate: {
						count: ['id'],
					},
				})),
			]);

			displayedNotifications.value = notificationsResp.reverse();
			notificationsCount.value = notificationsCntResp?.[0]?.count?.id ?? 0;
		} catch (e) {
			sendErrorToast(e);
		}
	};

	// get notifications depending on the selected page in Paginator
	watch(page, async () => {
		await loadNotifications(page.value);
	});
</script>

<style scoped>
	.notification:hover {
		@apply bg-gradient-to-r from-[rgba(244,252,247,1)] to-[rgba(229,252,246,1)];
		cursor: pointer;
	}

	.n-header-subj {
		color: #4b5563;
	}
</style>
