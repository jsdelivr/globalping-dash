<template>
	<div class="dark:var(--main-bg) flex min-h-full flex-col p-4 sm:p-6">
		<div class="flex flex-col items-center justify-between gap-y-2 sm:h-10 sm:flex-row">
			<h1 class="text-2xl font-bold leading-8">Your notifications</h1>
			<span
				v-if="inboxNotificationIds.length"
				class="rounded-full bg-primary px-2 py-1 text-sm font-bold leading-[17px] text-bluegray-0 sm:ml-auto sm:mr-4"
			>
				{{ inboxNotificationIds.length }} unread
			</span>
			<Button
				v-if="inboxNotificationIds.length"
				:disabled="auth.adminMode"
				severity="secondary"
				outlined
				label="Mark all as read"
				icon="pi pi-check-circle text-lg"
				@click="markAllNotificationsAsRead()"
			/>
		</div>

		<div v-if="displayedNotifications.length" class="mt-6 flex w-full max-w-[calc(100vw-16px)] flex-col gap-y-2">
			<div
				v-for="notification in displayedNotifications"
				:key="notification.id"
				:value="notification.id"
				class="group rounded-xl border border-surface-300 bg-white p-0 dark:border-table-border dark:bg-dark-800"
				:class="{ 'cursor-pointer bg-gradient-to-r from-[rgba(244,252,247,1)] to-[rgba(229,252,246,1)] dark:bg-dark-700 dark:bg-none': notification.status === 'inbox' }"
				@click="markNotificationsAsRead(notification.status === 'inbox' ? [ notification.id ] : [])"
			>
				<div class="relative p-6 pb-4">
					<div class="relative flex flex-col items-start gap-y-1 pr-10">
						<span
							class="text-left text-lg font-bold leading-5 text-[#4b5563] dark:text-dark-0"
							:class="{ 'text-bluegray-900 dark:text-bluegray-0': notification.status === 'inbox' }"
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

				<div class="overflow-hidden px-4 pb-6 text-sm font-normal leading-[18px] text-bluegray-900 sm:px-6 dark:text-bluegray-0">
					<!-- eslint-disable-next-line vue/no-v-html -->
					<span v-if="notification.message" v-interpolation class="[&_a]:font-semibold [&_a]:text-primary [&_p:last-child]:mb-0 [&_p]:mb-[18px] [&_p_strong]:break-all" v-html="notification.message"/>
				</div>
			</div>
		</div>

		<p v-else class="p-4 text-lg font-bold leading-5">No notifications at the moment.</p>

		<Paginator
			class="mt-6"
			:first="first"
			:rows="itemsPerPage"
			:total-records="notificationsCount"
			:page-link-size="pageLinkSize"
			:template="template"
			@page="page = $event.page"
		/>
	</div>
</template>

<script setup lang="ts">
	import { readNotifications } from '@directus/sdk';
	import { usePagination } from '~/composables/pagination';
	import { useNotifications } from '~/composables/useNotifications';
	import { useUserFilter } from '~/composables/useUserFilter';
	import { useAuth } from '~/store/auth';
	import { formatDateTime } from '~/utils/date-formatters';
	import { sendErrorToast } from '~/utils/send-toast';

	const auth = useAuth();
	const route = useRoute();
	const config = useRuntimeConfig();
	const { $directus } = useNuxtApp();
	const itemsPerPage = ref(config.public.itemsPerTablePage);
	const { page, first, pageLinkSize, template } = usePagination({ itemsPerPage });
	const displayedNotifications = ref<DirectusNotification[]>([]);
	const notificationsCount = ref<number>(0);
	const { inboxNotificationIds, markNotificationsAsRead, markAllNotificationsAsRead } = useNotifications();
	const notificationBus = useEventBus<string[]>('notification-updated');
	const { getUserFilter } = useUserFilter();

	notificationBus.on((idsToArchive) => {
		displayedNotifications.value.forEach((notification) => {
			if (idsToArchive.includes(notification.id)) {
				notification.status = 'archived';
			}
		});
	});

	if (!route.query.limit) {
		itemsPerPage.value = Math.min(Math.max(Math.floor((window.innerHeight - 210) / 140), 5), 15);
	}

	// get initial notifications
	const { data: notifications } = await useAsyncData('directus_notifications_page', async () => {
		return $directus.request<DirectusNotification[]>(readNotifications({
			format: 'html',
			limit: itemsPerPage.value,
			offset: page.value * itemsPerPage.value,
			filter: getUserFilter('recipient'),
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
			filter: getUserFilter('recipient'),
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
					limit: itemsPerPage.value,
					offset: pageNumber * itemsPerPage.value,
					filter: getUserFilter('recipient'),
					sort: [ '-timestamp' ],
				})),
				$directus.request<NotificationCntResponse>(readNotifications({
					filter: getUserFilter('recipient'),
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
	watch([ page ], async () => {
		await loadNotifications(page.value);
	});
</script>
