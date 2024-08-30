<template>
	<div class="flex min-h-full flex-col p-6" :class="{'min-w-[640px]': creditsChanges.length}">
		<div class="mb-6 flex">
			<h1 class="title">Credits</h1>
			<NuxtLink to="https://github.com/sponsors/jsdelivr" tabindex="-1" class="ml-auto" target="_blank" rel="noopener">
				<Button label="Become a sponsor" icon="pi pi-github"/>
			</NuxtLink>
		</div>
		<div class="mt-2 flex">
			<div class="mr-20">
				<p>Total credits</p>
				<p class="text-lg font-bold">{{ credits.total.toLocaleString('en-US') }}</p>
			</div>
			<div class="mr-20">
				<p>Generated past 30 days</p>
				<p class="text-lg font-bold">{{ totalAdditions.toLocaleString('en-US') }}</p>
			</div>
			<div>
				<p>Spent past 30 days</p>
				<p class="text-lg font-bold">{{ totalDeductions.toLocaleString('en-US') }}</p>
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
							<nuxt-icon class="mr-1 mt-0.5" name="coin"/>+{{ slotProps.data.amount || 0 }}
						</Tag>
						<Tag v-else class="flex items-center !text-sm" severity="danger">
							<nuxt-icon class="mr-1 mt-0.5" name="coin"/>-{{ slotProps.data.amount || 0 }}
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
				@page="onPage($event)"
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
	import type { DataTablePageEvent } from 'primevue/datatable';
	import type { PageState } from 'primevue/paginator';
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

	const itemsPerPage = config.public.itemsPerTablePage;
	const loading = ref(false);
	const creditsChangesCount = ref(0);
	const creditsChanges = ref<CreditsChange[]>([]);
	const first = ref(0);
	const lazyParams = ref<Partial<DataTablePageEvent>>({});

	const { data: credits } = await useLazyAsyncData('credits-stats', async () => {
		try {
			const [ total, additions, deductions ] = await Promise.all([
				$directus.request<{amount: number}[]>(readItems('gp_credits', {
					filter: { user_id: { _eq: user.id } },
				})),
				$directus.request<CreditsAddition[]>(readItems('gp_credits_additions', {
					filter: {
						github_id: { _eq: user.external_identifier || 'admin' },
						// @ts-ignore
						date_created: { _gte: '$NOW(-30 day)' },
					},
				})),
				$directus.request<CreditsDeduction[]>(readItems('gp_credits_deductions', {
					filter: {
						user_id: { _eq: user.id },
						// @ts-ignore
						date: { _gte: '$NOW(-30 day)' },
					},
				})),
			]);

			return { total: total[0]?.amount || 0, additions, deductions };
		} catch (e) {
			sendErrorToast(e);
			throw e;
		}
	}, { default: () => ({ total: 0, additions: [], deductions: [] }) });

	const totalAdditions = computed(() => credits.value.additions.reduce((sum, addition) => sum + addition.amount, 0));
	const totalDeductions = computed(() => credits.value.deductions.reduce((sum, deduction) => sum + deduction.amount, 0));

	const loadLazyData = async (event?: PageState) => {
		loading.value = true;
		lazyParams.value = { ...lazyParams.value, first: event?.first || first.value };

		try {
			const [
				{ changes },
				[{ count: additionsCount }],
				[{ count: deductionsCount }],
			] = await Promise.all([
				$directus.request<{changes: CreditsChange[]}>(customEndpoint({ method: 'GET', path: '/credits-timeline', params: {
					offset: lazyParams.value.first,
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
					comment: !change.comment && change.type === 'deduction' ? 'Measurements run on this day.' : change.comment,
					date_created: formatDateForTable(change.date_created),
				})),
			];

			creditsChangesCount.value = additionsCount + deductionsCount;
		} catch (e) {
			sendErrorToast(e);
		}

		loading.value = false;
	};

	onMounted(() => {
		loading.value = true;

		lazyParams.value = {
			first: 0,
			rows: itemsPerPage,
		};

		loadLazyData();
	});

	const onPage = (event: PageState) => {
		lazyParams.value = event;
		loadLazyData(event);
	};
</script>
