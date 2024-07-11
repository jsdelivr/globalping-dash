<template>
	<div class="grid grid-cols-2 gap-4 p-6">
		<h1 class="col-span-2 mb-2 text-2xl font-bold">Overview</h1>
		<div class="bg-surface-0 dark:bg-dark-800 rounded-xl border max-xl:col-span-2">
			<p class="text-bluegray-700 dark:text-dark-0 flex border-b px-6 py-3 font-bold">Summary</p>
			<div class="p-6">
				<div class="flex max-sm:flex-wrap">
					<div class="max-sm:bg-surface-50 max-sm:dark:bg-dark-700 flex items-center max-sm:basis-full max-sm:rounded-xl max-sm:p-4">
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
							v-for="({ city, count }) in cities"
							:key="city"
							class="dark:border-dark-600 ml-3 rounded-full border px-3 py-2"
						>
							{{ city }}<span class="text-bluegray-500 dark:text-bluegray-400 ml-1.5">{{ count }}</span>
						</div>
						<div v-if="isEmpty(cities)" class="ml-2">No locations to show</div>
					</div>
					<Button
						class="ml-auto min-w-36 max-sm:ml-0 max-sm:mt-3"
						:severity="adoptedProbes.length ? 'secondary' : undefined"
						:outlined="adoptedProbes.length ? true : false"
						@click="adoptProbeDialog = true"
					>
						<nuxt-icon class="pi mr-2 mt-[2px]" name="capture"/>
						<span class="font-bold">{{ adoptedProbes.length ? "Adopt probe" : "Adopt your first probe" }}</span>
					</Button>
				</div>
			</div>
		</div>
		<div class="bg-surface-0 dark:bg-dark-800 rounded-xl border max-xl:col-span-2">
			<p class="text-bluegray-700 dark:text-dark-0 flex items-center border-b px-6 py-3 font-bold">
				Credits<i
					v-tooltip.top="user.github_username"
					class="pi pi-info-circle ml-2"
				/><!-- TODO: really username -->
			</p>
			<div class="p-6">
				<div class="flex max-sm:flex-wrap">
					<div class="max-sm:bg-surface-50 max-sm:dark:bg-dark-700 flex items-center max-sm:basis-full max-sm:rounded-xl max-sm:p-4">
						<BigIcon name="coin" border/>
						<div><span class="mx-2 text-3xl font-bold">{{ total }}</span>Total</div>
					</div>
					<div class="ml-auto flex items-center rounded-md border px-4 py-2 max-sm:ml-0 max-sm:mt-3">
						<span class="p-button-label mr-2 font-bold" :class="{ 'text-green-500': perDay, 'text-bluegray-500 dark:text-bluegray-400': !perDay }">+{{ perDay }}</span>
						<span>Per day</span>
					</div>
				</div>
				<div class="mt-6 flex items-center text-nowrap">
					<NuxtLink to="https://github.com/sponsors/jsdelivr" tabindex="-1" target="_blank">
						<Button
							:severity="perDay ? 'secondary' : undefined"
							:outlined="perDay ? true : false"
							icon="pi pi-plus"
							label="Add credits"
						/>
					</NuxtLink>
					<NuxtLink v-if="perDay" class="ml-auto" to="/credits" tabindex="-1">
						<Button link label="See details" icon-pos="right" icon="pi pi-chevron-right"/>
					</NuxtLink>
				</div>
			</div>
		</div>
		<div class="bg-surface-0 dark:bg-dark-800 col-span-2 rounded-xl border">
			<div class="text-bluegray-700 dark:text-dark-0 flex h-10 items-center border-b px-6 font-bold">
				<span>Probes</span>
				<NuxtLink class="ml-auto" to="/probes" tabindex="-1">
					<Button link label="See all" icon-pos="right" icon="pi pi-chevron-right"/>
				</NuxtLink>
			</div>
			<div class="p-6">
				<div v-if="adoptedProbes.length" class="probes-wrapper flex overflow-hidden max-sm:flex-col">
					<div v-for="probe in adoptedProbes" :key="probe.id" class="probe box-content min-w-60 py-2">
						<!-- TODO: clicking the name here should bring me to /probes, with the correct probe expanded and scrolled down to (if needed) -->
						<!-- TODO: a somewhat related bonus to the above - it would be nice if expanding probe details at /probes resulted in URL change  -->
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
				<div v-if="!adoptedProbes.length" class="bg-surface-50 dark:bg-dark-600 flex rounded-xl p-6 max-sm:flex-col max-sm:items-center">
					<img class="size-24 max-sm:mb-4" src="~/assets/images/hw-probe.png" alt="Hardware probe">
					<p class="ml-6 leading-tight">
						<b>You don't have any probes yet.</b><br><br>
						Get started by going to the <NuxtLink class="text-primary font-semibold hover:underline" to="/probes">Probes</NuxtLink> page to create a container probe.<br>
						<NuxtLink class="text-primary font-semibold hover:underline" to="https://github.com/sponsors/jsdelivr" target="_blank" rel="noopener">Become a sponsor</NuxtLink> and get a free plug-and-play hardware device.
					</p>
				</div>
			</div>
		</div>
		<Dialog
			v-model:visible="adoptProbeDialog"
			class="min-w-[700px] max-md:min-w-[95%]"
			modal
			dismissable-mask
			:draggable="false"
			header="Adopt a probe"
			content-class="!p-0"
		>
			<AdoptProbe @cancel="adoptProbeDialog = false" @adopted="refreshNuxtData"/>
		</Dialog>
	</div>
