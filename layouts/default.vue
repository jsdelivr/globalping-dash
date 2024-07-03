<template>
	<section class="grid grid-cols-[256px_auto] grid-rows-[56px_auto] max-lg:grid-cols-1">
		<Toast class="max-[440px]:left-5 max-[440px]:w-auto"/>
		<header class="text-surface-0 bg-dark-800 col-span-2 flex items-center border-b px-6 py-3 max-lg:px-3">
			<NuxtLink to="/">
				<img class="h-6" src="~/assets/images/gp-logo-white.svg" alt="Globalping logo">
			</NuxtLink>
			<NuxtLink to="https://www.jsdelivr.com/" class="text-bluegray-600 m-2 mr-auto text-xs no-underline hover:underline">by jsDelivr</NuxtLink>
			<div class="flex items-center max-lg:hidden">
				<NuxtLink class="text-surface-0 ml-6 no-underline hover:underline" to="https://www.jsdelivr.com/" target="_blank">
					<i class="pi pi-external-link text-bluegray-300"/>
					<span class="m-2">jsDelivr</span>
				</NuxtLink>
				<NuxtLink class="text-surface-0 ml-6 no-underline hover:underline" to="https://www.jsdelivr.com/globalping" target="_blank">
					<i class="pi pi-external-link text-bluegray-300"/>
					<span class="m-2">Globalping</span>
				</NuxtLink>
				<p class="mx-12">Account type: <span class="rounded-full bg-[#35425A] px-3 py-2 font-semibold">{{ capitalize(user.user_type) }}</span></p>
				<Button class="text-surface-0 relative mr-8" text rounded aria-label="Notifications" @click="toggleNotifications">
					<i class="pi pi-bell text-[1.3rem]"/>
					<i v-if="newNotifications.length" class="pi pi-circle-fill text-primary absolute right-3 top-1 text-[0.3rem]"/>
				</Button>
				<Button class="text-surface-0 flex items-center" text rounded aria-label="Profile" @click="toggleProfile">
					<i class="pi pi-user border-surface-0 rounded-full border-[1.5px] p-2" style="font-size: 1.1rem"/>
					<p class="m-2 font-semibold">{{ user.github_username || `${user.first_name} ${user.last_name}` }}</p>
					<i class="pi pi-chevron-down" style="font-size: 0.7rem"/>
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
				<Button class="text-surface-0 relative mr-4" text aria-label="Notifications" @click="toggleNotifications">
					<i class="pi pi-bell text-[1.3rem]"/>
					<i v-if="newNotifications.length" class="pi pi-circle-fill text-primary absolute right-3 top-1 text-[0.3rem]"/>
				</Button>
				<Button class="text-surface-0 text-[1.3rem]" icon="pi pi-bars" aria-label="Menu" text @click="mobileSidebar = true"/>
				<Sidebar v-model:visible="mobileSidebar" class="bg-surface-100 border pt-4" :header="user.github_username">
					<NuxtLink active-class="active" class="sidebar-link" to="/" @click="mobileSidebar = false"><i class="pi pi-home text-bluegray-400 pl-4 pr-3 text-xl"/>Overview</NuxtLink>
					<NuxtLink active-class="active" class="sidebar-link" to="/probes" @click="mobileSidebar = false"><nuxt-icon class="pi text-bluegray-400 pl-4 pr-3 text-xl" name="probe"/>Probes</NuxtLink>
					<NuxtLink active-class="active" class="sidebar-link" to="/credits" @click="mobileSidebar = false"><nuxt-icon class="pi text-bluegray-400 pl-4 pr-3 text-xl" name="coin"/>Credits</NuxtLink>
					<NuxtLink active-class="active" class="sidebar-link" to="/tokens" @click="mobileSidebar = false"><i class="pi pi-database text-bluegray-400 pl-4 pr-3 text-xl"/>Tokens</NuxtLink>
					<NuxtLink active-class="active" class="sidebar-link" to="/settings" @click="mobileSidebar = false"><i class="pi pi-cog text-bluegray-400 pl-4 pr-3 text-xl"/>Settings</NuxtLink>
					<button active-class="active" class="sidebar-link" @click="auth.logout"><i class="pi pi-power-off text-bluegray-400 pl-4 pr-3 text-xl"/>Log out</button>
					<div class="flex flex-col border-t">
						<NuxtLink class="text-bluegray-600 dark:text-bluegray-100 ml-6 mt-4 no-underline hover:underline" to="https://www.jsdelivr.com/" target="_blank">
							<i class="pi pi-external-link text-bluegray-300"/>
							<span class="m-2">jsDelivr</span>
						</NuxtLink>
						<NuxtLink class="text-bluegray-600 dark:text-bluegray-100 ml-6 mt-4 no-underline hover:underline" to="https://www.jsdelivr.com/globalping" target="_blank">
							<i class="pi pi-external-link text-bluegray-300"/>
							<span class="m-2">Globalping</span>
						</NuxtLink>
					</div>
					<div class="bg-surface-0 dark:bg-dark-500 dark:border-dark-300 mt-8 rounded-xl border p-6">
						<p class="mb-2 font-bold">Sponsorship</p>
						<p class="mb-6">Support the development of our products by becoming a sponsor.</p>
						<NuxtLink to="https://github.com/sponsors/jsdelivr" tabindex="-1" target="_blank" rel="noopener">
							<Button label="Become a Sponsor" severity="contrast"/>
						</NuxtLink>
					</div>
				</Sidebar>
			</div>
			<OverlayPanel ref="notificationsPanel">
				<Accordion v-if="reverseNotifications.length" class="box-border w-80" expand-icon="pi pi-chevron-right">
					<AccordionTab v-for="notification in reverseNotifications" :key="notification.id" :header="notification.subject">
						<span v-if="notification.message" class="notification" v-html="DOMPurify.sanitize(md.render(notification.message))"/>
					</AccordionTab>
				</Accordion>
				<p v-else class="w-80 p-4">No notifications</p>
			</OverlayPanel>
		</header>
		<aside class="bg-surface-100 dark:bg-dark-700 flex flex-col border-r p-4 max-lg:hidden">
			<NuxtLink active-class="active" class="sidebar-link" to="/"><i class="pi pi-home text-bluegray-400 pl-4 pr-3 text-xl"/>Overview</NuxtLink>
			<NuxtLink active-class="active" class="sidebar-link" to="/probes"><nuxt-icon class="pi text-bluegray-400 pl-4 pr-3 text-xl" name="probe"/>Probes</NuxtLink>
			<NuxtLink active-class="active" class="sidebar-link" to="/credits"><nuxt-icon class="pi text-bluegray-400 pl-4 pr-3 text-xl" name="coin"/>Credits</NuxtLink>
			<NuxtLink active-class="active" class="sidebar-link" to="/tokens"><i class="pi pi-database text-bluegray-400 pl-4 pr-3 text-xl"/>Tokens</NuxtLink>
			<div class="bg-surface-0 dark:bg-dark-500 dark:border-dark-300 mt-auto rounded-xl border p-6">
				<p class="mb-2 font-bold">Sponsorship</p>
				<p class="mb-6">Support the development of our products by becoming a sponsor.</p>
				<NuxtLink to="https://github.com/sponsors/jsdelivr" tabindex="-1" target="_blank" rel="noopener">
					<Button label="Become a Sponsor" severity="contrast"/>
				</NuxtLink>
			</div>
		</aside>
		<div class="max-lg:overflow-x-scroll">
			<slot/>
		</div>
	</section>
