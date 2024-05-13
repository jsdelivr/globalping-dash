<template>
	<section>
		<header class="header">
			<NuxtLink to="/">
				<img class="header__main-logo" src="~/assets/images/gp-logo-white.svg" alt="Globalping logo">
			</NuxtLink>
			<NuxtLink to="https://www.jsdelivr.com/" class="header__jsd-link">by jsDelivr</NuxtLink>
			<div class="header__filler"/>
			<NuxtLink class="header__external-link" to="https://www.jsdelivr.com/" target="_blank">
				<i class="pi pi-external-link"/>
				<span>jsDelivr</span>
			</NuxtLink>
			<NuxtLink class="header__external-link" to="https://www.jsdelivr.com/globalping" target="_blank">
				<i class="pi pi-external-link"/>
				<span>Globalping</span>
			</NuxtLink>
			<p class="header__account-type-title">Account type: <span class="header__account-type">{{ capitalize(user.user_type) }}</span></p>
			<Button class="notifications" text rounded @click="toggleNotifications">
				<i class="pi pi-bell" style="font-size: 1.3rem"/>
				<i class="pi pi-circle-fill notifications__new-icon" style="font-size: 0.3rem"/>
			</Button>
			<OverlayPanel ref="notificationsPanel">
				<Accordion class="notifications__accordion" expand-icon="pi pi-chevron-up">
					<AccordionTab v-for="notification in notifications" :header="notification.subject">
						<p>{{ notification.message }}</p>
					</AccordionTab>
				</Accordion>
			</OverlayPanel>
			<div class="profile">
				<i class="pi pi-user profile__user-icon" style="font-size: 1.1rem"/>
				<p class="profile__username">{{ user.github_username }}</p>
				<i class="pi pi-chevron-down" style="font-size: 0.7rem"/>
			</div>
			<!-- <Button label="Logout" @click="auth.logout"/> -->
		</header>
		<aside class="sidebar">
			<h2>Sidebar</h2>
			<ul>
				<li><NuxtLink to="/">Overview</NuxtLink></li>
				<li><NuxtLink to="/probes">Probes</NuxtLink></li>
				<li><NuxtLink to="/credits">Credits</NuxtLink></li>
				<li><NuxtLink to="/tokens">Tokens</NuxtLink></li>
			</ul>
		</aside>
		<div class="content">
			<slot/>
		</div>
	</section>
</template>

<script lang="ts" setup>
	import { useAuth } from '~/store/auth';
	import capitalize from 'lodash/capitalize';
	import { readNotifications } from '@directus/sdk';

	const { $directus } = useNuxtApp();

	const auth = useAuth();
	const user = auth.getUser;

	const notificationsPanel = ref();
	const toggleNotifications = (event) => {
		notificationsPanel.value.toggle(event);
	};

	const { data: notifications } = await useAsyncData('adoptedProbes', () => {
		return $directus.request(readNotifications());
	});

	console.log('notifications', notifications.value);
</script>

<style scoped>
	section {
		display: grid;
		grid-template-columns: 256px auto;
		grid-template-rows: 56px auto;
	}

	.header {
		grid-column: 1 / 3;
		display: flex;
		background: #17233A;
		align-items: center;
		padding: 12px 24px;
		color: var(--surface-0);
	}

	.header__main-logo {
		height: 24px;
	}

	.header__jsd-link {
		font-size: 12px;
		margin: 8px;
		color: var(--bluegray-600);
	}

	.header__filler {
		flex-grow: 1;
	}

	.header__external-link {
		color: var(--surface-0);
		margin-left: 24px;
	}

	.header__external-link i {
		color: var(--bluegray-300);
	}

	.header__external-link span {
		margin: 8px;
	}

	.header__account-type-title {
		margin: 0 48px;
	}

	.header__account-type {
		font-weight: 600;
		background: #35425a;
		padding: 8px 12px;
		border-radius: 32px;
	}

	.notifications {
		color: var(--surface-0);
		margin-right: 48px;
		position: relative;
	}

	.notifications__new-icon {
		color: var(--primary-color);
		position: absolute;
		top: 8px;
		right: 15px;
	}

	.notifications__accordion {
		box-sizing: border-box;
		width: 340px
	}

	.profile {
		display: flex;
		align-items: center;
	}

	.profile__user-icon {
		border-radius: 50%;
		padding: 7px;
		border: 1.5px solid white;
	}

	.profile__username {
		margin: 8px;
	}
</style>
