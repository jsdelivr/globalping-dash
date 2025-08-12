<template>
	<div class="min-h-full p-4 sm:p-6" :class="{'min-w-[640px]': creditsChanges.length}">
		<div class="mb-4 flex">
			<h1 class="page-title">Credits</h1>
			<NuxtLink to="https://github.com/sponsors/jsdelivr" tabindex="-1" class="ml-auto" target="_blank" rel="noopener">
				<Button label="Become a sponsor" icon="pi pi-github"/>
			</NuxtLink>
		</div>
		<div class="mt-2 flex">
			<div class="mr-20">
				<p>Total credits</p>
				<p data-testid="total-credits" class="text-lg font-bold">{{ credits.total.toLocaleString('en-US') }}</p>
			</div>
			<div class="mr-20">
				<p>Generated past 30 days</p>
				<p data-testid="generated-credits" class="text-lg font-bold">{{ totalAdditions.toLocaleString('en-US') }}</p>
			</div>
			<div class="mr-20">
				<p>Spent past 30 days</p>
				<p data-testid="spent-credits" class="text-lg font-bold">{{ totalDeductions.toLocaleString('en-US') }}</p>
			</div>
			<div>
				<p>Estimated to generate per day <i v-tooltip.top="'Credits are assigned once a day for probes that have been up for at least 20 hours.'" class="pi pi-info-circle"/></p>
				<p data-testid="estimated-credits" class="text-lg font-bold">{{ dailyAdditions.toLocaleString('en-US') }}</p>
			</div>
		</div>
		<div class="mt-6">
			<CreditsChart :start="credits.total - totalAdditions + totalDeductions" :additions="credits.additions" :deductions="credits.deductions"/>
		</div>
		<div v-if="creditsChanges.length || loading" class="mt-6">
			<DataTable
				:value="creditsChanges"
				lazy
				:first="first"
				:rows="itemsPerPage"
				data-key="id"
				:total-records="creditsChangesCount"
				:loading="loading"
			>
				<Column header="Date" field="date_created"/>
				<Column header="Comment" field="comment">
					<template #body="slotProps">
						{{ formatComment(slotProps.data) }}
					</template>
				</Column>
				<Column header="Amount" field="amount">
					<template #body="slotProps">
						<Tag v-if="slotProps.data.type === 'addition'" class="flex items-center !text-sm" severity="success">
							<nuxt-icon class="mr-2 mt-0.5" name="coin"/>+{{ (slotProps.data.amount || 0).toLocaleString('en-US') }}
						</Tag>
						<Tag v-else class="flex items-center !text-sm" severity="danger">
							<nuxt-icon class="mr-2 mt-0.5" name="coin"/>-{{ (slotProps.data.amount || 0).toLocaleString('en-US') }}
						</Tag>
					</template>
				</Column>
			</DataTable>
			<Paginator
				v-if="creditsChanges.length !== creditsChangesCount"
				class="mt-6"
				:first="first"
				:rows="itemsPerPage"
				:total-records="creditsChangesCount"
				:page-link-size="pageLinkSize"
				:template="template"
				@page="page = $event.page"
			/>
		</div>
		<div v-else class="mt-6 rounded-xl border bg-surface-0 px-4 py-3 dark:bg-dark-800">
			<div class="rounded-xl bg-surface-50 p-6 text-center dark:bg-dark-600">
				<p class="font-semibold">No data to show</p>
				<p class="mt-4">Adopt a probe or become a sponsor to track your credit usage</p>
				<Button label="Add credits" class="mt-4" icon="pi pi-plus" @click="creditsDialog = true"/>
			</div>
		</div>

		<GPDialog
			v-model:visible="creditsDialog"
			header="Add credits"
			content-class="!p-0"
			size="w-[700px]"
		>
			<AddCredits
				@cancel="creditsDialog = false"
				@adopt-a-probe="() => {
					creditsDialog = false;
					adoptProbeDialog = true;
				}"
			/>
		</GPDialog>

		<GPDialog
			v-model:visible="adoptProbeDialog"
			header="Adopt a probe"
			content-class="!p-0"
			size="large"
		>
			<AdoptProbe @cancel="adoptProbeDialog = false" @adopted="refreshNuxtData"/>
		</GPDialog>
	</div>
</template>

