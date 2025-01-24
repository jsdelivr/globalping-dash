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
			:total-records="notifictionsCount"
			template="PrevPageLink PageLinks NextPageLink"
			@page="page = $event.page"
		/>
	</div>
</template>

<script setup lang="ts">
	import { readNotifications, updateNotifications } from '@directus/sdk';
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

	const notifictionsCount = 100; // TODO: 43, temp value

	const markNotificationAsRead = async (id: number) => {
		const notification = notifications.value.find(notification => notification.id === id);

		if (!notification) {
			return;
		}

		notification.status = 'archived';
		await $directus.request(updateNotifications([ notification.id ], { status: notification.status }));
	};

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

	// TODO: 43, temp data below
	// const tempNotBase = notifications.value[0];
	// const tempNotOne = { ...tempNotBase, id: 101, subject: 'Notif 1', message: 'Some message for notification 1' };
	// const tempNotTwo = { ...tempNotBase, id: 102, subject: 'Notif 2', message: 'Some message for notification 2' };
	// const tempNotThree = { ...tempNotBase, id: 103, subject: 'Notif 3', message: 'Some message for notification 3' };
	// const tempNotFour = { ...tempNotBase, id: 104, subject: 'Notif 4', message: 'Some message for notification 4' };
	// const tempNotFive = { ...tempNotBase, id: 105, subject: 'Notif 5', message: 'Some message for notification 5' };
	// const tempNotSix = { ...tempNotBase, id: 106, subject: 'Notif 6', message: 'Some message for notification 6' };
	// const tempNotSeven = { ...tempNotBase, id: 107, subject: 'Notif 7', message: 'Some message for notification 7' };
	// const tempNotEight = { ...tempNotBase, id: 108, subject: 'Adopted probe country change', message: 'Globalping API detected that your adopted probe with ip: 51.158.22.211 is located at “FR”. So its country value changed from “IT” to “FR”, and custom city value “Naples” is not applied right now.' };
	// const tempNots = [ tempNotBase, tempNotOne, tempNotTwo, tempNotThree, tempNotFour, tempNotFive, tempNotSix, tempNotSeven, tempNotEight ];

	// displayedNotifications.value = <DirectusNotification[]>tempNots.reverse();
	// TODO: 43, temp data above

	displayedNotifications.value = notifications.value.reverse();

	const loadNotifications = async (pageNumber: number) => {
		try {
			const data = await $directus.request<DirectusNotification[]>(readNotifications({
				format: 'html',
				limit: itemsPerPage,
				offset: pageNumber * itemsPerPage,
				filter: {
					recipient: { _eq: user.id },
				},
			}));

			displayedNotifications.value = data.reverse();
		} catch (e) {
			sendErrorToast(e);
		}
	};

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
