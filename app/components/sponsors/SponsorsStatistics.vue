<template>
	<div class="grid gap-4 xl:grid-cols-2">
		<section class="flex flex-col rounded-xl border bg-white dark:bg-dark-800 dark:text-white">
			<h3 class="border-b px-4 py-2 font-bold">Current overview</h3>
			<AsyncBlock class="min-h-32 p-3" :status="status">
				<div class="grid h-full gap-2 sm:grid-cols-3">
					<div class="flex flex-col justify-between gap-3 rounded-lg bg-surface-50 p-3 dark:bg-dark-700">
						<span>Active sponsors</span>
						<b class="text-2xl" data-testid="active-sponsors">{{ formatNumber(summary?.overview.activeSponsors ?? 0) }}</b>
					</div>
					<div class="flex flex-col justify-between gap-3 rounded-lg bg-surface-50 p-3 dark:bg-dark-700">
						<span>Sponsorship amount last month</span>
						<small class="text-bluegray-500">
							{{ formatMoney(summary?.overview.previousMonth.recurringValue || 0) }} recurring ·
							{{ formatMoney(summary?.overview.previousMonth.oneTimeValue || 0) }} one-time
						</small>
						<b class="text-2xl" data-testid="previous-month-value">{{ formatMoney(summary?.overview.previousMonth.totalValue || 0) }}</b>
					</div>
					<div class="bg-gradient-highlight flex flex-col justify-between gap-3 rounded-lg p-3">
						<span>Monthly recurring amount</span>
						<b class="text-2xl" data-testid="next-month-value">{{ formatMoney(summary?.overview.estimatedNextMonthValue || 0) }}</b>
					</div>
				</div>
			</AsyncBlock>
		</section>

		<section class="flex flex-col rounded-xl border bg-white dark:bg-dark-800 dark:text-white">
			<h3 class="border-b px-4 py-2 font-bold">Selected period</h3>
			<AsyncBlock class="min-h-32 p-3" :status="status">
				<div class="grid h-full gap-2 sm:grid-cols-2">
					<div class="flex flex-col justify-between gap-3 rounded-lg bg-surface-50 p-3 dark:bg-dark-700">
						<span>Sponsors</span>
						<small class="text-bluegray-500">{{ formatNumber(summary?.allTime.sponsors ?? 0) }} all time</small>
						<b class="text-2xl" data-testid="period-sponsors">{{ formatNumber(summary?.period.sponsors ?? 0) }}</b>
					</div>
					<div class="flex flex-col justify-between gap-3 rounded-lg bg-surface-50 p-3 dark:bg-dark-700">
						<div class="flex flex-col gap-1">
							<span>Sponsorship amount</span>
							<small class="text-bluegray-500">
								{{ formatMoney(summary?.period.recurringValue || 0) }} recurring ·
								{{ formatMoney(summary?.period.oneTimeValue || 0) }} one-time
							</small>
						</div>
						<b class="text-2xl" data-testid="period-value">{{ formatMoney(summary?.period.sponsorshipValue || 0) }}</b>
					</div>
				</div>
			</AsyncBlock>
		</section>
	</div>
</template>

<script setup lang="ts">
	import { formatNumber } from '~/utils/format-number';

	defineProps<{
		summary: SponsorsSummary | null;
		status: '' | 'pending' | 'error';
	}>();

	const formatMoney = (value: number) => `$${formatNumber(value)}`;
</script>