<script setup lang="ts">
	import { aggregate, customEndpoint, readItems } from '@directus/sdk';
	import { usePagination } from '~/composables/pagination';
	import { useErrorToast } from '~/composables/useErrorToast';
	import { useUserFilter } from '~/composables/useUserFilter';
	import { useMetadata } from '~/store/metadata';
	import { formatDateForTable } from '~/utils/date-formatters';

	useHead({
		title: 'Credits -',
	});

	const config = useRuntimeConfig();
	const { $directus } = useNuxtApp();
	const metadata = useMetadata();
	const route = useRoute();
	const { getUserFilter } = useUserFilter();

	const creditsPerAdoptedProbe = metadata.creditsPerAdoptedProbe;
	const itemsPerPage = ref(config.public.itemsPerTablePage);

	const { page, first, pageLinkSize, template } = usePagination({ itemsPerPage });

	const { data: credits, error: creditsError } = await useLazyAsyncData('credits-stats', async () => {
		const [ total, additions, deductions, todayOnlineProbes ] = await Promise.all([
			$directus.request<{ amount: number }[]>(readItems('gp_credits', {
				filter: getUserFilter('user_id'),
			})),
			$directus.request<[{ sum: { amount: number }; date_created: 'datetime' }]>(aggregate('gp_credits_additions', {
				query: {
					filter: {
						...getUserFilter('github_id'),
						date_created: { _gte: '$NOW(-30 day)' },
					},
				},
				groupBy: [ 'date_created' ],
				aggregate: { sum: 'amount' },
			})).then((additions) => {
				return additions.map((addition) => {
					const { sum, ...rest } = addition;
					return { ...rest, amount: sum.amount };
				});
			}),
			$directus.request<[{ sum: { amount: number }; date: 'datetime' }]>(aggregate('gp_credits_deductions', {
				query: {
					filter: {
						...getUserFilter('user_id'),
						date: { _gte: '$NOW(-30 day)' },
					},
				},
				groupBy: [ 'date' ],
				aggregate: { sum: 'amount' },
			})).then((deduction) => {
				return deduction.map((addition) => {
					const { sum, ...rest } = addition;
					return { ...rest, amount: sum.amount };
				});
			}),
			$directus.request<[{ count: number }]>(aggregate('gp_probes', {
				query: {
					filter: {
						...getUserFilter('userId'),
						onlineTimesToday: { _gt: 0 },
					},
				},
				aggregate: { count: '*' },
			})),
		]);

		return {
			total: total.reduce((sum, { amount }) => sum + amount, 0) || 0,
			additions,
			deductions,
			todayOnlineProbes: todayOnlineProbes[0].count || 0,
		};
	}, {
		default: () => ({ total: 0, additions: [], deductions: [], todayOnlineProbes: 0 }),
	});

	const totalAdditions = computed(() => credits.value.additions.reduce((sum, addition) => sum + addition.amount, 0));
	const totalDeductions = computed(() => credits.value.deductions.reduce((sum, deduction) => sum + deduction.amount, 0));
	const dailyAdditions = computed(() => credits.value.todayOnlineProbes * creditsPerAdoptedProbe);

	const { data: creditsData, pending: loading, error: creditsDataError } = await useLazyAsyncData(
		() => $directus.request<{ changes: CreditsChange[]; count: number }>(customEndpoint({
			method: 'GET',
			path: '/credits-timeline',
			params: {
				userId: getUserFilter('user_id').user_id?._eq || 'all',
				offset: first.value,
				limit: itemsPerPage.value,
			},
		})),
		{ watch: [ page, itemsPerPage ] },
	);

	const creditsChangesCount = computed(() => creditsData.value?.count || 0);

	const creditsChanges = computed<CreditsChange[]>(() => {
		if (!creditsData.value) {
			return [];
		}

		return [
			...creditsData.value.changes.map(change => ({
				...change,
				date_created: formatDateForTable(change.date_created),
			})),
		];
	});

	useErrorToast(creditsError, creditsDataError);

	onMounted(async () => {
		if (!route.query.limit) {
			itemsPerPage.value = Math.min(Math.max(Math.floor((window.innerHeight - 540) / 54), 5), 15);
		}
	});

	// CREDITS DIALOG

	const creditsDialog = ref(false);
	const adoptProbeDialog = ref(false);

	const formatComment = (change: CreditsChange) => {
		if (change.type === 'deduction') {
			return 'Measurements ran on this day.';
		}

		switch (change.reason) {
			case 'one_time_sponsorship':
				return `One-time $${change.meta?.amountInDollars} sponsorship.`;
			case 'recurring_sponsorship':
				return `Recurring $${change.meta?.amountInDollars} sponsorship.`;
			case 'tier_changed':
				return `Sponsorship tier changed. Adding a diff of $${change.meta?.amountInDollars}.`;
			case 'adopted_probe':
				return `Adopted probes.`;
			default:
				return change.meta?.comment || 'Other';
		}
	};
</script>
