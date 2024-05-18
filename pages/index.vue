<template>
	<div class="wrapper grid grid-cols-2 gap-4">
		<h1 class="title col-span-2 text-2xl font-semibold">Overview</h1>
		<div class="block border border-gray-300 rounded-xl">
			<p class="block__title flex font-semibold px-6 py-3 border-b border-gray-300 text-bluegray-700">Summary</p>
			<div class="block__content p-6">
				<div class="block__main-content flex">
					<div class="big-number flex items-center"><BigIcon name="gp" border/><div><span class="number text-3xl font-semibold mx-2">{{ adoptedProbes?.length }}</span>Probes</div></div>
					<div class="big-number ml-auto flex items-center mr-6"><BigIcon name="point-online" filled/><div><span class="number text-3xl font-semibold mx-2">{{ onlineProbes.length }}</span>Online</div></div>
					<div class="big-number flex items-center"><BigIcon name="point-offline" filled/><div><span class="number text-3xl font-semibold mx-2">{{ offlineProbes.length }}</span>Offline</div></div>
				</div>
				<div class="block__secondary-content flex items-center mt-6 text-nowrap">
					<div class="summary__locations flex items-center flex-grow overflow-hidden fade-out"><div>Locations: </div><div v-for="(count, name) in cities" :key="name" class="summary__country border border-surface-300 px-3 py-2 rounded-full ml-3">{{ name }} <span class="summary__country-number text-bluegray-500">{{ count }}</span></div></div>
					<Button class="summary__adopt-button grow min-w-36 ml-3" severity="secondary">
						<nuxt-icon class="pi mt-[2px] mr-2" name="capture"/>
						<span class="font-semibold">Adopt probe</span>
					</Button>
				</div>
			</div>
		</div>
		<div class="border border-gray-300 rounded-xl">
			<p class="flex items-center font-semibold px-6 py-3 border-b border-gray-300 text-bluegray-700">Credits<i v-tooltip.top="user.github_username" class="pi pi-info-circle ml-2"/></p>
			<div class="p-6">
				<div class="flex">
					<div class="flex items-center"><BigIcon name="coin" border/><div><span class="text-3xl font-semibold mx-2">{{ total }}</span>Total</div></div>
					<div class="filler"/>
					<NuxtLink to="/credits" tabindex="-1">
						<Button class="ml-6" severity="secondary" label="Adopt probe">
							<span class="p-button-label text-green-500 mr-2 font-semibold">+{{ perDay }}</span>
							<span>Per day</span>
						</Button>
					</NuxtLink>
				</div>
				<div class="flex items-center mt-6 text-nowrap">
					<Button severity="secondary" icon="pi pi-plus" label="Add credits"/>
					<div class="filler"/>
					<NuxtLink to="/credits" tabindex="-1">
						<Button link label="See details" icon-pos="right" icon="pi pi-chevron-right"/>
					</NuxtLink>
				</div>
			</div>
		</div>
		<!-- <div class="block probes">
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
		</div> -->
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
	.probes__main-content {
		overflow: hidden;
		position: relative;
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
