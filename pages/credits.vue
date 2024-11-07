<template>
	<div class="min-h-full p-6" :class="{'min-w-[640px]': creditsChanges.length}">
		<div class="mb-4 flex">
			<h1 class="page-title">Credits</h1>
			<NuxtLink to="https://github.com/sponsors/jsdelivr" tabindex="-1" class="ml-auto" target="_blank" rel="noopener">
				<Button label="Become a sponsor" icon="pi pi-github"/>
			</NuxtLink>
		</div>
		<div class="mt-2 flex">
			<div class="mr-20">
				<p>Total credits</p>
				<p id="e2e_total-credits" class="text-lg font-bold">{{ credits.total.toLocaleString('en-US') }}</p>
			</div>
			<div class="mr-20">
				<p>Generated past 30 days</p>
				<p id="e2e_generated-credits" class="text-lg font-bold">{{ totalAdditions.toLocaleString('en-US') }}</p>
			</div>
			<div class="mr-20">
				<p>Spent past 30 days</p>
				<p id="e2e_spent-credits" class="text-lg font-bold">{{ totalDeductions.toLocaleString('en-US') }}</p>
			</div>
			<div>
				<p>Estimated to generate per day <i v-tooltip.top="'Credits are assigned once a day for probes that have been up for at least 20 hours.'" class="pi pi-info-circle"/></p>
				<p id="e2e_estimated-credits" class="text-lg font-bold">{{ dailyAdditions.toLocaleString('en-US') }}</p>
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
				<Column header="Comment" field="comment"/>
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
				class="mt-9"
				:first="first"
				:rows="itemsPerPage"
				:total-records="creditsChangesCount"
				template="PrevPageLink PageLinks NextPageLink"
				@page="page = $event.page"
			/>
		</div>
		<div v-else class="mt-6 rounded-xl border bg-surface-0 px-4 py-3 dark:bg-dark-800">
			<div class="rounded-xl bg-surface-50 p-6 text-center dark:bg-dark-600">
				<p class="font-semibold">No data to show</p>
				<p class="mt-4">Adopt a probe or become a sponsor to track your credit usage</p>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { aggregate, customEndpoint, readItems } from '@directus/sdk';
	import { usePagination } from '~/composables/pagination';
	import { useAuth } from '~/store/auth';
	import { formatDateForTable } from '~/utils/date-formatters';
	import { sendErrorToast } from '~/utils/send-toast';

	useHead({
		title: 'Credits -',
	});

	const config = useRuntimeConfig();
	const auth = useAuth();
	const user = auth.getUser as User;
	const { $directus } = useNuxtApp();
	const creditsPerAdoptedProbePerDay = config.public.creditsPerAdoptedProbePerDay;

	const itemsPerPage = config.public.itemsPerTablePage;
	const loading = ref(false);
	const creditsChangesCount = ref(0);
	const creditsChanges = ref<CreditsChange[]>([]);
	const { page, first } = usePagination({ itemsPerPage });

	const { data: credits } = await useLazyAsyncData('credits-stats', async () => {
		try {
			const [ total, additions, deductions, todayOnlineProbes ] = await Promise.all([
				$directus.request<{amount: number}[]>(readItems('gp_credits', {
					filter: { user_id: { _eq: user.id } },
				})),
				$directus.request<[{sum: { amount: string }, date_created: 'datetime'}]>(aggregate('gp_credits_additions', {
					query: { filter: { github_id: { _eq: user.external_identifier || 'admin' }, date_created: { _gte: '$NOW(-30 day)' } } },
					groupBy: [ 'date_created' ],
					aggregate: { sum: 'amount' },
				})).then((additions) => {
					return additions.map((addition) => {
						const { sum, ...rest } = addition;
						return { ...rest, amount: Number(sum.amount) };
					});
				}),
				$directus.request<[{sum: { amount: string }, date: 'datetime'}]>(aggregate('gp_credits_deductions', {
					query: { filter: { user_id: { _eq: user.id }, date: { _gte: '$NOW(-30 day)' } } },
					groupBy: [ 'date' ],
					aggregate: { sum: 'amount' },
				})).then((deduction) => {
					return deduction.map((addition) => {
						const { sum, ...rest } = addition;
						return { ...rest, amount: Number(sum.amount) };
					});
				}),
				$directus.request<[{count: number}]>(aggregate('gp_adopted_probes', {
					query: { filter: { userId: { _eq: user.id }, onlineTimesToday: { _gt: 0 } } },
					aggregate: { count: '*' },
				})),
			]);

			return { total: total[0]?.amount || 0, additions, deductions, todayOnlineProbes: todayOnlineProbes[0].count || 0 };
		} catch (e) {
			sendErrorToast(e);
			throw e;
		}
	}, { default: () => ({ total: 0, additions: [], deductions: [], todayOnlineProbes: 0 }) });

	const totalAdditions = computed(() => credits.value.additions.reduce((sum, addition) => sum + addition.amount, 0));
	const totalDeductions = computed(() => credits.value.deductions.reduce((sum, deduction) => sum + deduction.amount, 0));
	const dailyAdditions = computed(() => credits.value.todayOnlineProbes * creditsPerAdoptedProbePerDay);

	const loadLazyData = async () => {
		loading.value = true;

		try {
			const [
				{ changes },
				[{ count: additionsCount }],
				[{ count: deductionsCount }],
			] = await Promise.all([
				$directus.request<{changes: CreditsChange[]}>(customEndpoint({ method: 'GET', path: '/credits-timeline', params: {
					offset: first.value,
					limit: itemsPerPage,
				} })),
				$directus.request<[{count: number}]>(aggregate('gp_credits_additions', {
					aggregate: { count: '*' },
					query: { filter: { github_id: { _eq: user.external_identifier || 'admin' } } },
				})),
				$directus.request<[{count: number}]>(aggregate('gp_credits_deductions', {
					aggregate: { count: '*' },
					query: { filter: { user_id: { _eq: user.id } } },
				})),
			]);

			creditsChanges.value = [
				...changes.map(change => ({
					...change,
					comment: !change.comment && change.type === 'deduction' ? 'Measurements ran on this day.' : change.comment,
					date_created: formatDateForTable(change.date_created),
				})),
			];

			creditsChangesCount.value = additionsCount + deductionsCount;
		} catch (e) {
			sendErrorToast(e);
		}

		loading.value = false;
	};

	onMounted(async () => {
		await loadLazyData();
	});

	watch(page, async () => {
		await loadLazyData();
	});
</script>
