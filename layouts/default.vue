<template>
	<section class="grid grid-cols-[256px_auto] grid-rows-[56px_auto] max-lg:grid-cols-1">
		<Toast class="max-[440px]:left-5 max-[440px]:w-auto"/>

		<header class="col-span-2 flex items-center border-b bg-dark-800 px-6 py-3 text-surface-0 max-lg:px-3">
			<NuxtLink to="/">
				<img class="h-6" src="~/assets/images/gp-logo-white.svg" alt="Globalping logo">
			</NuxtLink>
			<NuxtLink to="https://www.jsdelivr.com/" class="m-2 mr-auto text-xs text-bluegray-600 no-underline hover:underline">by jsDelivr</NuxtLink>

			<div class="flex items-center max-lg:hidden">
				<NuxtLink class="ml-6 text-surface-0 no-underline hover:underline" to="https://www.jsdelivr.com/" target="_blank">
					<i class="pi pi-external-link text-bluegray-300"/>
					<span class="m-2">jsDelivr</span>
				</NuxtLink>
				<NuxtLink class="ml-6 text-surface-0 no-underline hover:underline" to="https://globalping.io" target="_blank">
					<i class="pi pi-external-link text-bluegray-300"/>
					<span class="m-2">Globalping</span>
				</NuxtLink>
				<p class="mx-12">Account type: <span class="rounded-full bg-[#35425A] px-3 py-2 font-semibold">{{ capitalize(user.user_type) }}</span></p>
				<Button class="relative mr-8 text-surface-0 hover:bg-transparent" text rounded aria-label="Notifications" @click="toggleNotifications">
					<i class="pi pi-bell text-[1.3rem]"/>
					<i v-if="newNotifications.length" class="pi pi-circle-fill absolute right-3 top-1 text-[0.3rem] text-primary"/>
				</Button>
				<Button class="flex items-center !px-2 text-surface-0 hover:bg-transparent" text rounded aria-label="Profile" @click="toggleProfile">
					<i class="pi pi-user rounded-full border-1.5 border-surface-0 p-2" style="font-size: 1.1rem;"/>
					<p class="font-semibold">{{ user.github_username || `${user.first_name} ${user.last_name}` }}</p>
					<i class="pi pi-chevron-down" style="font-size: .7rem;"/>
				</Button>
				<TieredMenu ref="profilePanel" :model="items" popup>
					<template #item="{ item, props, hasSubmenu }">
						<router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom>
							<a v-ripple :href="href" v-bind="props.action" @click="navigate">
								<span :class="item.icon"/>
								<span class="ml-2">{{ item.label }}</span>
							</a>
						</router-link>
						<a v-else v-ripple :href="item.url" :target="item.target" v-bind="props.action">
							<span :class="item.icon"/>
							<span class="ml-2">{{ item.label }}</span>
							<span v-if="hasSubmenu" class="pi pi-angle-right ml-auto"/>
						</a>
					</template>
				</TieredMenu>
			</div>

			<div class="hidden max-lg:flex">
				<Button class="relative mr-4 text-surface-0 hover:bg-transparent" text aria-label="Notifications" @click="toggleNotifications">
					<i class="pi pi-bell text-[1.3rem]"/>
					<i v-if="newNotifications.length" class="pi pi-circle-fill absolute right-3 top-1 text-[0.3rem] text-primary"/>
				</Button>
				<Button class="text-[1.5rem] text-surface-0 hover:bg-transparent" icon="pi pi-bars" aria-label="Menu" text @click="mobileSidebar = true"/>
				<Drawer v-model:visible="mobileSidebar" class="border bg-surface-100 pt-4">
					<template #header>
						<div class="text-lg font-semibold" data-pc-section="title">
							<i class="pi pi-user mr-2 rounded-full border-1.5 border-main-900 p-2" style="font-size: 1.1rem;"/>
							<span class="font-semibold">{{ user.github_username || `${user.first_name} ${user.last_name}` }}</span>
						</div>
					</template>

					<NuxtLink active-class="active" class="sidebar-link" to="/" @click="mobileSidebar = false"><i class="pi pi-home sidebar-link-icon"/>Overview</NuxtLink>
					<NuxtLink active-class="active" class="sidebar-link" to="/probes" @click="mobileSidebar = false"><nuxt-icon class="pi sidebar-link-icon" name="probe"/>Probes</NuxtLink>
					<NuxtLink active-class="active" class="sidebar-link" to="/credits" @click="mobileSidebar = false"><nuxt-icon class="pi sidebar-link-icon" name="coin"/>Credits</NuxtLink>
					<NuxtLink active-class="active" class="sidebar-link" to="/tokens" @click="mobileSidebar = false"><i class="pi pi-database sidebar-link-icon"/>Tokens</NuxtLink>
					<NuxtLink active-class="active" class="sidebar-link" to="/settings" @click="mobileSidebar = false"><i class="pi pi-cog sidebar-link-icon"/>Settings</NuxtLink>
					<button active-class="active" class="sidebar-link" @click="auth.logout"><i class="pi pi-power-off sidebar-link-icon"/>Sign out</button>
					<div class="flex flex-col border-t">
						<NuxtLink class="ml-6 mt-4 text-bluegray-600 no-underline hover:underline dark:text-bluegray-100" to="https://www.jsdelivr.com/" target="_blank">
							<i class="pi pi-external-link text-bluegray-300"/>
							<span class="m-2">jsDelivr</span>
						</NuxtLink>
						<NuxtLink class="ml-6 mt-4 text-bluegray-600 no-underline hover:underline dark:text-bluegray-100" to="https://globalping.io" target="_blank">
							<i class="pi pi-external-link text-bluegray-300"/>
							<span class="m-2">Globalping</span>
						</NuxtLink>
					</div>
					<div class="mt-8 rounded-xl border bg-surface-0 p-6 dark:border-dark-400 dark:bg-dark-500">
						<p class="mb-2 font-bold">Sponsorship</p>
						<p class="mb-6">Support the development of our products by becoming a sponsor.</p>
						<NuxtLink to="https://github.com/sponsors/jsdelivr" tabindex="-1" target="_blank" rel="noopener">
							<Button label="Become a Sponsor" severity="contrast"/>
						</NuxtLink>
					</div>
				</Drawer>
			</div>
			<Popover ref="notificationsPanel" :pt="{ content: 'flex items-center rounded-xl border dark:border-[var(--table-border)' }">
				<div class="flex w-[calc(100vw-32px)] flex-col gap-6 rounded-xl p-6 sm:w-[37rem]">
					<div class="flex flex-col items-center justify-between gap-y-2 sm:h-10 sm:flex-row">
						<h1 class="text-lg font-bold leading-6">Your notifications</h1>
						<Button
							v-if="displayedNotifications.length"
							class="btn-mark-all-as-read"
							@click="markAllNotificationsAsRead()"
						>
							<i class="pi pi-check-circle text-lg "/>
							<span class="text-sm font-semibold">Mark all as read</span>
						</Button>
					</div>

					<Accordion
						v-if="displayedNotifications.length"
						class="n-accordion"
					>
						<AccordionPanel
							v-for="notification in displayedNotifications"
							:key="notification.id"
							:value="notification.id"
							class="n-accordion-panel"
							:class="{ 'n-accordion-panel_new': notification.status === 'inbox' }"
							@click="markNotificationAsRead(notification.status === 'inbox' ? [ notification.id ] : [])"
						>
							<AccordionHeader
								class="n-accordion-header"
								:pt="{ toggleIcon: '!hidden' }"
							>
								<div class="flex flex-col !items-start gap-y-1">
									<span class="n-header-subj flex items-center text-sm font-semibold leading-5">
										{{ notification.subject }}
										<span v-if="notification.status === 'inbox'" class="n-accordion-panel_new_circle"/>
									</span>

									<span class="text-sm font-normal leading-4 text-bluegray-500">
										{{ formatDateTime(notification.timestamp) }}
									</span>
								</div>

								<i class="pi pi-chevron-right n-expand-chevron"/>
							</AccordionHeader>

							<AccordionContent class="n-accordion-content" :pt="{content: '!p-0 !pt-2 text-sm font-normal leading-[18px] text-bluegray-900 overflow-hidden dark:text-[var(--bluegray-0)]'}">
								<!-- eslint-disable-next-line vue/no-v-html -->
								<span v-if="notification.message" class="notification" v-html="notification.message"/>
							</AccordionContent>
						</AccordionPanel>
					</Accordion>

					<p v-else class="w-80 p-4">No notifications</p>

					<NuxtLink
						to="/notifications"
						class="ps-4 font-bold leading-4 text-[var(--p-primary-color)]"
						@click="toggleNotifications"
					>
						Go to Notifications page
					</NuxtLink>
				</div>
			</Popover>
		</header>

		<aside class="flex flex-col border-r bg-surface-100 p-4 max-lg:hidden dark:bg-dark-700">
			<NuxtLink active-class="active" class="sidebar-link" to="/"><i class="pi pi-home sidebar-link-icon"/>Overview</NuxtLink>
			<NuxtLink active-class="active" class="sidebar-link" to="/probes"><nuxt-icon class="pi sidebar-link-icon" name="probe"/>Probes</NuxtLink>
			<NuxtLink active-class="active" class="sidebar-link" to="/credits"><nuxt-icon class="pi sidebar-link-icon" name="coin"/>Credits</NuxtLink>
			<NuxtLink active-class="active" class="sidebar-link" to="/tokens"><i class="pi pi-database sidebar-link-icon"/>Tokens</NuxtLink>
			<div class="mt-auto rounded-xl border bg-surface-0 p-6 dark:border-dark-400 dark:bg-dark-500">
				<p class="mb-2 font-bold">Sponsorship</p>
				<p class="mb-6">Support the development of our products by becoming a sponsor.</p>
				<NuxtLink to="https://github.com/sponsors/jsdelivr" tabindex="-1" target="_blank" rel="noopener">
					<Button label="Become a Sponsor" severity="contrast"/>
				</NuxtLink>
			</div>
		</aside>
		<div class="overflow-auto">
			<slot/>
		</div>
	</section>
