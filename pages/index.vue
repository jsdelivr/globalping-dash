<template>
	<div class="wrapper grid grid-cols-2 gap-4">
		<h1 class="title col-span-2 text-2xl font-bold">Overview</h1>
		<div class="rounded-xl border border-gray-300">
			<p class="text-bluegray-700 flex border-b border-gray-300 px-6 py-3 font-bold">Summary</p>
			<div class="p-6">
				<div class="flex">
					<div class="flex items-center"><BigIcon name="gp" border/><div><span class="number mx-2 text-3xl font-bold">{{ adoptedProbes?.length }}</span>Probes</div></div>
					<div class="ml-auto mr-6 flex items-center"><BigIcon name="point-online" filled/><div><span class="number mx-2 text-3xl font-bold">{{ onlineProbes.length }}</span>Online</div></div>
					<div class="flex items-center"><BigIcon name="point-offline" filled/><div><span class="number mx-2 text-3xl font-bold">{{ offlineProbes.length }}</span>Offline</div></div>
				</div>
				<div class="block__secondary-content mt-6 flex items-center text-nowrap">
					<div class="summary__locations fade-out flex grow items-center overflow-hidden"><div>Locations: </div><div v-for="(count, name) in cities" :key="name" class="summary__country border-surface-300 ml-3 rounded-full border px-3 py-2">{{ name }} <span class="summary__country-number text-bluegray-500">{{ count }}</span></div></div>
					<Button class="summary__adopt-button ml-3 min-w-36 grow" severity="secondary">
						<nuxt-icon class="pi mr-2 mt-[2px]" name="capture"/>
						<span class="font-bold">Adopt probe</span>
					</Button>
				</div>
			</div>
		</div>
		<div class="rounded-xl border border-gray-300">
			<p class="text-bluegray-700 flex items-center border-b border-gray-300 px-6 py-3 font-bold">Credits<i v-tooltip.top="user.github_username" class="pi pi-info-circle ml-2"/></p>
			<div class="p-6">
				<div class="flex">
					<div class="flex items-center"><BigIcon name="coin" border/><div><span class="mx-2 text-3xl font-bold">{{ total }}</span>Total</div></div>
					<div class="filler"/>
					<NuxtLink to="/credits" tabindex="-1">
						<Button class="ml-6" severity="secondary" label="Adopt probe">
							<span class="p-button-label mr-2 font-bold text-green-500">+{{ perDay }}</span>
							<span>Per day</span>
						</Button>
					</NuxtLink>
				</div>
				<div class="mt-6 flex items-center text-nowrap">
					<Button severity="secondary" icon="pi pi-plus" label="Add credits"/>
					<div class="filler"/>
					<NuxtLink to="/credits" tabindex="-1">
						<Button link label="See details" icon-pos="right" icon="pi pi-chevron-right"/>
					</NuxtLink>
				</div>
			</div>
		</div>
		<div class="col-span-2 rounded-xl border border-gray-300">
			<div class="text-bluegray-700 flex h-10 items-center border-b border-gray-300 px-6 font-bold">
				<span>Probes</span>
				<div class="filler"/>
				<NuxtLink to="/probes" tabindex="-1">
					<Button link label="See all" icon-pos="right" icon="pi pi-chevron-right"/>
				</NuxtLink>
			</div>
			<div class="p-6">
				<div class="fade-out flex overflow-hidden">
					<div v-for="probe in adoptedProbes" :key="probe.id" class="probe box-content min-w-60 py-2">
						<div class="mb-6 grid grid-cols-[auto_1fr] grid-rows-[auto_auto] gap-x-3">
							<BigIcon class="probe__icon col-span-1 row-span-2" name="gp" border online/>
							<p class="col-start-2 col-end-3 font-bold">{{ probe.name || probe.city }}</p>
							<p class="text-bluegray-400 col-start-2 col-end-3 row-start-2 row-end-3 text-[13px]">203.96.28.92</p>
						</div>
						<div>
							<div class="mb-2 flex items-center justify-between text-nowrap">
								<span class="mr-6 font-semibold">Location:</span>
								<div class="filler"/>
								<span class="mr-2 flex items-center justify-end">
									{{ probe.city }}, {{ probe.country }}
								</span>
								<CountryFlag class="probe__flag" :country="probe.country" size="small"/>
							</div>
							<div class="mb-2 flex items-center justify-between text-nowrap">
								<span class="mr-6 font-semibold">Version:</span>
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
	.probe + .probe {
		margin-left: 24px;
		padding-left: 24px;
		border-left: 1px solid var(--surface-300);
	}

	.probe .flag {
		transform: scale(0.35);
		border-radius: 5px;
	}
</style>
