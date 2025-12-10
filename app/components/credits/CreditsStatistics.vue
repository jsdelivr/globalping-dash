<template>
	<section class="flex flex-col gap-4">
		<div class="flex items-center justify-between gap-2">
			<h3 class="text-lg font-bold">
				Statistics
			</h3>
			<CreditsPeriodPicker/>
		</div>
		<div class="flex gap-4 max-xl:flex-col">
			<div class="flex flex-1 flex-col rounded-xl border bg-white dark:bg-dark-800 dark:text-white">
				<h4 class="border-b px-4 py-2 font-bold">
					From sponsorship
				</h4>
				<AsyncBlock class="relative flex min-h-28 gap-2 p-3 max-md:min-h-[21rem] max-md:flex-col" :status="creditsDataLoading ? 'pending' : ''">
					<div class="relative flex h-full flex-1 flex-col justify-between gap-1.5 rounded-lg bg-surface-50 p-3 dark:bg-dark-700">
						Donated
						<b class="text-2xl">
							${{credits.totalDonated.toLocaleString('en-US')}}
						</b>
					</div>
					<div class="relative flex h-full flex-1 flex-col justify-between gap-1.5 rounded-lg bg-surface-50 p-3 dark:bg-dark-700">
						<span v-if="isRelativeFilter">
							Current bonus
						</span>
						<span v-else>
							Bonus
						</span>
						<b class="text-2xl">
							{{credits.bonus > 0 ? `+${credits.bonus}%` : '0%'}}
						</b>
					</div>
					<div class="bg-gradient-highlight relative flex h-full flex-1 flex-col justify-between gap-1.5 rounded-lg p-3">
						Credits gained
						<b class="inline-flex items-center gap-2 text-2xl">
							<NuxtIcon class="text-xl" name="coin" aria-hidden="true"/>{{ (sponsorshipAdditions).toLocaleString('en-US') }}
						</b>
					</div>
				</AsyncBlock>
			</div>
			<div class="flex flex-1 flex-col rounded-xl border bg-white dark:bg-dark-800 dark:text-white">
				<h4 class="flex items-center gap-2 border-b px-4 py-2 font-bold">
					From probes
					<i
						v-tooltip.top="'Credits are assigned once a day for probes that have been up for at least 20 hours.'"
						class="pi pi-info-circle"
					/>
				</h4>
				<AsyncBlock class="relative flex min-h-28 gap-2 p-3 max-md:min-h-[21rem] max-md:flex-col" :status="creditsDataLoading ? 'pending' : ''">
					<div class="relative flex h-full flex-1 flex-col justify-between gap-1.5 rounded-lg bg-surface-50 p-3 dark:bg-dark-700">
						<span class="inline-flex justify-between gap-2">
							Online probes
							<span v-if="isRelativeFilter" class="size-4 shrink-0 rounded-full border-4 border-green-200 bg-green-500 dark:size-2.5 dark:border-[0.2rem] dark:border-green-500 dark:bg-green-300"/>
						</span>
						<b class="text-2xl">
							{{ credits.onlineProbes }}
						</b>
					</div>
					<div class="relative flex h-full flex-1 flex-col justify-between gap-1.5 rounded-lg bg-surface-50 p-3 dark:bg-dark-700">
						<span v-if="isRelativeFilter">
							Estimated per day
						</span>
						<span v-else>
							Daily average
						</span>
						<b class="inline-flex items-center gap-2 text-2xl">
							<NuxtIcon class="text-xl" name="coin" aria-hidden="true"/>
							<span data-testid="estimated-credits">{{ dailyAdditions.toLocaleString('en-US') }}</span>
						</b>

					</div>
					<div class="bg-gradient-highlight relative flex h-full flex-1 flex-col justify-between gap-1.5 rounded-lg p-3">
						Credits gained
						<b class="inline-flex items-center gap-2 text-2xl">
							<NuxtIcon class="text-xl" name="coin" aria-hidden="true"/>{{ probeAdditions.toLocaleString('en-US') }}
						</b>
					</div>
				</AsyncBlock>
			</div>
		</div>
		<CreditsChart
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
	import { minDelay } from '~/utils/min-delay';

	const auth = useAuth();
	const metadata = useMetadata();
	const { $directus } = useNuxtApp();
	const { directusDateQuery, filter } = useCreditsFilters();
	const { getUserFilter } = useUserFilter();

	const creditsPerAdoptedProbe = metadata.creditsPerAdoptedProbe;

	const isRelativeFilter = computed(() => filter.value.month === 'past' || filter.value.year === 'past');

	const endDate = computed(() => {
		if (isRelativeFilter.value) {
			return undefined;
		}

		const year = filter.value.year as number;
		const month = (filter.value.month as number) ?? 11;
		return new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();
	});

	const { data: credits, error: creditsError, pending: creditsDataLoading } = await useLazyAsyncData('credits-stats', async () => {
		const [ additions, deductions, sponsorshipDonations, sponsorshipDetails, adoptions ] = await minDelay(Promise.all([
			$directus.request<{ sum: { amount: number }; date_created: 'datetime'; reason: string }[]>(aggregate('gp_credits_additions', {
				query: {
					filter: {
						...getUserFilter('github_id'),
						date_created: directusDateQuery.value,
					},
				},
				groupBy: [ 'date_created', 'reason' ],
				aggregate: { sum: 'amount' },
			})),
			$directus.request<{ sum: { amount: number }; date: 'datetime' }[]>(aggregate('gp_credits_deductions', {
				query: {
					filter: {
						...getUserFilter('user_id'),
						date: directusDateQuery.value,
					},
				},
				groupBy: [ 'date' ],
				aggregate: { sum: 'amount' },
			})),
			$directus.request<{ meta: null | { amountInDollars?: number } }[]>(readItems('gp_credits_additions', {
				filter: {
					...getUserFilter('github_id'),
					date_created: directusDateQuery.value,
					reason: {
						_in: [ 'recurring_sponsorship', 'one_time_sponsorship', 'tier_changed' ],
					},
				},
				fields: [ 'meta' ],
			})),
			$directus.request<SponsorshipDetails>(customEndpoint({
				path: '/sponsorship-details',
				params: { userId: auth.user.id, ...endDate.value && { to: endDate.value } },
			})),
			isRelativeFilter.value
				? $directus.request<[{ count: number }]>(aggregate('gp_probes', {
					query: {
						filter: {
							...getUserFilter('userId'),
							onlineTimesToday: { _gt: 0 },
						},
					},
					aggregate: { count: '*' },
				}))
				: $directus.request<{ meta: { ip: string; id: string } }[]>(readItems('gp_credits_additions', {
					filter: {
						...getUserFilter('github_id'),
						date_created: directusDateQuery.value,
						reason: {
							_eq: 'adopted_probe',
						},
					},
					fields: [ 'meta' ],
				})),
		]), 500);

		return {
			additions,
			deductions,
			sponsorshipDonations,
			sponsorshipDetails,
			adoptions,
		};
	}, {
		default: () => ({ additions: [], deductions: [], totalDonated: 0, bonus: 0, onlineProbes: 0 }),
		transform: ({ additions, deductions, sponsorshipDonations, sponsorshipDetails, adoptions }) => ({
			deductions: deductions.map((addition) => {
				const { sum, ...rest } = addition;
				return { ...rest, amount: sum.amount };
			}),
			additions: additions.map((addition) => {
				const { sum, ...rest } = addition;
				return { ...rest, amount: sum.amount };
			}),
			totalDonated: sponsorshipDonations.reduce((sum, { meta }) => sum + (meta?.amountInDollars ?? 0), 0),
			bonus: sponsorshipDetails.bonus,
			onlineProbes: adoptions.length && 'count' in adoptions[0]
				? adoptions[0].count
				: adoptions.reduce((keys, adoption) => {
					// TS doesnt infer the correct type automatically
					if ('meta' in adoption) {
						const key = adoption.meta.id || adoption.meta.ip;
						keys.add(key);
					}

					return keys;
				}, new Set()).size,
		}),
		watch: [ directusDateQuery ],
	});

	const probeAdditions = computed(() => credits.value.additions.reduce((sum, addition) => sum + (addition.reason === 'adopted_probe' ? addition.amount : 0), 0));
	const sponsorshipAdditions = computed(() => credits.value.additions.reduce((sum, addition) => sum + (addition.reason.includes('sponsorship') ? addition.amount : 0), 0));
	const dailyAdditions = computed(() => {
		if (isRelativeFilter.value) {
			return credits.value.onlineProbes * creditsPerAdoptedProbe;
		}

		const year = filter.value.year as number;
		let periodLength;

		if (typeof filter.value.month === 'undefined') {
			const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
			periodLength = isLeap ? 366 : 365;
		} else {
			const month = filter.value.month as number;
			periodLength = new Date(year, month + 1, 0).getDate();
		}

		return Math.round(probeAdditions.value / periodLength);
	});

	useErrorToast(creditsError);
</script>
