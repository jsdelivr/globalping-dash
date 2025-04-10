import { readNotifications, updateNotifications } from '@directus/sdk';
import { useAuth } from '~/store/auth';

const inboxNotificationIds = useState<string[]>('inboxNotifIds', () => []);

export const useNotifications = () => {
	const { $directus } = useNuxtApp();
	const auth = useAuth();
	const { user } = storeToRefs(auth);
	const notificationBus = useEventBus<string[]>('notification-updated');

	const fetchInboxNotificationIds = async () => {
		try {
			const notifications = await $directus.request<{ id: string }[]>(readNotifications({
				filter: {
					recipient: { _eq: user.value.id },
					status: { _eq: 'inbox' },
				},
				fields: [ 'id' ],
				limit: -1,
			}));

			inboxNotificationIds.value = notifications.map(n => n.id);
		} catch (error) {
			console.error('Error fetching notification IDs:', error);
		}
	};

	const fetchNotifications = async (limit: number) => {
		try {
			const notifications = await $directus.request(readNotifications({
				format: 'html',
				limit,
				offset: 0,
				filter: {
					recipient: { _eq: user.value.id },
				},
				sort: [ '-timestamp' ],
			}));

			return notifications;
		} catch (error) {
			console.error('Error fetching notifications:', error);
			return [];
		}
	};

	const markNotificationsAsRead = async (notificationIds: string[]) => {
		if (notificationIds.length === 0) {
			return;
		}

		try {
			const updateData = { status: 'archived' };

			await $directus.request(updateNotifications(notificationIds, updateData));
			inboxNotificationIds.value = inboxNotificationIds.value.filter(id => !notificationIds.includes(id));

			notificationBus.emit(notificationIds);
		} catch (error) {
			console.error('Error updating notifications:', error);
		}
	};

	const markAllNotificationsAsRead = async () => {
		try {
			await markNotificationsAsRead(inboxNotificationIds.value);
		} catch (error) {
			console.error('Error updating all notifications:', error);
		}
	};

	// Fetch inbox notification IDs immediately for the counter and mark-all-as-read button.
	fetchInboxNotificationIds();

	return {
		inboxNotificationIds,
		fetchInboxNotificationIds,
		fetchNotifications,
		markNotificationsAsRead,
		markAllNotificationsAsRead,
	};
};
