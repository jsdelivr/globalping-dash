<template>
	<div class="wrapper">
		<h1 class="title">Overview</h1>
		<div class="block summary">
			<p class="block__title">Summary</p>
			<div class="block__content">
				<div class="block__main-content">
					<div class="big-number"><BigIcon name="gp" border/><div><span class="number">{{ adoptedProbes?.length }}</span><span class="title">Probes</span></div></div>
					<div class="filler"/>
					<div class="big-number"><BigIcon name="point-online" filled/><div><span class="number">{{ onlineProbes.length }}</span><span class="title">Online</span></div></div>
					<div class="big-number"><BigIcon name="point-offline" filled/><div><span class="number">{{ offlineProbes.length }}</span><span class="title">Offline</span></div></div>
				</div>
				<div class="block__secondary-content">
					<div class="summary__locations fade-out"><div>Locations: </div><div v-for="(count, name) in cities" :key="name" class="summary__country">{{ name }} <span class="summary__country-number">{{ count }}</span></div></div>
					<Button class="summary__adopt-button" severity="secondary">
						<nuxt-icon class="p-button-icon p-button-icon-left" name="capture"/>
						<span class="p-button-label">Adopt probe</span>
					</Button>
				</div>
			</div>
		</div>
		<div class="block credits">
			<p class="block__title">Credits<i v-tooltip.top="user.github_username" class="pi pi-info-circle"/></p>
			<div class="block__content">
				<div class="block__main-content">
					<div class="big-number"><BigIcon name="coin" border/><div><span class="number">{{ total }}</span><span class="title">Total</span></div></div>
					<div class="filler"/>
					<NuxtLink to="/credits" tabindex="-1">
						<Button class="credits__per-day-button" severity="secondary" label="Adopt probe">
							<span class="p-button-label credits__per-day-number">+{{ perDay }}</span>
							<span>Per day</span>
						</Button>
					</NuxtLink>
				</div>
				<div class="block__secondary-content">
					<Button severity="secondary" icon="pi pi-plus" label="Add credits"/>
					<div class="filler"/>
					<NuxtLink to="/credits" tabindex="-1">
						<Button link label="See details" icon-pos="right" icon="pi pi-chevron-right"/>
					</NuxtLink>
				</div>
			</div>
		</div>
		<div class="block probes">
			<div class="block__title">
				<span>Probes</span>
				<div class="filler"/>
				<NuxtLink to="/probes" tabindex="-1">
					<Button link label="See all" icon-pos="right" icon="pi pi-chevron-right"/>
				</NuxtLink>
			</div>
			<div class="block__content">
				<div class="block__main-content probes__main-content fade-out">
					<div v-for="probe in adoptedProbes" :key="probe.id" class="probe">
						<div class="probe__header">
							<BigIcon class="probe__icon" name="gp" border online/>
							<b>{{ probe.name || probe.city }}</b>
							<p>203.96.28.92</p>
						</div>
						<div class="probe__properties">
							<div class="probe__property">
								<span class="probe__field">Location:</span>
								<div class="filler"/>
								<span class="probe__value">
									{{ probe.city }}, {{ probe.country }}
								</span>
								<CountryFlag class="probe__flag" :country="probe.country" size="small"/>
							</div>
							<div class="probe__property">
								<b>Version:</b>
								<span>{{ probe.version }}</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { useAuth } from '~/store/auth';
	import { readItems } from '@directus/sdk';
	import countBy from 'lodash/countBy';
	import CountryFlag from 'vue-country-flag-next';

	console.log('CountryFlag', CountryFlag);
	const { $directus } = useNuxtApp();

	// SUMMARY

	const { data: adoptedProbes } = await useAsyncData('gp_adopted_probes', () => {
		return $directus.request(readItems('gp_adopted_probes'));
	});

	const onlineProbes = computed(() => adoptedProbes.value?.filter(({ status }) => status === 'online'));
	const offlineProbes = computed(() => adoptedProbes.value?.filter(({ status }) => status === 'offline'));
	const cities = computed(() => countBy(adoptedProbes.value, 'city'));

	// CREDITS

	const auth = useAuth();
	const user = auth.getUser;

	const { data: credits } = await useAsyncData('gp_credits', () => {
		return $directus.request(readItems('gp_credits'));
	});
	const total = computed(() => credits.value[0].amount.toLocaleString());

	const { data: creditsAdditions } = await useAsyncData('gp_credits_additions_last_day', () => {
		return $directus.request(readItems('gp_credits_additions', {
			filter: {
				date_created: { _gte: '$NOW(-1 day)' },
				adopted_probe: { _nnull: true },
			},
		}));
	});
	const perDay = computed(() => creditsAdditions.value?.reduce((sum, { amount }) => sum += amount, 0));