</template>

<script lang="ts" setup>
	import { readNotifications, updateNotifications } from '@directus/sdk';
	import { defaults } from 'chart.js';
	import capitalize from 'lodash/capitalize';
	import { useAuth } from '~/store/auth';
	import { formatDateTime } from '~/utils/date-formatters';

	const config = useRuntimeConfig();
	const { $directus } = useNuxtApp();

	const auth = useAuth();
	const user = auth.getUser as User;

	// NOTIFICATIONS
	const notificationBus = useEventBus<string[]>('notification-updated');

	notificationBus.on((ids) => {
		displayedNotifications.value.forEach((notification) => {
			if (ids.includes(notification.id)) {
				notification.status = 'archived';
			}
		});
	});

	const notificationsPanel = ref();
	const toggleNotifications = async (event: Event) => {
		notificationsPanel.value.toggle(event);
	};
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
			const notificationIds = notifications.value.filter(n => n.status === 'inbox').map(n => n.id);

			await markNotificationAsRead(notificationIds);
		} catch (error) {
			console.error('Error updating all notifications:', error);
		}
	};

	const itemsPerPage = config.public.itemsPerTablePage;
	const { data: notifications } = await useAsyncData('directus_notifications', async () => {
		return $directus.request(readNotifications({
			format: 'html',
			limit: itemsPerPage,
			offset: 0,
			filter: {
				recipient: { _eq: user.id },
			},
			sort: [ '-timestamp' ],
		}));
	}, { default: () => [] });

	const displayedNotifications = computed(() => [ ...notifications.value ].slice(0, 5));
	const newNotifications = computed(() => displayedNotifications.value.filter(notification => notification.status === 'inbox'));

	// NOTIFICATIONS END

	// PROFILE

	const items = ref([
		{
			label: 'Settings',
			icon: 'pi pi-cog',
			route: '/settings',
		},
		{
			separator: true,
		},
		{
			label: 'Sign out',
			icon: 'pi pi-power-off',
			command: auth.logout,
		},
	]);

	const profilePanel = ref();
	const toggleProfile = async (event: Event) => {
		profilePanel.value.toggle(event);
	};

	// PROFILE END

	const mobileSidebar = ref(false);

	const documentStyle = getComputedStyle(document.documentElement);

	// DEFAULT CHART STYLES
	defaults.font = {
		family: documentStyle.getPropertyValue('font-family'),
		weight: 500,
		size: 10.5,
	};
	// DEFAULT CHART STYLES END
