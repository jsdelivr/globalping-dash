<template>
	<section class="flex flex-col gap-4">
		<div class="flex items-center justify-between">
			<h3 class="text-lg font-bold">
				Full history
			</h3>
			<CreditsFilters/>
		</div>
		<div v-if="creditsChanges.length || loading || anyFilterApplied">
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
				<Column header="Date" field="date_created" class="md:w-44 2xl:w-64">
					<template #body="slotProps">
						<AsyncCell :loading="loading" size="small">
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
							<AsyncCell :loading="loading" size="small">
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
				<div v-if="loading && !creditsChanges.length" class="flex h-32 w-full items-center justify-center">
					<i class="pi pi-spin pi-spinner text-xl"/>
				</div>
				<p v-else-if="!creditsChanges.length && anyFilterApplied" class="rounded-lg bg-surface-0 p-6 py-12 text-center dark:bg-dark-700">
					No entries match the filter.
				</p>
				<AsyncRow v-for="(creditChange, index) in creditsChanges" v-else :key="index" :loading="loading">
					<ListItemCredits :credit-change="creditChange"/>
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
				<Button label="Add credits" class="mt-4" icon="pi pi-plus" @click="emit('addCredits')"/>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
	import { customEndpoint } from '@directus/sdk';
	import { computedDebounced } from '~/composables/computedDebounced';
	import { usePagination } from '~/composables/pagination';
	import { useCreditsFilters } from '~/composables/useCreditsFilters';
	import { useErrorToast } from '~/composables/useErrorToast';
	import { useUserFilter } from '~/composables/useUserFilter';
	import { formatUtcDateForTable } from '~/utils/date-formatters';
	import { formatCreditComment } from '~/utils/format-credit-comment';
	import { minDelay } from '~/utils/min-delay';

	const emit = defineEmits([ 'addCredits' ]);

	const config = useRuntimeConfig();
	const itemsPerPage = ref(config.public.itemsPerTablePage);
	const initialLoading = ref(true);

	const { page, first, pageLinkSize, template } = usePagination({ itemsPerPage });
	const { creditsTableFilterKey, getTableFilter, anyFilterApplied } = useCreditsFilters();

	const filterDeps = computedDebounced(() => [ creditsTableFilterKey.value, first.value, itemsPerPage.value ]);

	const { $directus } = useNuxtApp();
	const { getUserFilter } = useUserFilter();

	const { data: creditsData, pending: loading, error: creditsDataError } = await useLazyAsyncData(
		() => minDelay($directus.request<{ changes: CreditsChange[]; count: number }>(customEndpoint({
			method: 'GET',
			path: '/credits-timeline',
			params: {
				userId: getUserFilter('user_id').user_id?._eq || 'all',
				...getTableFilter(),
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
				date_created: formatUtcDateForTable(change.date_created),
			})),
		];
	});

	useErrorToast(creditsDataError);
</script>
