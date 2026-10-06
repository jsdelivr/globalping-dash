<template>
	<section class="grid grid-cols-[256px_auto] grid-rows-[56px_auto] max-lg:grid-cols-1">
		<template v-if="account.canManageProbes">
			<PopupUnadoptedProbeDetected/>
			<PopupLocalNetworkAccess/>
		</template>
		<Toast class="max-[440px]:left-5 max-[440px]:w-auto"/>

		<header class="col-span-2 flex items-center border-b bg-dark-800 px-6 py-3 text-surface-0 max-lg:pr-3 max-sm:pl-4 max-sm:pr-2">
			<NuxtLink to="/">
				<img class="h-6" src="~/assets/images/gp-logo-white.svg" alt="Globalping logo">
			</NuxtLink>
			<NuxtLink to="https://www.jsdelivr.com/" class="m-2 mr-auto text-xs text-bluegray-600 no-underline hover:underline">by jsDelivr</NuxtLink>

			<div class="flex items-center max-lg:hidden">
				<NuxtLink v-if="!auth.adminMode && !auth.impersonation" class="ml-6 text-surface-0 no-underline hover:underline" to="https://www.jsdelivr.com/" target="_blank">
					<i class="pi pi-external-link text-bluegray-300"/>
					<span class="m-2">jsDelivr</span>
				</NuxtLink>
				<NuxtLink v-if="!auth.adminMode && !auth.impersonation" class="ml-6 text-surface-0 no-underline hover:underline" to="https://globalping.io" target="_blank">
					<i class="pi pi-external-link text-bluegray-300"/>
					<span class="m-2">Globalping</span>
				</NuxtLink>
				<p v-if="account.current.org_role" class="mx-12">Organization role: <span v-tooltip.bottom="{ value: rolesHint, escape: false, class: 'max-w-md [&>[data-pc-section=text]]:leading-normal' }" class="cursor-help rounded-full bg-[#35425A] px-3 py-2 font-semibold">{{ capitalize(account.current.org_role) }}</span></p>
				<p v-else class="mx-12">Account type: <span class="rounded-full bg-[#35425A] px-3 py-2 font-semibold">{{ capitalize(account.current.user_type) }}</span></p>
				<div v-if="auth.isAdmin" class="mr-2 flex items-center gap-2">
					<Button
						class="relative text-surface-0 hover:bg-transparent"
						:class="{ '!bg-[#35425A]': auth.adminMode || auth.impersonation }"
						text
						rounded
						aria-label="Admin Panel"
						@click="toggleAdminPanel"
					>
						<i class="pi pi-user-edit text-[1.3rem]"/>
						<span v-if="auth.adminMode" class="text-sm font-bold">Admin Mode</span>
						<span v-if="auth.impersonation" class="text-sm font-bold">Impersonating {{ auth.impersonation.github_username }}</span>
					</Button>
				</div>
				<Button class="relative mr-8 text-surface-0 hover:bg-transparent" text rounded aria-label="Notifications" @click="toggleNotifications">
					<i class="pi pi-bell text-[1.3rem]"/>
					<i v-if="inboxNotificationIds.length" class="pi pi-circle-fill absolute right-3 top-1 text-[0.4rem] text-primary"/>
				</Button>
				<Button class="flex items-center !px-2 text-surface-0 hover:bg-transparent" text rounded aria-label="Profile" @click="toggleProfile">
					<i class="pi pi-user rounded-full border-1.5 border-surface-0 p-2" style="font-size: 1.1rem;"/>
					<p class="font-semibold">{{ account.current.name }}</p>
					<i class="pi pi-chevron-down" style="font-size: .7rem;"/>
				</Button>
				<Menu ref="profilePanel" :model="items" popup @hide="accountsExpanded = false">
					<template #item="{ item, props }">
						<router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom>
							<a v-ripple :href="href" v-bind="props.action" @click="navigate">
								<span :class="item.icon"/>
								<span class="ml-2">{{ item.label }}</span>
							</a>
						</router-link>
						<a v-else-if="item.toggle" v-ripple v-bind="props.action" @click.stop="accountsExpanded = !accountsExpanded">
							<span :class="item.icon"/>
							<span class="mx-2">{{ item.label }}</span>
							<span class="pi pi-angle-down ml-auto text-xs transition-transform" :class="{ 'rotate-180': accountsExpanded }"/>
						</a>
						<a
							v-else
							v-ripple
							:href="item.url"
							:target="item.target"
							v-bind="props.action"
							:class="{ 'ps-9': item.nested }">
							<span :class="[ item.icon, { 'text-primary': item.active } ]"/>
							<span class="ml-2" :class="{ 'font-bold text-primary': item.active }">{{ item.label }}</span>
						</a>
					</template>
				</Menu>
			</div>

			<GPDialog v-model:visible="addOrgDialog" header="Add organization" size="large">
				<GpDialogContentAddOrganization/>
			</GPDialog>

			<div class="hidden max-lg:flex">
				<Button class="relative mr-4 text-surface-0 hover:bg-transparent" text aria-label="Notifications" @click="toggleNotifications">
					<i class="pi pi-bell text-[1.3rem]"/>
					<i v-if="inboxNotificationIds.length" class="pi pi-circle-fill absolute right-3 top-1 text-[0.4rem] text-primary"/>
				</Button>
				<Button class="text-[1.5rem] text-surface-0 hover:bg-transparent" icon="pi pi-bars" aria-label="Menu" text @click="mobileSidebar = true"/>
				<Drawer v-model:visible="mobileSidebar" class="border bg-surface-100 pt-4">
					<template #header>
						<div class="text-lg font-semibold" data-pc-section="title">
							<i class="pi pi-user mr-2 rounded-full border-1.5 border-main-900 p-2" style="font-size: 1.1rem;"/>
							<span class="font-semibold">{{ account.current.name }}</span>
						</div>
					</template>

					<NuxtLink active-class="active" class="sidebar-link" to="/" @click="mobileSidebar = false"><i class="pi pi-home sidebar-link-icon"/>Overview</NuxtLink>
					<NuxtLink active-class="active" class="sidebar-link" :class="{'active': $route.path.startsWith('/probes')}" to="/probes" @click="mobileSidebar = false"><NuxtIcon class="pi sidebar-link-icon" name="probe"/>Probes</NuxtLink>
					<NuxtLink active-class="active" class="sidebar-link" to="/credits" @click="mobileSidebar = false"><NuxtIcon class="pi sidebar-link-icon" name="coin"/>Credits</NuxtLink>
					<NuxtLink active-class="active" class="sidebar-link" to="/tokens" @click="mobileSidebar = false"><i class="pi pi-database sidebar-link-icon"/>Tokens</NuxtLink>
					<NuxtLink active-class="active" class="sidebar-link" to="/settings" @click="mobileSidebar = false"><i class="pi pi-cog sidebar-link-icon"/>Settings</NuxtLink>
					<div v-if="!auth.adminMode" class="my-2 flex flex-col border-y py-2">
						<p class="px-4 py-2 text-sm font-bold text-bluegray-500">Act as organization</p>
						<button v-for="item in accountOptions" :key="item.key" class="sidebar-link" :class="{ 'font-bold !text-primary': item.active }" @click="item.command(); mobileSidebar = false">
							<i class="sidebar-link-icon" :class="[ item.icon, { '!text-primary': item.active } ]"/>{{ item.label }}
						</button>
					</div>
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

					<div v-if="auth.isAdmin" class="mb-2 mt-4 flex flex-col gap-4 border-b pb-4">
						<AdminPanel/>
					</div>

					<div v-if="!isSponsor" class="mt-8 rounded-xl border bg-surface-0 p-6 dark:border-dark-400 dark:bg-dark-500">
						<p class="mb-2 font-bold">Sponsorship</p>
						<p class="mb-6">Support the development of our products by becoming a sponsor.</p>
						<NuxtLink to="https://github.com/sponsors/jsdelivr" tabindex="-1" target="_blank" rel="noopener">
							<Button label="Become a Sponsor" severity="contrast"/>
						</NuxtLink>
					</div>
				</Drawer>
			</div>
			<Popover
				ref="notificationsPanel"
				class="absolute !ml-4 !mt-2 !overflow-hidden !rounded-xl bg-surface-0 dark:bg-main-bg"
				:pt:content="{ class: 'flex items-center !rounded-xl border dark:border-table-border'}"
			>
				<div class="flex w-[calc(100vw-32px)] flex-col gap-6 rounded-xl p-4 sm:w-[38rem] sm:p-6">
					<div class="flex flex-col items-center justify-between gap-y-2 sm:h-10 sm:flex-row">
						<h1 class="text-lg font-bold leading-6">Your notifications</h1>
						<span
							v-if="inboxNotificationIds.length"
							class="rounded-full bg-primary px-2 py-1 text-sm font-bold leading-[17px] text-bluegray-0 sm:ml-2 sm:mr-auto"
						>
							{{ formatNumber(inboxNotificationIds.length) }} unread
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

					<Accordion
						v-if="headerNotifications.length"
						class="box-border flex w-full flex-col gap-y-2"
					>
						<AccordionPanel
							v-for="notification in headerNotifications"
							:key="notification.id"
							:value="notification.id"
							class="!rounded-xl border-none bg-surface-50 !p-0 !pb-4 dark:!border dark:!border-solid dark:!border-table-border dark:bg-dark-800"
							:class="{ 'bg-gradient-to-r from-[rgba(244,252,247,1)] to-[rgba(229,252,246,1)] dark:!bg-dark-700 dark:bg-none': notification.status === 'inbox' }"
							@click="markNotificationsAsRead(notification.status === 'inbox' ? [ notification.id ] : [])"
						>
							<AccordionHeader
								class="relative -mb-4 !p-4 !pr-8 text-left [&[aria-expanded='true']>i]:rotate-90"
								:pt="{ toggleIcon: '!hidden' }"
							>
								<div class="flex flex-col !items-start gap-y-1">
									<span
										class="text-sm font-semibold leading-5 text-[#4b5563] dark:!text-dark-0"
										:class="{ '!text-bluegray-900 dark:!text-bluegray-0': notification.status === 'inbox' }"
									>
										<template v-if="notification.status === 'inbox'">
											{{ notification.subject.slice(0, notification.subject.lastIndexOf(' ') + 1) }}<span class="whitespace-nowrap">{{ notification.subject.slice(notification.subject.lastIndexOf(' ') + 1) }}<span class="mb-px ml-2 inline-block size-2 rounded-full bg-primary-500"/></span>
										</template>
										<template v-else>{{ notification.subject }}</template>
									</span>

									<span class="text-sm font-normal leading-4 text-bluegray-500">
										{{ formatDateTime(notification.timestamp) }}
									</span>
								</div>

								<i class="pi pi-chevron-right duration-400 absolute right-4 top-[19px] text-bluegray-900 transition-all ease-in-out dark:!text-dark-0"/>
							</AccordionHeader>

							<AccordionContent
								class="z-0 overflow-hidden px-4 py-0 font-normal leading-[18px] text-bluegray-900"
								:pt="{content: '!p-0 !pt-2 text-sm font-normal leading-[18px] text-bluegray-900 overflow-hidden dark:text-bluegray-0'}"
							>
								<!-- eslint-disable-next-line vue/no-v-html -->
								<span v-if="notification.message" v-interpolation class="[&_a]:font-semibold [&_a]:text-primary [&_p:last-child]:mb-0 [&_p]:mb-[18px] [&_p_strong]:break-all [&_ul:last-child]:mb-0 [&_ul]:my-[18px] [&_ul]:list-disc [&_ul]:pl-6" v-html="notification.message"/>
							</AccordionContent>
						</AccordionPanel>
					</Accordion>

					<p v-else class="w-80 p-4">No notifications</p>

					<NuxtLink
						to="/notifications"
						class="ps-4 font-bold leading-4 text-primary"
						@click="toggleNotifications"
					>
						Go to Notifications page
					</NuxtLink>
				</div>
			</Popover>
		</header>

		<aside class="flex flex-col border-r bg-surface-100 p-4 max-lg:hidden dark:bg-dark-700">
			<NuxtLink active-class="active" class="sidebar-link" to="/"><i class="pi pi-home sidebar-link-icon"/>Overview</NuxtLink>
			<NuxtLink active-class="active" class="sidebar-link" :class="{'active': $route.path.startsWith('/probes')}" to="/probes"><NuxtIcon class="pi sidebar-link-icon" name="probe"/>Probes</NuxtLink>
			<NuxtLink active-class="active" class="sidebar-link" to="/credits"><NuxtIcon class="pi sidebar-link-icon" name="coin"/>Credits</NuxtLink>
			<NuxtLink active-class="active" class="sidebar-link" to="/tokens"><i class="pi pi-database sidebar-link-icon"/>Tokens</NuxtLink>
			<div v-if="!isSponsor" class="mt-auto rounded-xl border bg-surface-0 p-6 dark:border-dark-400 dark:bg-dark-500">
				<p class="mb-2 font-bold">Sponsorship</p>
				<p class="mb-6">Support the development of our products by becoming a sponsor.</p>
				<NuxtLink to="https://github.com/sponsors/jsdelivr" tabindex="-1" target="_blank" rel="noopener">
					<Button label="Become a Sponsor" severity="contrast"/>
				</NuxtLink>
			</div>
		</aside>

		<div class="overflow-auto">
			<div class="mx-auto h-full max-w-[1664px]">
				<slot/>
			</div>
		</div>
		<NavigationGuard/>
		<Popover
			ref="adminPanel"
			class="absolute !ml-4 !mt-2 !overflow-hidden !rounded-xl bg-[var(--p-surface-0)] dark:bg-[var(--main-bg)]"
			:pt:content="{ class: 'flex items-center !rounded-xl border dark:border-[var(--table-border)]'}"
		>
			<AdminPanel class="max-w-[20rem]"/>
		</Popover>
	</section>
