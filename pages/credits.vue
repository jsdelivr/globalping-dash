<template>
	<div class="flex min-h-full flex-col p-6" :class="{'min-w-[640px]': creditsChanges.length}">
		<div class="mb-6 flex">
			<h1 class="col-span-2 text-2xl font-bold">Credits</h1>
			<NuxtLink to="https://github.com/sponsors/jsdelivr" tabindex="-1" class="ml-auto" target="_blank" rel="noopener">
				<Button label="Become a sponsor" icon="pi pi-github"/>
			</NuxtLink>
		</div>
		<div class="mt-2 flex">
			<div class="mr-20">
				<p>Total credits</p>
				<p class="text-lg font-bold">{{ creditsStats.credits.toLocaleString() }}</p>
			</div>
			<div class="mr-20">
				<p>Generated last 30 days</p>
				<p class="text-lg font-bold">{{ creditsStats.additions.toLocaleString() }}</p>
			</div>
			<div>
				<p>Spent last 30 days</p>
				<p class="text-lg font-bold">{{ creditsStats.deductions.toLocaleString() }}</p>
			</div>
		</div>
		<div class="mt-6">
			<CreditsChart :start-amount="startAmount" :credits-changes="creditsChanges"/>
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
				<Column header="Time" field="date_created" header-class="pl-1 pt-3"/>
				<Column header="Comment" field="comment" header-class="pl-1 pt-3"/>
				<Column header="Amount" field="amount" header-class="pl-1 pt-3">
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
		<div v-else class="bg-surface-0 dark:bg-dark-800 mt-6 rounded-xl border px-4 py-3">
			<div class="bg-surface-50 dark:bg-dark-600 rounded-xl p-6 text-center">
				<p class="font-semibold">No data to show</p>
				<p class="mt-4">Adopt a probe or become a sponsor to track your credit usage</p>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { useAuth } from '~/store/auth';
	import { aggregate, customEndpoint, readItems } from '@directus/sdk';
	import type { DataTablePageEvent } from 'primevue/datatable';
	import type { PageState } from 'primevue/paginator';

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
	const startAmount = ref(0);
	const lazyParams = ref<Partial<DataTablePageEvent>>({});

	const { data: creditsStats } = await useLazyAsyncData('credits-stats', async () => {
		try {
			const [ credits, additions, deductions ] = await Promise.all([
				$directus.request<[{amount: number}]>(readItems('gp_credits', {
					filter: { user_id: { _eq: user.id } },
				})),
				$directus.request<[{sum: {amount: number}}]>(aggregate('gp_credits_additions', {
					aggregate: { sum: 'amount' },
					query: { filter: {
						github_id: { _eq: user.external_identifier || 'admin' },
						// @ts-ignore
						date_created: { _gte: '$NOW(-30 day)' },
					} },
				})),
				$directus.request<[{sum: {amount: number}}]>(aggregate('gp_credits_deductions', {
					aggregate: { sum: 'amount' },
					query: { filter: {
						user_id: { _eq: user.id },
						// @ts-ignore
						date: { _gte: '$NOW(-30 day)' },
					} },
				})),
			]);

			return {
				credits: credits[0]?.amount || 0,
				additions: additions[0]?.sum.amount || 0,
				deductions: deductions[0]?.sum.amount || 0,
			};
		} catch (e) {
			sendToast(e);
			throw e;
		}
	}, { default: () => ({ credits: 0, additions: 0, deductions: 0 }) });

	const loadLazyData = async (event?: PageState) => {
		loading.value = true;
		lazyParams.value = { ...lazyParams.value, first: event?.first || first.value };

		try {
			const [
				{ amountBeforeChanges, changes },
				[{ count: additionsCount }],
				[{ count: deductionsCount }],
			] = await Promise.all([
				$directus.request<{amountBeforeChanges: number, changes: CreditsChange[]}>(customEndpoint({ method: 'GET', path: '/credits-timeline', params: {
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
				...changes.map(addition => ({
					...addition,
					date_created: addition.date_created.split('T')[0],
				})),
			];

			startAmount.value = amountBeforeChanges;
			creditsChangesCount.value = additionsCount + deductionsCount;
		} catch (e) {
			sendToast(e);
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
