<template>
	<div class="min-h-full p-4 sm:p-6">
		<div class="mb-4 flex">
			<h1 class="page-title">Credits</h1>
			<NuxtLink to="https://github.com/sponsors/jsdelivr" tabindex="-1" class="ml-auto" target="_blank" rel="noopener">
				<Button label="Become a sponsor" icon="pi pi-github"/>
			</NuxtLink>
		</div>
		<div class="mt-2 flex max-md:grid max-md:grid-cols-2 max-md:gap-4">
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
		<div v-if="creditsChanges.length || loading || anyFilterApplied" class="mt-6">
			<DataTable
				:value="creditsChanges"
				lazy
				:first="first"
				:rows="itemsPerPage"
				data-key="id"
				:total-records="creditsChangesCount"
				:loading="initialLoading"
				class="max-md:hidden"
			>
				<template #header>
					<div class="flex items-center justify-between">
						History
						<CreditsFilters/>
					</div>
				</template>
				<Column header="Date" field="date_created" class="md:w-44 2xl:w-64">
					<template #body="slotProps">
						<AsyncCell :loading="loading">
							{{ slotProps.data.date_created }}
						</AsyncCell>
					</template>
				</Column>
				<Column header="Comment" field="comment">
					<template #body="slotProps">
						<AsyncCell :loading="loading">
							{{ formatCreditComment(slotProps.data) }}
						</AsyncCell>
					</template>
				</Column>
				<Column header="Amount" field="amount" class="md:w-44 2xl:w-64">
					<template #body="slotProps">
						<div class="flex min-h-7 items-center">
							<AsyncCell :loading="loading">
								<Tag v-if="slotProps.data.type === 'addition'" class="flex items-center !text-sm" severity="success">
									<NuxtIcon class="mr-2" name="coin" aria-hidden="true"/>+{{ (slotProps.data.amount || 0).toLocaleString('en-US') }}
								</Tag>
								<Tag v-else class="flex items-center !text-sm" severity="danger">
									<NuxtIcon class="mr-2" name="coin" aria-hidden="true"/>-{{ (slotProps.data.amount || 0).toLocaleString('en-US') }}
								</Tag>
							</AsyncCell>
						</div>
					</template>
				</Column>
				<template #empty><div class="p-6 text-center">No entries match the filter.</div></template>
			</DataTable>
			<div class="relative flex w-full flex-col gap-2 md:hidden">
				<div class="flex items-center justify-between px-2">
					<h2 class="text-lg font-semibold">History</h2>
					<CreditsFilters/>
				</div>
				<div v-if="loading && !creditsChanges.length" class="flex h-32 w-full items-center justify-center">
					<i class="pi pi-spin pi-spinner text-xl"/>
				</div>
				<p v-else-if="!creditsChanges.length && anyFilterApplied" class="rounded-lg bg-surface-0 p-6 py-12 text-center dark:bg-dark-700">
					No entries match the filter.
				</p>
				<AsyncRow v-for="(creditChange, index) in creditsChanges" v-else :key="index" :loading="loading">
					<CreditItem :credit-change="creditChange"/>
				</AsyncRow>
			</div>
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
	import CreditItem from '~/components/list-items/CreditItem.vue';
	import { computedDebounced } from '~/composables/computedDebounced';
	import { usePagination } from '~/composables/pagination';
	import { useCreditsFilters } from '~/composables/useCreditsFilters';
	import { useErrorToast } from '~/composables/useErrorToast';
	import { useUserFilter } from '~/composables/useUserFilter';
	import { useMetadata } from '~/store/metadata';
	import { formatDateForTable } from '~/utils/date-formatters';
	import { formatCreditComment } from '~/utils/format-credit-comment';
	import { minDelay } from '~/utils/min-delay';

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
	const initialLoading = ref(true);

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

	const { key, constructQuery, anyFilterApplied } = useCreditsFilters();
	const filterDeps = computedDebounced(() => [ key.value, first.value, itemsPerPage.value ]);

	const { data: creditsData, pending: loading, error: creditsDataError } = await useLazyAsyncData(
		() => minDelay($directus.request<{ changes: CreditsChange[]; count: number }>(customEndpoint({
			method: 'GET',
			path: '/credits-timeline',
			params: {
				userId: getUserFilter('user_id').user_id?._eq || 'all',
				...constructQuery(),
				offset: first.value,
				limit: itemsPerPage.value,
			},
		}))),
		{ watch: [ filterDeps ] },
	);

	watch(loading, (loading) => {
		if (!loading) {
			initialLoading.value = false;
		}
	});

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
</script>
