<template>
	<div class="flex min-h-full flex-col gap-y-6 bg-surface-50 p-6">
		<div class="flex flex-col items-center justify-between gap-y-2 sm:h-10 sm:flex-row">
			<h1 class="text-2xl font-bold leading-8">Your notifications</h1>
			<Button
				v-if="displayedNotifications.length"
				class="btn-mark-all-as-read"
				@click="markAllNotificationsAsRead()"
			>
				<i class="pi pi-check-circle text-lg "/>
				<span class="text-sm font-semibold">Mark all as read</span>
			</Button>
		</div>

		<Accordion v-if="displayedNotifications.length" class="flex w-full max-w-[calc(100vw-16px)] flex-col gap-y-2" expand-icon="pi pi-chevron-right">
			<AccordionPanel
				v-for="notification in displayedNotifications"
				:key="notification.id"
				:value="notification.id"
				class="notification border border-surface-300 bg-white p-6"
				:class="{ 'new-notification': notification.status === 'inbox' }"
				@click="markNotificationAsRead(notification.status === 'inbox' ? [ notification.id ] : [])"
			>
				<AccordionHeader>
					<div class="flex flex-col !items-start gap-y-1">
						<span class="n-header-subj text-left text-lg font-bold leading-5">{{ notification.subject }}</span>
						<span class="flex items-center gap-x-2 text-bluegray-500">
							<i class="pi pi-clock text-sm"/>
							<span class="text-sm font-normal leading-4">{{ formatDateTime(notification.timestamp) }}</span>
						</span>
					</div>
				</AccordionHeader>

				<AccordionContent>
					<!-- eslint-disable-next-line vue/no-v-html -->
					<span v-if="notification.message" v-html="notification.message"/>
				</AccordionContent>
			</AccordionPanel>
		</Accordion>

		<p v-else class="p-4 text-lg font-bold leading-5">No notifications at the moment.</p>

		<Paginator
			class="mt-9"
			:first="first"
			:rows="itemsPerPage"
			:total-records="notificationsCount"
			template="PrevPageLink PageLinks NextPageLink"
			@page="page = $event.page"
		/>
	</div>
</template>

<script setup lang="ts">
	import { readNotifications, updateNotifications } from '@directus/sdk';
	import { usePagination } from '~/composables/pagination';
	import { useAuth } from '~/store/auth';
	import { formatDateTime } from '~/utils/date-formatters';
	import { sendErrorToast } from '~/utils/send-toast';

	const config = useRuntimeConfig();
	const { $directus } = useNuxtApp();
	const auth = useAuth();
	const user = auth.getUser as User;
	const itemsPerPage = config.public.itemsPerTablePage;
	const { page, first } = usePagination({ itemsPerPage });
	const displayedNotifications = ref<DirectusNotification[]>([]);
	const notificationsCount = ref<number>(0);

	const markNotificationAsRead = async (notificationIds: string[]) => {
		if (notificationIds.length === 0) {
			return;
		}

		try {
			const updateData = { status: 'archived' };

			await $directus.request(updateNotifications(notificationIds, updateData));

			displayedNotifications.value.forEach((notification) => {
				if (notificationIds.includes(notification.id)) {
					notification.status = 'archived';
				}
			});
		} catch (error) {
			console.error('Error updating notifications:', error);
		}
	};

	const markAllNotificationsAsRead = async () => {
		const notificationIds = displayedNotifications.value.filter(n => n.status === 'inbox').map(n => n.id);

		markNotificationAsRead(notificationIds);
	};

	// get initial notifications
	const { data: notifications } = await useAsyncData('directus_notifications_page', async () => {
		return $directus.request<DirectusNotification[]>(readNotifications({
			format: 'html',
			limit: itemsPerPage,
			offset: page.value * itemsPerPage,
			filter: {
				recipient: { _eq: user.id },
			},
			sort: [ '-timestamp' ],
		}));
	}, { default: () => [] });

	displayedNotifications.value = notifications.value;

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
				count: [ 'id' ],
			},
		}));
	}, { default: () => [] });

	notificationsCount.value = (cntResponse.value as NotificationCntResponse)?.[0]?.count?.id ?? 0;

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
					sort: [ '-timestamp' ],
				})),
				$directus.request<NotificationCntResponse>(readNotifications({
					filter: {
						recipient: { _eq: user.id },
					},
					aggregate: {
						count: [ 'id' ],
					},
				})),
			]);

			displayedNotifications.value = notificationsResp;
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
	.n-header-subj {
		color: #4b5563;
	}

	.new-notification {
		@apply bg-gradient-to-r from-[rgba(244,252,247,1)] to-[rgba(229,252,246,1)];
	}

	.new-notification .n-header-subj {
		@apply !text-[var(--bluegray-900)];
	}

	.btn-mark-all-as-read {
		@apply flex items-center gap-x-2;
		@apply bg-white !text-bluegray-900;
		@apply h-10 w-full sm:w-auto;
		@apply border border-solid !border-[var(--p-surface-300)];
		@apply hover:!border-[var(--p-primary-500)] hover:!bg-[var(--p-primary-500)] hover:!text-white;
	}
</style>
