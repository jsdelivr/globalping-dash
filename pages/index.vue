<template>
	<div class="grid grid-cols-2 gap-4 p-6">
		<h1 class="page-title col-span-2 mb-2">Overview</h1>

		<div class="rounded-xl border bg-surface-0 max-[1480px]:col-span-2 dark:bg-dark-800">
			<p class="flex border-b px-6 py-3 font-bold text-bluegray-700 dark:text-dark-0">Summary</p>

			<AsyncBlock :status="statusProbes">
				<div class="p-6">
					<div class="flex max-sm:flex-wrap">
						<div class="flex items-center max-sm:basis-full max-sm:rounded-xl max-sm:bg-surface-50 max-sm:p-4 max-sm:dark:bg-dark-700">
							<BigIcon name="gp" border/>
							<div><span data-testid="probes-count" class="mx-2 text-3xl font-bold">{{ adoptedProbes.length }}</span>Probes</div>
						</div>
						<div class="ml-auto mr-6 flex items-center max-sm:ml-0 max-sm:mt-3">
							<BigIcon name="point-online" filled/>
							<div><span data-testid="online-probes-count" class="mx-2 text-3xl font-bold">{{ onlineProbes.length }}</span>Online</div>
						</div>
						<div class="flex items-center max-sm:mt-3">
							<BigIcon name="point-offline" filled/>
							<div><span data-testid="offline-probes-count" class="mx-2 text-3xl font-bold">{{ offlineProbes.length }}</span>Offline</div>
						</div>
					</div>
					<div class="mt-6 flex items-center text-nowrap max-sm:flex-wrap">
						<div class="fade-out flex grow items-center overflow-hidden max-sm:basis-full">
							<div>Locations: </div>
							<div
								v-for="({ city, count }) in cities"
								:key="city"
								class="ml-3 rounded-full border px-3 py-2 dark:border-dark-600"
							>
								{{ city }}<span class="ml-1.5 text-bluegray-500 dark:text-bluegray-400">{{ count }}</span>
							</div>
							<div v-if="isEmpty(cities)" class="ml-2">No locations to show</div>
						</div>
						<Button
							class="ml-auto min-w-36 max-sm:ml-0 max-sm:mt-3"
							:severity="adoptedProbes.length ? 'secondary' : undefined"
							:outlined="adoptedProbes.length ? true : false"
							@click="adoptProbeDialog = true"
						>
							<nuxt-icon class="pi" name="capture"/>
							<span class="font-bold">{{ adoptedProbes.length ? "Adopt a probe" : "Adopt your first probe" }}</span>
						</Button>
					</div>
				</div>
			</AsyncBlock>
		</div>

		<div class="rounded-xl border bg-surface-0 max-[1480px]:col-span-2 dark:bg-dark-800">
			<p class="flex items-center border-b px-6 py-3 font-bold text-bluegray-700 dark:text-dark-0">
				Credits<i
					v-tooltip.top="'Credits allow you to run measurements above the hourly limits.'"
					class="pi pi-info-circle ml-2"
				/>
			</p>

			<AsyncBlock :status="statusCredits">
				<div class="p-6">
					<div class="flex gap-x-2 max-sm:flex-wrap">
						<div class="flex items-center max-sm:basis-full max-sm:rounded-xl max-sm:bg-surface-50 max-sm:p-4 max-sm:dark:bg-dark-700">
							<BigIcon name="coin" border/>
							<div><span data-testid="total-credits" class="mx-2 text-3xl font-bold">{{ total.toLocaleString('en-US') }}</span>Total</div>
						</div>
						<div class="-mb-1 -mt-3 ml-auto flex flex-col items-center rounded-md border px-4 pt-2 max-sm:ml-0 max-sm:mt-3 max-sm:py-2">
							<div>
								<span data-testid="credits-from-probes" class="p-button-label font-bold" :class="{ 'text-green-500': perDay, 'text-bluegray-500 dark:text-bluegray-400': !perDay }">+{{ perDay.toLocaleString('en-US') }}</span>
								<span>&nbsp;/ day</span>
							</div>
							<div class="text-xs font-semibold text-bluegray-500">from probes</div>
						</div>
						<div :class="{ 'border-yellow-200 bg-yellow-50/80 dark:border-yellow-500/20 dark:bg-yellow-500/10': credits?.fromSponsorship }" class="-mb-1 -mt-3 ml-0 flex flex-col items-center rounded-md border px-4 pt-2 max-sm:mt-3 max-sm:py-2">
							<div>
								<span data-testid="credits-from-sponsorship" class="p-button-label font-bold" :class="{ 'text-green-500': credits?.fromSponsorship, 'text-bluegray-500 dark:text-bluegray-400': !credits?.fromSponsorship }">+{{ credits?.fromSponsorship.toLocaleString('en-US') }}</span>
								<span>&nbsp;/ month</span>
							</div>
							<div :class="{'!text-yellow-500 dark:!text-yellow-500/90': credits?.fromSponsorship}" class="text-xs font-semibold text-bluegray-500">from sponsorship</div>
						</div>
					</div>
					<div class="mt-6 flex items-center text-nowrap">
						<Button
							:severity="perDay ? 'secondary' : undefined"
							:outlined="perDay ? true : false"
							icon="pi pi-plus"
							label="Add credits"
							@click="creditsDialog = true"
						/>
						<NuxtLink v-if="perDay" class="ml-auto" to="/credits" tabindex="-1">
							<Button link label="See details" icon-pos="right" icon="pi pi-chevron-right"/>
						</NuxtLink>
					</div>
				</div>
			</AsyncBlock>
		</div>

		<div class="col-span-2 rounded-xl border bg-surface-0 dark:bg-dark-800">
			<div class="flex h-10 items-center border-b px-6 font-bold text-bluegray-700 dark:text-dark-0">
				<span>Probes</span>
				<NuxtLink class="ml-auto" to="/probes" tabindex="-1">
					<Button link label="See all" icon-pos="right" icon="pi pi-chevron-right"/>
				</NuxtLink>
			</div>

			<AsyncBlock :status="statusProbes">
				<div class="p-6">
					<div v-if="adoptedProbes.length" class="probes-wrapper flex overflow-hidden max-sm:flex-col">
						<div v-for="probe in adoptedProbes.slice(0, 10)" :key="probe.id" class="probe box-content min-w-60 py-2">
							<component :is="useWindowSize().width.value > 640 ? 'div' : NuxtLink" :to="`/probes/${probe.id}`" class="block">
								<div class="mb-6 grid grid-cols-[auto_1fr] grid-rows-[auto_auto] gap-x-3">
									<BigIcon class="col-span-1 row-span-2" :name="probe.hardwareDevice ? 'probe' : 'docker'" border :status="probe.status"/>
									<div
										class="col-start-2 col-end-3 flex items-center font-bold"
									>
										<NuxtLink class="hover:underline" :to="`/probes/${probe.id}`">{{ probe.name || probe.city }}</NuxtLink>
									</div>
									<p class="col-start-2 col-end-3 row-start-2 row-end-3 max-w-[185px] overflow-hidden text-ellipsis text-[13px] text-bluegray-400">{{ probe.ip }}</p>
								</div>
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
							</component>
						</div>
					</div>
					<div v-if="!adoptedProbes.length" class="flex rounded-xl bg-surface-50 p-6 max-sm:flex-col max-sm:items-center dark:bg-dark-600">
						<img class="size-24 max-sm:mb-4" src="~/assets/images/hw-probe.png" alt="Hardware probe">
						<p class="ml-6 leading-tight">
							<b>You don't have any probes yet.</b><br><br>
							Get started by going to the <NuxtLink class="font-semibold text-primary hover:underline" to="/probes">Probes</NuxtLink> page to create a container probe.<br>
							<NuxtLink class="font-semibold text-primary hover:underline" to="https://github.com/sponsors/jsdelivr" target="_blank" rel="noopener">Become a sponsor</NuxtLink> and get a free plug-and-play hardware device.
						</p>
					</div>
				</div>
			</AsyncBlock>
		</div>

		<GPDialog
			v-model:visible="adoptProbeDialog"
			header="Adopt a probe"
			content-class="!p-0"
		>
			<AdoptProbe @cancel="adoptProbeDialog = false" @adopted="refreshNuxtData"/>
		</GPDialog>

		<GPDialog
			v-model:visible="creditsDialog"
			header="Add credits"
			content-class="!p-0"
			class="w-[700px]"
			@after-hide="afterCreditsHide"
		>
			<AddCredits @cancel="creditsDialog = false" @adopt-a-probe="adoptProbeDialog = true"/>
		</GPDialog>
	</div>
