<template>
	<section class="flex flex-col gap-4">
		<div class="flex items-center justify-between gap-2">
			<h3 class="text-lg font-bold">
				Statistics
			</h3>
			<div class="flex items-center gap-3">
				<i v-if="creditsDataLoading" class="pi pi-spinner animate-spin text-surface-500 dark:text-bluegray-500"/>
				<CreditsPeriodPicker/>
			</div>
		</div>
		<div class="flex gap-4 max-xl:flex-col">
			<div class="flex flex-1 flex-col rounded-xl border bg-white dark:bg-dark-800 dark:text-white">
				<h4 class="border-b px-4 py-2 font-bold">
					From sponsorship
				</h4>
				<div class="flex flex-1 gap-2 p-3 max-md:flex-col">
					<div class="relative flex min-h-16 flex-1 flex-col justify-between gap-1.5 rounded-lg bg-surface-50 p-3 dark:bg-dark-700">
						Donated
						<b class="text-2xl">
							${{credits.totalDonated.toLocaleString('en-US')}}
						</b>
						<i class="pi pi-calendar absolute right-3 top-3 text-surface-500 dark:text-bluegray-500"/>
					</div>
					<div class="flex min-h-16 flex-1 flex-col justify-between gap-1.5 rounded-lg bg-surface-50 p-3 dark:bg-dark-700">
						Current bonus
						<b class="text-2xl">
							{{sponsorshipDetails.bonus > 0 ? `+${sponsorshipDetails.bonus}%` : '0%'}}
						</b>
					</div>
					<div class="bg-gradient-highlight relative flex min-h-16 flex-1 flex-col justify-between gap-1.5 rounded-lg bg-surface-50 p-3">
						Credits gained
						<b class="inline-flex items-center gap-2 text-2xl">
							<NuxtIcon class="text-xl" name="coin" aria-hidden="true"/>{{ (sponsorshipAdditions).toLocaleString('en-US') }}
						</b>
						<i class="pi pi-calendar absolute right-3 top-3 text-primary-400 dark:text-bluegray-500"/>
					</div>
				</div>
			</div>
			<div class="flex flex-1 flex-col rounded-xl border bg-white dark:bg-dark-800 dark:text-white">
				<h4 class="flex items-center gap-2 border-b px-4 py-2 font-bold">
					From probes
					<i
						v-tooltip.top="'Credits are assigned once a day for probes that have been up for at least 20 hours.'"
						class="pi pi-info-circle"
					/>
				</h4>
				<div class="flex flex-1 gap-2 p-3 max-md:flex-col">
					<div class="ga relative flex min-h-16 flex-1 flex-col justify-between rounded-lg bg-surface-50 p-3 dark:bg-dark-700">
						<span class="inline-flex justify-between gap-2">
							Online probes
							<span class="size-4 shrink-0 rounded-full border-4 border-green-200 bg-green-500 dark:size-2.5 dark:border-[0.2rem] dark:border-green-500 dark:bg-green-300"/>
						</span>
						<b class="text-2xl">
							{{ todayOnlineProbes }}
						</b>
					</div>
					<div class="flex min-h-16 flex-1 flex-col justify-between gap-1.5 rounded-lg bg-surface-50 p-3 dark:bg-dark-700">
						Estimated per day
						<b class="inline-flex items-center gap-2 text-2xl">
							<NuxtIcon class="text-xl" name="coin" aria-hidden="true"/>
							<span data-testid="estimated-credits">{{ dailyAdditions.toLocaleString('en-US') }}</span>
						</b>

					</div>
					<div class="bg-gradient-highlight relative flex min-h-16 flex-1 flex-col justify-between gap-1.5 rounded-lg bg-surface-50 p-3">
						Credits gained
						<b class="inline-flex items-center gap-2 text-2xl">
							<NuxtIcon class="text-xl" name="coin" aria-hidden="true"/>{{ probeAdditions.toLocaleString('en-US') }}
						</b>
						<i class="pi pi-calendar absolute right-3 top-3 text-primary-400 dark:text-bluegray-500"/>
					</div>
				</div>
			</div>
		</div>
		<CreditsChart
			:start="credits.startingBalance"
			:additions="credits.additions"
			:deductions="credits.deductions"
			:loading="creditsDataLoading"
		/>
	</section>
</template>

