<template>
	<div class="dark:var(--main-bg) flex min-h-full flex-col gap-y-6 p-6">
		<div class="flex flex-col items-center justify-between gap-y-2 sm:h-10 sm:flex-row">
			<h1 class="text-2xl font-bold leading-8">Your notifications</h1>
			<span
				v-if="inboxNotifIds.length"
				class="rounded-full bg-[var(--p-primary-color)] px-2 py-1 text-sm font-bold leading-[17px] text-[var(--bluegray-0)] sm:ml-auto sm:mr-4"
			>
				{{ inboxNotifIds.length }} unread
			</span>
			<Button
				v-if="inboxNotifIds.length"
				severity="secondary"
				outlined
				label="Mark all as read"
				icon="pi pi-check-circle text-lg"
				@click="markAllNotificationsAsRead()"
			/>
		</div>

		<div v-if="displayedNotifications.length" class="flex w-full max-w-[calc(100vw-16px)] flex-col gap-y-2">
			<div
				v-for="notification in displayedNotifications"
				:key="notification.id"
				:value="notification.id"
				class="group rounded-xl border border-surface-300 bg-white p-0 dark:border-[var(--table-border)] dark:bg-dark-800"
				:class="{ 'cursor-pointer bg-gradient-to-r from-[rgba(244,252,247,1)] to-[rgba(229,252,246,1)] dark:bg-[var(--dark-700)] dark:bg-none': notification.status === 'inbox' }"
				@click="markNotificationAsRead(notification.status === 'inbox' ? [ notification.id ] : [])"
			>
				<div class="relative p-6 pb-4">
					<div class="relative flex flex-col items-start gap-y-1 pr-10">
						<span
							class="text-left text-lg font-bold leading-5 text-[#4b5563] dark:text-dark-0"
							:class="{ 'text-[var(--bluegray-900)] dark:text-[var(--bluegray-0)]': notification.status === 'inbox' }"
						>
							{{ notification.subject }}
						</span>
						<span class="flex items-center gap-x-2 text-bluegray-500">
							<i class="pi pi-clock text-xs"/>
							<span class="text-sm font-normal leading-4">
								{{ formatDateTime(notification.timestamp) }}
							</span>
						</span>
					</div>

					<i
						v-if="notification.status === 'inbox'"
						class="pi pi-check-circle invisible !absolute right-5 top-5 text-lg group-hover:visible"
					/>
				</div>

				<div class="overflow-hidden px-6 pb-6 text-sm font-normal leading-[18px] text-bluegray-900 dark:text-[var(--bluegray-0)]">
					<!-- eslint-disable-next-line vue/no-v-html -->
					<span v-if="notification.message" class="[&_a]:font-semibold [&_a]:text-[var(--p-primary-color)] [&_p:last-child]:mb-0 [&_p]:mb-[18px] [&_p_strong]:break-all" v-html="notification.message"/>
				</div>
			</div>
		</div>

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
	import { useInboxNotificationIds } from '~/composables/useInboxNotificationIds';
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
	const notificationBus = useEventBus<string[]>('notification-updated');
	const inboxNotifIds = useInboxNotificationIds();

	notificationBus.on((idsToArchive) => {
		displayedNotifications.value.forEach((notification) => {
			if (idsToArchive.includes(notification.id)) {
				notification.status = 'archived';
			}
		});
	});

	const markNotificationAsRead = async (notificationIds: string[]) => {
		if (notificationIds.length === 0) {
			return;
		}

		try {
			const updateData = { status: 'archived' };

			await $directus.request(updateNotifications(notificationIds, updateData));

			notificationBus.emit(notificationIds);
		} catch (error) {
			console.error('Error updating notifications:', error);
		}
	};

	const markAllNotificationsAsRead = async () => {
		try {
			await markNotificationAsRead(inboxNotifIds.value);
		} catch (error) {
			console.error('Error updating all notifications:', error);
		}
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