</template>

<script lang="ts" setup>
	import { defaults } from 'chart.js';
	import capitalize from 'lodash/capitalize';
	import { useNotifications } from '~/composables/useNotifications';
	import { useAccount } from '~/store/account';
	import { useAppearance } from '~/store/appearance';
	import { useAuth } from '~/store/auth';
	import { formatDateTime } from '~/utils/date-formatters';
	import { formatNumber } from '~/utils/format-number';

	const auth = useAuth();
	const account = useAccount();
	const appearance = useAppearance();
	const { headerNotifications, inboxNotificationIds, markNotificationsAsRead, markAllNotificationsAsRead, updateHeaderNotifications } = useNotifications();

	const isFormDirty = ref(false);
	provide('form-dirty', isFormDirty);

	useHead({
		meta: [
			{ name: 'theme-color', content: appearance.theme === 'light' ? '#ffffff' : '#17233a' },
		],
	});

	// ADMIN
	const adminPanel = ref();
	const toggleAdminPanel = async (event: Event) => {
		adminPanel.value.toggle(event);
	};

	// NOTIFICATIONS
	const notificationsPanel = ref();
	const toggleNotifications = async (event: Event) => {
		notificationsPanel.value.toggle(event);
	};

	updateHeaderNotifications();

	// NOTIFICATIONS END

	// PROFILE

	const addOrgDialog = ref(false);

	const ROLE_DESCRIPTIONS = [
		{ role: 'admin', description: 'Manages the organization: its settings, adoption token, members and their roles. Adopts and edits its probes, gets its notifications and uses its credits.' },
		{ role: 'member', description: 'Sees the organization\'s probes and credits, and creates tokens and app approvals that spend its credits. Can\'t adopt or edit probes.' },
		{ role: 'viewer', description: 'Read-only: sees the organization\'s probes and credits. Can\'t create tokens or run measurements on globalping.io as the organization.' },
	];

	const rolesHint = computed(() => ROLE_DESCRIPTIONS.map(({ role, description }) => {
		const isCurrent = role === account.current.org_role;
		const title = `<strong class="${isCurrent ? 'text-primary' : ''}">${capitalize(role)}</strong>${isCurrent ? ' <span class="text-xs opacity-70">(your role)</span>' : ''}`;
		return `<p class="mb-2 last:mb-0">${title}<br>${description}</p>`;
	}).join(''));
	const accountsExpanded = ref(false);

	const accountOptions = computed(() => [
		{
			key: 'personal',
			label: account.personal.name,
			icon: 'pi pi-user',
			active: !account.current.org_id,
			command: () => account.switchTo(null),
		},
		...account.selectedOrgs.map(membership => ({
			key: membership.org.account,
			label: membership.org.name,
			icon: 'pi pi-building',
			active: membership.org.account === account.current.id,
			command: () => account.switchTo(membership.org.account),
		})),
		{
			key: 'add',
			label: 'Add organization',
			icon: 'pi pi-plus',
			command: () => { addOrgDialog.value = true; },
		},
	]);

	const items = computed(() => [
		{
			label: 'Settings',
			icon: 'pi pi-cog',
			route: '/settings',
		},
		...auth.adminMode ? [] : [
			{
				label: 'Act as organization',
				icon: 'pi pi-building',
				toggle: true,
			},
			...accountOptions.value.map(item => ({ ...item, visible: accountsExpanded.value, nested: true })),
		],
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

	const isSponsor = computed(() => account.current.user_type === 'sponsor' || account.current.user_type === 'special');

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
</style>