</template>

<script setup lang="ts">
	import { readItems } from '@directus/sdk';
	import countBy from 'lodash/countBy';
	import isEmpty from 'lodash/isEmpty';
	import CountryFlag from 'vue-country-flag-next';
	import { useAuth } from '~/store/auth';
	import { sendToast } from '~/utils/send-toast';

	useHead({
		title: 'Overview -',
	});

	const { $directus } = useNuxtApp();

	// SUMMARY

	const { data: adoptedProbes } = await useLazyAsyncData('gp_adopted_probes', async () => {
		try {
			const result = await $directus.request(readItems('gp_adopted_probes', {
				filter: { userId: { _eq: user.id } },
			}));
			return result;
		} catch (e) {
			sendToast(e);
			throw e;
		}
	}, { default: () => [] });

	const onlineProbes = computed(() => adoptedProbes.value.filter(({ status }) => status === 'ready'));
	const offlineProbes = computed(() => adoptedProbes.value.filter(({ status }) => status !== 'ready'));
	const cities = computed(() => Object.entries(countBy(adoptedProbes.value, 'city'))
		.map(([ city, count ]) => ({ city, count }))
		.sort((obj1, obj2) => obj2.count - obj1.count));

	// CREDITS

	const auth = useAuth();
	const user = auth.getUser;

	const { data: credits } = await useLazyAsyncData('gp_credits', async () => {
		try {
			const result = $directus.request(readItems('gp_credits', {
				filter: { user_id: { _eq: user.id } },
			}));
			return result;
		} catch (e) {
			sendToast(e);
			throw e;
		}
	}, { default: () => [] });

	const total = computed(() => {
		const creditsObj = credits.value?.find(({ user_id }) => user_id === user.id);
		return creditsObj ? creditsObj.amount.toLocaleString() : 0;
	});

	const { data: creditsAdditions } = await useLazyAsyncData('gp_credits_additions_last_day', () => {
		try {
			const result = $directus.request(readItems('gp_credits_additions', {
				filter: {
					github_id: { _eq: user.external_identifier || 'admin' },
					// @ts-ignore
					date_created: { _gte: '$NOW(-1 day)' },
					adopted_probe: { _nnull: true },
				},
			}));
			return result;
		} catch (e) {
			sendToast(e);
			throw e;
		}
	}, { default: () => [] });

	const perDay = computed(() => creditsAdditions.value.reduce((sum, { amount }) => sum += amount, 0));

	// ADOPT PROBE DIALOG

	const adoptProbeDialog = ref(false);
</script>

<style scoped>
	.probe + .probe {
		margin-left: 24px;
		padding-left: 24px;
		border-left-width: 1px;
	}

	@media (max-width: 640px) {
		.probe + .probe {
			margin-left: 0;
			padding-left: 0;
			border-left: 0;
			margin-top: 24px;
			padding-top: 24px;

			@apply border-t;
		}
	}

	@screen sm {
		.probes-wrapper {
			position: relative;
		}

		.probes-wrapper:after {
			content: "";
			position: absolute;
			bottom: 0;
			right: 0;
			width: 60px;
			height: 100%;
			pointer-events: none;
			background: linear-gradient(to left, #fff, transparent);
		}

		.dark .probes-wrapper:after {
			background: linear-gradient(to left, var(--dark-800), transparent);
		}
	}
</style>