</template>

<script setup lang="ts">
	import { NuxtLink } from '#components';
	import { readItems } from '@directus/sdk';
	import countBy from 'lodash/countBy';
	import isEmpty from 'lodash/isEmpty';
	import CountryFlag from 'vue-country-flag-next';
	import { useAuth } from '~/store/auth';
	import { sendErrorToast } from '~/utils/send-toast';

	useHead({
		title: 'Overview -',
	});

	const config = useRuntimeConfig();
	const { $directus } = useNuxtApp();
	const creditsPerAdoptedProbePerDay = config.public.creditsPerAdoptedProbePerDay;
	const route = useRoute();
	const router = useRouter();

	// SUMMARY

	const { status: statusProbes, data: adoptedProbes } = await useLazyAsyncData('gp_adopted_probes', async () => {
		try {
			const result = await $directus.request(readItems('gp_adopted_probes', {
				filter: { userId: { _eq: user.id } },
				sort: [ 'status', 'name' ],
			}));

			return result;
		} catch (e) {
			sendErrorToast(e);
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

	const { status: statusCredits, data: credits } = await useLazyAsyncData('gp_credits', async () => {
		try {
			let fromSponsorshipPromise = Promise.resolve(0);

			const totalPromise = $directus.request(readItems('gp_credits', {
				filter: { user_id: { _eq: user.id } },
			}));

			if (user.user_type !== 'member') {
				fromSponsorshipPromise = $directus.request(readItems('gp_credits_additions', {
					filter: {
						github_id: { _eq: user.external_identifier || 'admin' },
						comment: { _icontains: 'recurring' },
						date_created: { _gte: '$NOW(-35 day)' },
					},
					sort: '-date_created',
					limit: 1,
				})).then(additions => additions.reduce((acc, addition) => acc + addition.amount, 0));
			}

			const [
				total,
				fromSponsorship,
			] = await Promise.all([
				totalPromise,
				fromSponsorshipPromise,
			]);

			return { total, fromSponsorship };
		} catch (e) {
			sendErrorToast(e);
			throw e;
		}
	}, { default: () => {} });

	const total = computed(() => {
		const creditsObj = credits.value?.total.find(({ user_id }) => user_id === user.id);
		return creditsObj ? creditsObj.amount : 0;
	});

	const perDay = computed(() => adoptedProbes.value.reduce((sum, { onlineTimesToday }) => sum += onlineTimesToday ? creditsPerAdoptedProbePerDay : 0, 0));

	// ADOPT PROBE DIALOG

	const adoptProbeDialog = ref(false);

	// CREDITS DIALOG

	const creditsDialog = ref(route.query.view === 'add-credits');

	const afterCreditsHide = () => {
		if (route.query.view === 'add-credits') {
			const newQuery = { ...route.query };
			delete newQuery.view;

			router.push({
				path: route.path,
				query: newQuery,
			});
		}
	};

	watch(() => route.query.view, async () => {
		creditsDialog.value = route.query.view === 'add-credits';
	});

</script>

<style scoped>
	.probe + .probe {
		margin-left: 24px;
		padding-left: 24px;
		border-left-width: 1px;
	}

	@media (max-width: 639.99px) {
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
