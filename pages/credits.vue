<template>
	<div class="bg-surface-50 flex h-full flex-col p-6">
		<div class="mb-6 flex">
			<h1 class="col-span-2 text-2xl font-bold">Credits</h1>
			<NuxtLink to="https://github.com/sponsors/jsdelivr" tabindex="-1" class="ml-auto" target="_blank" rel="noopener">
				<Button label="Become a sponsor" icon="pi pi-github"/>
			</NuxtLink>
		</div>
		<div class="mt-2 flex">
			<div class="mr-20">
				<p>Total credits</p>
				<p class="text-lg font-bold">124,567,010</p>
			</div>
			<div class="mr-20">
				<p>Generated last 30 days</p>
				<p class="text-lg font-bold">180,000</p>
			</div>
			<div>
				<p>Spent last 30 days</p>
				<p class="text-lg font-bold">35,000</p>
			</div>
		</div>
		<DataTable
			class="mt-6"
			:value="creditsChanges"
			lazy
			:first="first"
			:rows="5"
			data-key="id"
			:total-records="creditsChangesCount"
			:loading="loading"
			:row-class="() => 'border-none'"
		>
			<Column header="Time" field="date_created" header-class="pl-1 pt-3 border-none" body-class="border-b-0 border-t">
				<template #body="slotProps">
					{{ new Date(slotProps.data.date_created).toISOString().split('T')[0] }}
				</template>
			</Column>
			<Column header="Comment" field="comment" header-class="pl-1 pt-3 border-none" body-class="border-b-0 border-t"/>
			<Column header="Amount" field="amount" header-class="pl-1 pt-3 border-none" body-class="border-b-0 border-t">
				<template #body="slotProps">
					<Tag class="flex items-center !text-sm" severity="success" value="Success">
						<nuxt-icon class="mr-1 mt-0.5" name="coin"/>+{{ slotProps.data.amount || 0 }}
					</Tag>
				</template>
			</Column>
		</DataTable>
		<Paginator
			class="mt-9"
			:first="first"
			:rows="5"
			:total-records="creditsChangesCount"
			template="PrevPageLink PageLinks NextPageLink"
			@page="onPage($event)"
		/>
	</div>
</template>

<script setup lang="ts">
	import { aggregate, readItems } from '@directus/sdk';
	import type { DataTablePageEvent } from 'primevue/datatable';
	import type { PageState } from 'primevue/paginator';

	const { $directus } = useNuxtApp();

	const loading = ref(false);
	const creditsChangesCount = ref(0);
	const creditsChanges = ref<CreditsAddition[]>([]);
	const first = ref(0);
	const lazyParams = ref<Partial<DataTablePageEvent>>({});

	const loadLazyData = async (event?: PageState) => {
		loading.value = true;
		lazyParams.value = { ...lazyParams.value, first: event?.first || first.value };

		const [ creditsAdditions, { count }] = await Promise.all([
			$directus.request(readItems('gp_credits_additions', {
				offset: lazyParams.value.first,
				limit: 5,
			})),
			$directus.request<{count: number}>(aggregate('gp_credits_additions', { aggregate: { count: '*' } })),
			// $directus.request(readItems('gp_credits_deductions', {
			// 	offset: lazyParams.value.first,
			// 	limit: 5,
			// })),
			// $directus.request<{count: number}>(aggregate('gp_credits_deductions', { aggregate: { count: '*' } })),
		]);

		console.log('creditsAdditions', creditsAdditions);
		creditsChanges.value = creditsAdditions;
		creditsChangesCount.value = count;
		loading.value = false;
	};

	onMounted(() => {
		loading.value = true;

		lazyParams.value = {
			first: 0,
			rows: 5,
		};

		loadLazyData();
	});

	const onPage = (event: PageState) => {
		lazyParams.value = event;
		loadLazyData(event);
	};

	// const { data: creditsData } = await useAsyncData('gp_credits&gp_credits_additions&gp_credits_deductions', async () => {
	// 	const [ credits, creditsAdditions, creditsDeductions ] = await Promise.all([
	// 		$directus.request(readItems('gp_credits')),
	// 		$directus.request(readItems('gp_credits_additions')),
	// 		$directus.request(readItems('gp_credits_deductions')),
	// 	]);

	// 	return { credits, creditsAdditions, creditsDeductions };
	// });

	// console.log(creditsData.value?.creditsDeductions);


</script>