</script>

<style scoped>
	.wrapper {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		column-gap: 16px;
		row-gap: 16px;
	}

	.title {
		grid-column: 1 / 3;
	}

	.block {
		border: 1px solid var(--surface-300);
		border-radius: 12px;
	}

	.block__title {
		display: flex;
		align-items: center;
		font-weight: 600;
		padding: 0 24px;
		min-height: 40px;
		border-bottom: 1px solid var(--surface-300);
		color: var(--bluegray-700);
	}

	.block__title i {
		margin-left: 10px;
	}

	.block__content {
		padding: 24px;
	}

	.block__main-content {
		display: flex;
	}

	.probes__main-content {
		overflow: hidden;
		position: relative;
	}

	.big-number {
		display: flex;
		align-items: center;
	}

	.big-number + .big-number {
		margin-left: 24px;
	}

	.big-number .number {
		font-size: 28px;
		font-weight: 600;
		margin-left: 10px;
		margin-right: 8px;
	}

	.block__secondary-content {
		display: flex;
		align-items: center;
		margin-top: 24px;
		text-wrap: nowrap;
	}

	.summary__locations {
		display: flex;
		align-items: center;
		overflow: hidden;
		position: relative;
		flex-grow: 1;
	}

	.summary__country {
		padding: 8px 12px;
		border-radius: 32px;
		border: 1px solid var(--surface-300);
		margin-left: 12px;
	}

	.summary__country-number {
		color: var(--bluegray-500);
	}

	.summary__adopt-button {
		margin-left: 24px;
		min-width: 140px;
	}

	/* CREDITS */

	.credits__per-day-button {
		margin-left: 24px;
	}

	.credits__per-day-number {
		color: var(--green-500);
		margin-right: 8px;
	}

	/* PROBES */

	.probes {
		grid-column: 1 / 3;
	}

	.probe {
		box-sizing: content-box;
		min-width: 240px;
		padding: 8px 0;
	}

	.probe + .probe {
		margin-left: 24px;
		padding-left: 24px;
		border-left: 1px solid var(--surface-300);
	}

	.probe__header {
		display: grid;
		grid-template-columns: auto 1fr;
		grid-template-rows: auto auto;
		grid-column-gap: 12px;
		margin-bottom: 24px;
	}

	.probe__icon {
		grid-column: 1 / 2;
		grid-row: 1 / 3;
	}

	.probe__header b {
  grid-column: 2 / 3;
  grid-row: 1 / 2;

	}

	.probe__header p {
		grid-column: 2 / 3;
		grid-row: 2 / 3;
		font-size: 13px;
		color: var(--bluegray-400);
	}

	.probe__property {
		display: flex;
		justify-content: space-between;
		align-items: center;
		text-wrap: nowrap;
		margin-bottom: 10px;
	}

	.probe__field {
		font-weight: 600;
		margin-right: 24px;
	}

	.probe__value {
		display: flex;
		align-items: center;
		justify-content: end;
		margin-right: 8px;
	}

	.probe__flag.flag {
		transform: scale(0.35);
		border-radius: 5px;
	}
</style>