</script>

<style>
	.notification p {
		margin-bottom: 18px;
	}

	.notification p:last-child {
		margin-bottom: 0;
	}

	.notification a {
		color: var(--p-primary-color);
		font-weight: 600;
	}
</style>

<style scoped>
	.sidebar-link {
		position: relative;
		height: 40px;
		width: 100%;
		padding: 4px;
		margin-bottom: 8px;
		border-radius: 6px;
		text-decoration: none;
		border: 1px solid transparent;
		display: flex;
		align-items: center;
		box-sizing: border-box;
	}

	.sidebar-link-icon {
		@apply pl-4 pr-3 text-lg text-bluegray-400;
	}

	.dark .sidebar-link {
		color: var(--p-surface-0);
	}

	.sidebar-link.active {
		background: var(--p-surface-0);
		font-weight: 600;
		border: 1px solid var(--p-surface-300);
	}

	.dark .sidebar-link.active {
		background: var(--dark-500);
		border-color: var(--dark-400);
	}

	.sidebar-link.active .pi {
		color: var(--main-900);
	}

	.sidebar-link.active:before {
		content: "";
		background: var(--p-primary-color);
		border-radius: 5px;
		position: absolute;
		left: 5px;
		top: 7px;
		bottom: 7px;
		width: 3px;
	}

	.sidebar-link:hover {
		background: var(--p-surface-0);
		border: 1px solid var(--p-surface-300);
	}

	.dark .sidebar-link:hover {
		background: var(--dark-500);
		border-color: var(--dark-400);
	}

	.n-header-subj {
		@apply dark:!text-dark-0;
		color: #4b5563;
	}

	.btn-mark-all-as-read {
		@apply flex h-10 items-center gap-x-2;
		@apply bg-white;
		@apply text-bluegray-900;
		@apply h-10 w-full sm:w-auto;
		@apply border border-solid !border-[var(--p-surface-300)];
		@apply hover:!border-[var(--p-primary-500)] hover:!bg-[var(--p-primary-500)] hover:!text-[var(--bluegray-0)];
		@apply dark:text-[var(--bluegray-0)] dark:bg-primary dark:!border-primary;
		@apply dark:hover:!bg-[var(--p-primary-hover-color)] dark:hover:!border-[var(--p-primary-hover-color)];
	}

	.n-accordion {
		@apply box-border flex w-full flex-col gap-y-2;
	}

	.n-accordion-panel {
		@apply border-none bg-[var(--p-surface-50)] !p-0 !pb-4 dark:bg-dark-800 dark:border dark:border-solid dark:border-[var(--table-border)];
	}

	.n-accordion-panel_new {
		@apply bg-gradient-to-r from-[rgba(244,252,247,1)] to-[rgba(229,252,246,1)];
		@apply dark:bg-none dark:!bg-[var(--dark-700)];
	}

	.n-accordion-panel_new .n-header-subj {
		@apply !text-[var(--bluegray-900)];
		@apply dark:!text-[var(--bluegray-0)];
	}

	.n-accordion-panel_new-circle {
		display: inline-flex;
		width: calc(.5rem + 2px);
		height: calc(.5rem + 2px);
		border-radius: 50%;
		margin-left: calc(.5rem + 2px);
		background-color: var(--p-primary-500);
	}

	.n-accordion-header {
		@apply relative !p-4 -mb-4;
	}

	.n-accordion-content {
		padding: 0 16px;
		font-weight: 400;
		line-height: 18px;
		color: var(--bluegray-900);
		overflow: hidden;
		z-index: 0;
	}

	.n-expand-chevron {
		@apply dark:!text-dark-0;
		position: absolute;
		top: 16px;
		right: 16px;
		color: var(--bluegray-900);
		transition: all 400ms ease-out;
	}

	.n-accordion-panel [aria-expanded="true"] .n-expand-chevron {
		transform: rotate(90deg);
	}
</style>
