<template>
	<section class="grid grid-cols-[256px_auto] grid-rows-[56px_auto]">
		<header class="col-span-2 flex bg-[#17233A] items-center py-3 px-6 text-surface-0">
			<NuxtLink to="/">
				<img class="h-6" src="~/assets/images/gp-logo-white.svg" alt="Globalping logo">
			</NuxtLink>
			<NuxtLink to="https://www.jsdelivr.com/" class="no-underline hover:underline text-xs m-2 text-surface-600">by jsDelivr</NuxtLink>
			<div class="filler"/>
			<NuxtLink class="no-underline text-surface-0 ml-6 hover:underline" to="https://www.jsdelivr.com/" target="_blank">
				<i class="pi pi-external-link text-surface-300"/>
				<span class="m-2">jsDelivr</span>
			</NuxtLink>
			<NuxtLink class="no-underline text-surface-0 ml-6 hover:underline" to="https://www.jsdelivr.com/globalping" target="_blank">
				<i class="pi pi-external-link text-surface-300"/>
				<span class="m-2">Globalping</span>
			</NuxtLink>
			<p class="mx-12">Account type: <span class="font-medium py-2 px-3 rounded-full bg-[#35425A]">{{ capitalize(user.user_type) }}</span></p>
			<Button class="mr-12 relative text-surface-0" text rounded @click="toggleNotifications">
				<i class="pi pi-bell text-[1.3rem]"/>
				<i v-if="newNotifications.length" class="pi pi-circle-fill text-[0.3rem] text-primary absolute top-1 right-3"/>
			</Button>
			<OverlayPanel ref="notificationsPanel">
				<Accordion class="box-border w-80" expand-icon="pi pi-chevron-right">
					<AccordionTab v-for="notification in reverseNotifications" :key="notification.id" :header="notification.subject">
						<span class="notifications__content" v-html="md.render(notification.message)"/>
					</AccordionTab>
				</Accordion>
			</OverlayPanel>
			<Button class="profile text-surface-0" text rounded @click="toggleProfile">
				<i class="pi pi-user profile__user-icon" style="font-size: 1.1rem"/>
				<p class="profile__username">{{ user.github_username }}</p>
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
		</header>
		<!-- <aside class="sidebar">
			<NuxtLink active-class="active" class="sidebar__link" to="/"><i class="pi pi-home"/>Overview</NuxtLink>
			<NuxtLink active-class="active" class="sidebar__link" to="/probes"><nuxt-icon class="pi" name="probe"/>Probes</NuxtLink>
			<NuxtLink active-class="active" class="sidebar__link" to="/credits"><nuxt-icon class="pi" name="coin"/>Credits</NuxtLink>
			<NuxtLink active-class="active" class="sidebar__link" to="/tokens"><i class="pi pi-database"/>Tokens</NuxtLink>
			<div class="filler"/>
			<div class="sponsorship">
				<p class="sponsorship__title">Sponsorship</p>
				<p class="sponsorship__text">Support the development of our products by becoming a sponsor.</p>
				<NuxtLink to="https://github.com/sponsors/jsdelivr" tabindex="-1">
					<Button label="Become a Sponsor" severity="contrast"/>
				</NuxtLink>
			</div>
		</aside>
		<div class="content">
			<slot/>
		</div> -->
	</section>
</template>

<script lang="ts" setup>
	import { useAuth } from '~/store/auth';
	import capitalize from 'lodash/capitalize';
	import { readNotifications, updateNotifications } from '@directus/sdk';
	import markdownit from 'markdown-it';

	const { $directus } = useNuxtApp();

	const auth = useAuth();
	const user = auth.getUser;

	// NOTIFICATIONS

	const md = markdownit();

	const notificationsPanel = ref();
	const toggleNotifications = async (event) => {
		notificationsPanel.value.toggle(event);

		if (newNotifications.value.length) {
			await $directus.request(updateNotifications(newNotifications.value.map(notification => notification.id), { status: 'archived' }));
		}
	};

	const { data: notifications } = await useAsyncData('directus_notifications', () => {
		return $directus.request(readNotifications());
	});

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
	const toggleProfile = async (event) => {
		profilePanel.value.toggle(event);
	};

	// PROFILE END

</script>

<style>
	.notifications__content p {
			margin-bottom: 18px;
		}

	.notifications__content p:last-child {
		margin-bottom: 0;
	}

	.notifications__content a {
		color: var(--primary);
		font-weight: 500;
	}
</style>

<style scoped>

	.profile {
		display: flex;
		align-items: center;
	}

	.profile__user-icon {
		border-radius: 50%;
		padding: 7px;
		border: 1.5px solid #fff;
	}

	.profile__username {
		margin: 8px;
	}

	.sidebar {
		display: flex;
		flex-direction: column;
		background: var(--surface-100);
		border: 1px solid var(--surface-300);
		padding: 16px;
	}

	.sidebar__link {
		position: relative;
		height: 40px;
		width: 100%;
		padding: 4px;
		margin-bottom: 8px;
		border-radius: 6px;
		text-decoration: none;
		color: var(--text-color);
		border: 1px solid transparent;
		display: flex;
		align-items: center;
		box-sizing: border-box;
	}

	.sidebar__link .pi {
		font-size: 1.2rem;
		padding-left: 16px;
		padding-right: 12px;
	}

	.sidebar__link.active {
		background: var(--surface-0);
		font-weight: 600;
		border: 1px solid var(--surface-300);
	}

	.sidebar__link.active::before {
		content: '';
		background: var(--primary-color);
		border-radius: 5px;
		position: absolute;
		left: 5px;
		top: 7px;
		bottom: 7px;
		width: 3px;
	}

	.sidebar__link:hover {
		background: var(--surface-0);
		border: 1px solid var(--surface-300);
	}

	.sponsorship {
		background: var(--surface-0);
		padding: 24px;
		border-radius: 12px;
		border: 1px solid var(--surface-300);
	}

	.sponsorship__title {
		font-weight: 600;
		margin-bottom: 8px;
	}

	.sponsorship__text {
		margin-bottom: 24px;
	}

	.content {
		padding: 24px;
	}
</style>
