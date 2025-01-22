<template>
	<div class="min-h-full flex flex-col p-6 gap-y-6">
		<div class="flex items-center justify-between h-10">
			<h1 class="font-bold text-2xl leading-8">Your notifications</h1>
			<Button class="btn-mark-as-all-read flex items-center gap-x-2 h-10">
				<i class="pi pi-check-circle text-lg text-bluegray-900"/>
				<span class="text-sm text-bluegray-900 font-semibold">Mark all as read</span>
			</Button>
		</div>

		<div>
			<Accordion v-if="reverseNotifications.length" class="w-full flex flex-col gap-y-2 max-w-[calc(100vw-16px)]" expand-icon="pi pi-chevron-right">
				<AccordionPanel
					v-for="notification in reverseNotifications"
					:key="notification.id"
					:value="notification.id"
					class="border border-surface-300 rounded-xl p-6 notification"
					@click="markNotificationAsRead(notification.id)"
				>
					<!-- <AccordionHeader :class="{ '!font-normal': notification.status !== 'inbox'}"> -->
					<AccordionHeader>
						<div class="flex flex-col !items-start gap-y-1">
							<span class="n-header-subj text-xl font-bold leading-5">{{ notification.subject }}</span>
							<span class="text-bluegray-500 flex items-center gap-x-1">
								<i class="pi pi-clock text-lg"/>
								<span class="text-sm leading-4">{{ formatNotificationDate(notification.timestamp) }}</span>
							</span>
						</div>
					</AccordionHeader>
					<AccordionContent>
						<!-- eslint-disable-next-line vue/no-v-html -->
						<span v-if="notification.message" class="notification" v-html="notification.message"/>
					</AccordionContent>
				</AccordionPanel>
			</Accordion>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { readNotifications, updateNotifications } from '@directus/sdk';
	import { useAuth } from '~/store/auth';
	import { formatNotificationDate } from '~/utils/date-formatters';


	const { $directus } = useNuxtApp();

	const auth = useAuth();
	const user = auth.getUser as User;

	const markNotificationAsRead = async (id: string) => {
		const notification = notifications.value.find(notification => notification.id === id);

		if (!notification) {
			return;
		}

		notification.status = 'archived';
		await $directus.request(updateNotifications([ notification.id ], { status: notification.status }));
	};

	const { data: notifications } = await useAsyncData('directus_notifications', async () => {
		return $directus.request(readNotifications({
			format: 'html',
			filter: {
				recipient: { _eq: user.id },
			},
		}));
	}, { default: () => [] });

	// temp task43 below
	const tempNotBase = notifications.value[0];
	const tempNotOne = { ...tempNotBase, id: 101, subject: 'Notif 1', message: 'Some message for notification 1' };
	const tempNotTwo = { ...tempNotBase, id: 102, subject: 'Notif 2', message: 'Some message for notification 2' };
	const tempNotThree = { ...tempNotBase, id: 103, subject: 'Notif 3', message: 'Some message for notification 3' };
	const tempNotFour = { ...tempNotBase, id: 104, subject: 'Notif 4', message: 'Some message for notification 4' };
	const tempNotFive = { ...tempNotBase, id: 105, subject: 'Notif 5', message: 'Some message for notification 5' };
	const tempNotSix = { ...tempNotBase, id: 106, subject: 'Notif 6', message: 'Some message for notification 6' };
	const tempNotSeven = { ...tempNotBase, id: 107, subject: 'Notif 7', message: 'Some message for notification 7' };
	const tempNotEight = { ...tempNotBase, id: 108, subject: 'Notif 8', message: 'Some message for notification 8' };
	const tempNots = [ tempNotBase, tempNotOne, tempNotTwo, tempNotThree, tempNotFour, tempNotFive, tempNotSix, tempNotSeven, tempNotEight ];
	const reverseNotifications = computed(() => tempNots.reverse());
	// temp task43 above

	// const reverseNotifications = computed(() => [ ...notifications.value ].reverse());
</script>

<style scoped>
	.btn-mark-as-all-read {
		@apply border-surface-300 bg-transparent;
	}

	.notification:hover {
		background-color: #edfcf7;
		cursor: pointer;
	}

	.n-header-subj {
		color: #4b5563;
	}
</style>