</template>

<script lang="ts" setup>
	import { useAuth } from '~/store/auth';
	import capitalize from 'lodash/capitalize';
	import { readNotifications, updateNotifications } from '@directus/sdk';
	import markdownit from 'markdown-it';
	import DOMPurify from 'dompurify';

	const { $directus } = useNuxtApp();

	const auth = useAuth();
	const user = auth.getUser as User;

	// NOTIFICATIONS

	const md = markdownit();

	const notificationsPanel = ref();
	const toggleNotifications = async (event: Event) => {
		notificationsPanel.value.toggle(event);

		if (newNotifications.value.length) {
			await $directus.request(updateNotifications(newNotifications.value.map(notification => notification.id), { status: 'archived' }));
		}
	};

	const { data: notifications } = await useAsyncData('directus_notifications', async () => {
		return $directus.request(readNotifications());
	}, { default: () => [] });

	const newNotifications = computed(() => notifications.value.filter(notification => notification.status === 'inbox'));

	const reverseNotifications = computed(() => [ ...notifications.value ].reverse());

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
			label: 'Log out',
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

</script>

<style>
	.notification p {
			margin-bottom: 18px;
		}

	.notification p:last-child {
		margin-bottom: 0;
	}

	.notification a {
		color: var(--primary);
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

	.dark .sidebar-link {
		color: var(--surface-0);
	}

	.sidebar-link.active {
		background: var(--surface-0);
		font-weight: 600;
		border: 1px solid var(--surface-300);
	}

	.dark .sidebar-link.active {
		background: var(--dark-500);
		border-color: var(--dark-300);
	}

	.sidebar-link.active .pi {
		color: var(--surface-90)
	}

	.sidebar-link.active::before {
		content: '';
		background: var(--primary);
		border-radius: 5px;
		position: absolute;
		left: 5px;
		top: 7px;
		bottom: 7px;
		width: 3px;
	}

	.sidebar-link:hover {
		background: var(--surface-0);
		border: 1px solid var(--surface-300);
	}

	.dark .sidebar-link:hover {
		background: var(--dark-500);
		border-color: var(--dark-300);
	}
</style>
