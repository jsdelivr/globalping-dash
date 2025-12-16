<template>
	<div class="flex min-h-full flex-col gap-6 p-4 sm:p-6">
		<div class="mb-4 flex justify-between">
			<div class="flex flex-col gap-6">
				<h1 class="page-title">Credits</h1>
				<h2 class="flex flex-col gap-2">
					<b class="text-lg">Total credits</b>
					<span class="inline-flex items-center gap-3 text-4xl font-bold">
						<NuxtIcon class="text-3xl" name="coin" aria-hidden="true"/>
						<span data-testid="total-credits">{{ credits.toLocaleString('en-US') }}</span>
					</span>
				</h2>
			</div>
			<Button label="Add credits" class="h-fit" icon="pi pi-plus text-xs" @click="creditsDialog = true"/>
		</div>
		<CreditsStatistics/>
		<CreditsFullHistory @add-credits="creditsDialog = true"/>
		<GPDialog
			v-model:visible="creditsDialog"
			header="Add credits"
			content-class="!p-0"
			size="w-[700px]"
		>
			<GpDialogContentAddCredits
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
			<GpDialogContentAdoptProbe @cancel="adoptProbeDialog = false" @adopted="refreshNuxtData"/>
		</GPDialog>
	</div>
</template>

<script setup lang="ts">
	import { readItems } from '@directus/sdk';
	import { useErrorToast } from '~/composables/useErrorToast';
	import { useUserFilter } from '~/composables/useUserFilter';

	useHead({
		title: 'Credits -',
	});

	const { $directus } = useNuxtApp();
	const { getUserFilter } = useUserFilter();

	const { data: credits, error: creditsError } = await useLazyAsyncData(
		'total-credits',
		() => $directus.request<{ amount: number }[]>(readItems('gp_credits', { filter: getUserFilter('user_id') })),
		{
			transform: data => data.reduce((sum, { amount }) => sum + amount, 0) || 0,
			default: () => 0,
		},
	);

	useErrorToast(creditsError);

	// CREDITS DIALOG
	const creditsDialog = ref(false);
	const adoptProbeDialog = ref(false);
</script>
