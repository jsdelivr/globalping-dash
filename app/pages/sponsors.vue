<template>
	<div class="flex min-h-full flex-col gap-6 p-4 sm:p-6">
		<div class="flex items-center justify-between gap-4">
			<h1 class="page-title">Sponsors</h1>
			<div class="flex items-center gap-2">
				<Button label="Manual additions" icon="pi pi-history" severity="secondary" outlined @click="historyDialog = true"/>
				<Button label="Add credits" icon="pi pi-plus text-xs" @click="creditsDialog = true"/>
			</div>
		</div>

		<section class="flex flex-col gap-4">
			<div class="flex items-center justify-between gap-2">
				<h2 class="text-lg font-bold">Statistics</h2>
				<SponsorsPeriodPicker/>
			</div>
			<SponsorsStatistics :summary="summary || null" :status="summaryStatus"/>
			<SponsorsChart :points="summary?.chart || []" :status="summaryStatus"/>
		</section>

		<div class="flex flex-col gap-8 sm:gap-10">
			<SponsorAccountsTable :period="period"/>
			<SponsorsEventsTable :period="period"/>
		</div>

		<GPDialog v-model:visible="creditsDialog" header="Add credits" size="w-[700px]">
			<GpDialogContentAdminAddCredits
				v-if="creditsDialog"
				@cancel="creditsDialog = false"
				@success="onCreditsAdded"
			/>
		</GPDialog>
		<GPDialog v-model:visible="historyDialog" header="Manual additions" size="w-[min(1100px,95vw)]">
			<SponsorsManualAdditionsHistory v-if="historyDialog"/>
		</GPDialog>
	</div>
</template>

<script setup lang="ts">
	import { customEndpoint } from '@directus/sdk';
	// eslint-disable-next-line import/extensions
	import GpDialogContentAdminAddCredits from '~/components/gp-dialog/content/AdminAddCredits.vue';
	// eslint-disable-next-line import/extensions
	import SponsorAccountsTable from '~/components/sponsors/SponsorAccountsTable.vue';
	import { useErrorToast } from '~/composables/useErrorToast';
	import { useSponsorsPeriod } from '~/composables/useSponsorsPeriod';
	import adminModeMiddleware from '~/middleware/admin-mode';

	definePageMeta({ middleware: adminModeMiddleware });
	useHead({ title: 'Sponsors -' });

	const { $directus } = useNuxtApp();
	const { period } = useSponsorsPeriod();
	const creditsDialog = ref(false);
	const historyDialog = ref(false);
	const onCreditsAdded = async () => {
		creditsDialog.value = false;
		await refreshNuxtData();
	};
	const { data: summary, pending, error } = await useLazyAsyncData(
		() => $directus.request<SponsorsSummary>(customEndpoint({
			path: '/admin-sponsors/summary',
			params: { period: period.value },
		})),
		{ watch: [ period ] },
	);
	const summaryStatus = computed<'' | 'pending' | 'error'>(() => error.value ? 'error' : pending.value ? 'pending' : '');

	useErrorToast(error);
</script>
