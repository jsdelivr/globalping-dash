<template>
	<div class="grid grid-cols-2 gap-4 p-6">
		<h1 class="col-span-2 mb-2 text-2xl font-bold">Overview</h1>
		<div class="rounded-xl border max-xl:col-span-2">
			<p class="text-bluegray-700 flex border-b px-6 py-3 font-bold">Summary</p>
			<div class="p-6">
				<div class="flex max-sm:flex-wrap">
					<div class="max-sm:bg-surface-50 flex items-center max-sm:basis-full max-sm:rounded-xl max-sm:p-4">
						<BigIcon name="gp" border/>
						<div><span class="mx-2 text-3xl font-bold">{{ adoptedProbes.length }}</span>Probes</div>
					</div>
					<div class="ml-auto mr-6 flex items-center max-sm:ml-0 max-sm:mt-3">
						<BigIcon name="point-online" filled/>
						<div><span class="mx-2 text-3xl font-bold">{{ onlineProbes.length }}</span>Online</div>
					</div>
					<div class="flex items-center max-sm:mt-3">
						<BigIcon name="point-offline" filled/>
						<div><span class="mx-2 text-3xl font-bold">{{ offlineProbes.length }}</span>Offline</div>
					</div>
				</div>
				<div class="mt-6 flex items-center text-nowrap max-sm:flex-wrap">
					<div class="fade-out flex grow items-center overflow-hidden max-sm:basis-full">
						<div>Locations: </div>
						<div
							v-for="(count, name) in cities"
							:key="name"
							class="border-surface-300 ml-3 rounded-full border px-3 py-2"
						>
							{{ name }} <span class="text-bluegray-500">{{ count }}</span>
						</div>
						<div v-if="isEmpty(cities)" class="ml-2">No locations to show</div>
					</div>
					<Button class="ml-auto min-w-36 max-sm:ml-0 max-sm:mt-3" :severity="adoptedProbes.length ? 'secondary' : undefined">
						<nuxt-icon class="pi mr-2 mt-[2px]" name="capture"/>
						<span class="font-bold">{{ adoptedProbes.length ? "Adopt probe" : "Adopt first probe" }}</span>
					</Button>
				</div>
			</div>
		</div>
		<div class="rounded-xl border max-xl:col-span-2">
			<p class="text-bluegray-700 flex items-center border-b px-6 py-3 font-bold">
				Credits<i
					v-tooltip.top="user.github_username"
					class="pi pi-info-circle ml-2"
				/>
			</p>
			<div class="p-6">
				<div class="flex max-sm:flex-wrap">
					<div class="max-sm:bg-surface-50 flex items-center max-sm:basis-full max-sm:rounded-xl max-sm:p-4">
						<BigIcon name="coin" border/>
						<div><span class="mx-2 text-3xl font-bold">{{ total }}</span>Total</div>
					</div>
					<NuxtLink class="ml-auto max-sm:ml-0 max-sm:mt-3" to="/credits" tabindex="-1">
						<Button severity="secondary" label="Adopt probe">
							<span class="p-button-label mr-2 font-bold" :class="{ 'text-green-500': perDay, 'text-bluegray-500': !perDay }">+{{ perDay }}</span>
							<span>Per day</span>
						</Button>
					</NuxtLink>
				</div>
				<div class="mt-6 flex items-center text-nowrap">
					<NuxtLink to="https://github.com/sponsors/jsdelivr" tabindex="-1">
						<Button :severity="perDay ? 'secondary' : undefined" icon="pi pi-plus" label="Add credits"/>
					</NuxtLink>
					<NuxtLink v-if="perDay" class="ml-auto" to="/credits" tabindex="-1">
						<Button link label="See details" icon-pos="right" icon="pi pi-chevron-right"/>
					</NuxtLink>
				</div>
			</div>
		</div>
		<div class="col-span-2 rounded-xl border">
			<div class="text-bluegray-700 flex h-10 items-center border-b px-6 font-bold">
				<span>Probes</span>
				<NuxtLink class="ml-auto" to="/probes" tabindex="-1">
					<Button link label="See all" icon-pos="right" icon="pi pi-chevron-right"/>
				</NuxtLink>
			</div>
			<div class="p-6">
				<div v-if="adoptedProbes.length" class="probes-wrapper flex overflow-hidden max-sm:flex-col">
					<div v-for="probe in adoptedProbes" :key="probe.id" class="probe box-content min-w-60 py-2">
						<ProbeHeader
							class="mb-6"
							:name="probe.name || probe.city"
							:ip="probe.ip"
							:status="probe.status"
							:hardware-device="!!probe.hardwareDevice"
							ip-css="text-[13px]"
						/>
						<div>
							<div class="mb-2 flex items-center text-nowrap">
								<span class="mr-6 font-semibold">Location:</span>
								<span class="ml-auto mr-2 flex items-center justify-end">
									{{ probe.city }}, {{ probe.country }}
								</span>
								<CountryFlag :country="probe.country" size="small"/>
							</div>
							<div class="mb-2 flex items-center justify-between text-nowrap">
								<span class="mr-6 font-semibold">Version:</span>
								<span>{{ probe.version }}</span>
							</div>
						</div>
					</div>
				</div>
				<div v-if="!adoptedProbes.length" class="bg-surface-50 flex rounded-xl p-6 ">
					<img class="w-24" src="~/assets/images/hw-probe.png" alt="Hardware probe">
					<p class="ml-6 leading-tight">
						<b>You don't have any probes yet.</b><br><br>
						Get started by going to <NuxtLink class="text-primary font-semibold hover:underline" to="/probes">Probes</NuxtLink> page to create a container probe.<br>
						Or <NuxtLink class="text-primary font-semibold hover:underline" to="https://github.com/sponsors/jsdelivr" target="_blank" rel="noopener">become a sponsor</NuxtLink> and get a free hardware ARM based device that is plug-and-play.
					</p>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { useAuth } from '~/store/auth';
	import { readItems } from '@directus/sdk';
	import countBy from 'lodash/countBy';
	import isEmpty from 'lodash/isEmpty';
	import CountryFlag from 'vue-country-flag-next';

	const { $directus } = useNuxtApp();

	// SUMMARY

	const { data: adoptedProbes } = await useAsyncData('gp_adopted_probes_limit_10', () => {
		return $directus.request(readItems('gp_adopted_probes', {
			limit: 10,
		}));
	}, { default: () => [] });

	const onlineProbes = computed(() => adoptedProbes.value.filter(({ status }) => status === 'ready'));
	const offlineProbes = computed(() => adoptedProbes.value.filter(({ status }) => status !== 'ready'));
	const cities = computed(() => countBy(adoptedProbes.value, 'city'));

	// CREDITS

	const auth = useAuth();
	const user = auth.getUser;

	const { data: credits } = await useAsyncData('gp_credits', () => {
		return $directus.request(readItems('gp_credits'));
	}, { default: () => [] });
	const total = computed(() => credits.value?.[0]?.amount?.toLocaleString() ?? '0');

	const { data: creditsAdditions } = await useAsyncData('gp_credits_additions_last_day', () => {
		return $directus.request(readItems('gp_credits_additions', {
			filter: {
				// @ts-ignore
				date_created: { _gte: '$NOW(-1 day)' },
				adopted_probe: { _nnull: true },
			},
		}));
	}, { default: () => [] });
	const perDay = computed(() => creditsAdditions.value.reduce((sum, { amount }) => sum += amount, 0));
</script>

<style scoped>
.probe + .probe {
	margin-left: 24px;
	padding-left: 24px;
	border-left: 1px solid var(--surface-300);
}

@media (max-width: 640px) {
	.probe + .probe {
		margin-left: 0;
		padding-left: 0;
		border-left: 0;
		margin-top: 24px;
		padding-top: 24px;
		border-top: 1px solid var(--surface-300);
	}
}

@screen sm {
	.probes-wrapper {
		position: relative;
	}

	.probes-wrapper::after {
		content: '';
		position: absolute;
		bottom: 0;
		right: 0;
		width: 60px;
		height: 100%;
		pointer-events: none;
		background: linear-gradient(to left, white, transparent);
	}
}
</style>