<script setup lang="ts">
	import { aggregate, customEndpoint, readItems } from '@directus/sdk';
	import { useCreditsFilters } from '~/composables/useCreditsFilters';
	import { useErrorToast } from '~/composables/useErrorToast';
	import { useUserFilter } from '~/composables/useUserFilter';
	import { useAuth } from '~/store/auth';
	import { useMetadata } from '~/store/metadata';

	const auth = useAuth();
	const metadata = useMetadata();
	const { $directus } = useNuxtApp();
	const { directusDateQuery } = useCreditsFilters();
	const { getUserFilter } = useUserFilter();

	const creditsPerAdoptedProbe = metadata.creditsPerAdoptedProbe;

	const filterStartDate = computed(() => {
		if ('_gte' in directusDateQuery.value) {
			return directusDateQuery.value._gte;
		}

		return directusDateQuery.value._between[0];
	});

	const { data: credits, error: creditsError, pending: creditsDataLoading } = await useLazyAsyncData('credits-stats', async () => {
		const [ additions, deductions, sponsorshipDonations, prevAdditions, prevDeductions ] = await Promise.all([
			$directus.request<[{ sum: { amount: number }; date_created: 'datetime'; reason: string }]>(aggregate('gp_credits_additions', {
				query: {
					filter: {
						...getUserFilter('github_id'),
						date_created: directusDateQuery.value,
					},
				},
				groupBy: [ 'date_created', 'reason' ],
				aggregate: { sum: 'amount' },
			})),
			$directus.request<[{ sum: { amount: number }; date: 'datetime' }]>(aggregate('gp_credits_deductions', {
				query: {
					filter: {
						...getUserFilter('user_id'),
						date: directusDateQuery.value,
					},
				},
				groupBy: [ 'date' ],
				aggregate: { sum: 'amount' },
			})),
			$directus.request<[{ meta: null | { amountInDollars?: number } }]>(readItems('gp_credits_additions', {
				filter: {
					...getUserFilter('github_id'),
					date_created: directusDateQuery.value,
					reason: {
						_in: [ 'recurring_sponsorship', 'one_time_sponsorship', 'tier_changed' ],
					},
				},
				fields: [ 'meta' ],
			})),
			$directus.request<[{ sum: { amount: number } }]>(aggregate('gp_credits_additions', {
				query: {
					filter: {
						...getUserFilter('github_id'),
						date_created: { _lt: filterStartDate.value },
					},
				},
				aggregate: { sum: 'amount' },
			})),
			$directus.request<[{ sum: { amount: number } }]>(aggregate('gp_credits_deductions', {
				query: {
					filter: {
						...getUserFilter('user_id'),
						date: { _lt: filterStartDate.value },
					},
				},
				aggregate: { sum: 'amount' },
			})),
		]);

		return {
			prevAdditions,
			prevDeductions,
			additions,
			deductions,
			sponsorshipDonations,
		};
	}, {
		default: () => ({ startingBalance: 0, additions: [], deductions: [], totalDonated: 0 }),
		transform: ({ prevAdditions, prevDeductions, additions, deductions, sponsorshipDonations }) => ({
			startingBalance: (prevAdditions[0].sum?.amount || 0) - (prevDeductions[0].sum?.amount || 0),
			deductions: deductions.map((addition) => {
				const { sum, ...rest } = addition;
				return { ...rest, amount: sum.amount };
			}),
			additions: additions.map((addition) => {
				const { sum, ...rest } = addition;
				return { ...rest, amount: sum.amount };
			}),
			totalDonated: sponsorshipDonations.reduce((sum, { meta }) => sum + (meta?.amountInDollars ?? 0), 0),
		}),
		watch: [ directusDateQuery ],
	});

	const { data: todayOnlineProbes, error: onlineProbesError } = await useLazyAsyncData(
		'online-probes',
		() => $directus.request<[{ count: number }]>(aggregate('gp_probes', {
			query: {
				filter: {
					...getUserFilter('userId'),
					onlineTimesToday: { _gt: 0 },
				},
			},
			aggregate: { count: '*' },
		})),
		{
			default: () => 0,
			transform: data => data[0].count || 0,
		},
	);

	const { data: sponsorshipDetails, error: sponsorshipError } = await useLazyAsyncData(
		'gp_sponsorship-details',
		() => auth.isLoggedIn
			? $directus.request<SponsorshipDetails>(customEndpoint({
				path: '/sponsorship-details',
				params: { userId: auth.user.id },
			}))
			: Promise.resolve({ bonus: 0, donatedInLastYear: 0, donatedByMonth: [] }),
		{
			default: () => ({ bonus: 0, donatedInLastYear: 0, donatedByMonth: [] }),
		},
	);

	const probeAdditions = computed(() => credits.value.additions.reduce((sum, addition) => sum + (addition.reason === 'adopted_probe' ? addition.amount : 0), 0));
	const sponsorshipAdditions = computed(() => credits.value.additions.reduce((sum, addition) => sum + (addition.reason.includes('sponsorship') ? addition.amount : 0), 0));
	const dailyAdditions = computed(() => todayOnlineProbes.value * creditsPerAdoptedProbe);

	useErrorToast(creditsError, sponsorshipError, onlineProbesError);
</script>
