<template>
	<section class="min-h-72 rounded-xl border bg-white dark:bg-dark-800 dark:text-white">
		<h3 class="border-b px-4 py-2 font-bold">Sponsorship amounts over time</h3>
		<AsyncBlock class="relative min-h-72 p-3" :status="status">
			<div v-if="!hasEvents" class="absolute inset-x-0 top-16 z-10 text-center text-sm text-bluegray-500">
				No sponsorship events in this period
			</div>
			<Chart
				type="bar"
				:data="chartData"
				:options="chartOptions"
				class="h-64"
				aria-label="Monthly recurring and one-time sponsorship amounts"
			/>
		</AsyncBlock>
	</section>
</template>

<script setup lang="ts">
	import Chart from 'primevue/chart';
	import { formatNumber } from '~/utils/format-number';
	import { SPONSOR_COLORS } from '~/utils/sponsor-colors';

	const props = defineProps<{
		points: SponsorsChartPoint[];
		status: '' | 'pending' | 'error';
	}>();

	const documentStyle = getComputedStyle(document.documentElement);
	const bluegray400 = documentStyle.getPropertyValue('--bluegray-400');
	const bluegray700 = documentStyle.getPropertyValue('--bluegray-700');
	const surface300 = documentStyle.getPropertyValue('--p-surface-300');
	const dark = document.documentElement.classList.contains('dark');

	const hasEvents = computed(() => props.points.some(point => point.events > 0));
	const formatMoney = (value: number) => `$${formatNumber(value)}`;

	const chartData = computed(() => ({
		labels: props.points.map(point => point.month),
		datasets: [
			{
				label: 'Recurring',
				data: props.points.map(point => point.recurringValue),
				backgroundColor: SPONSOR_COLORS.recurring,
				borderColor: SPONSOR_COLORS.recurring,
				stack: 'value',
				borderSkipped: false,
				borderRadius: (context: { dataIndex: number }) => props.points[context.dataIndex]?.oneTimeValue
					? 0
					: { topLeft: 7, topRight: 7 },
				barPercentage: 0.72,
				categoryPercentage: 0.8,
				maxBarThickness: 40,
			},
			{
				label: 'One-time',
				data: props.points.map(point => point.oneTimeValue),
				backgroundColor: SPONSOR_COLORS.oneTime,
				borderColor: SPONSOR_COLORS.oneTime,
				stack: 'value',
				borderSkipped: false,
				borderRadius: { topLeft: 7, topRight: 7 },
				barPercentage: 0.72,
				categoryPercentage: 0.8,
				maxBarThickness: 40,
			},
		],
	}));

	const chartOptions = computed(() => ({
		animation: { duration: 0 },
		maintainAspectRatio: false,
		interaction: { mode: 'index' as const, intersect: false },
		plugins: {
			legend: {
				position: 'bottom' as const,
				align: 'center' as const,
				labels: {
					color: dark ? bluegray400 : bluegray700,
					font: { size: 12, weight: 500 },
					padding: 20,
					useBorderRadius: true,
					borderRadius: 4,
					boxWidth: 24,
					boxHeight: 8,
				},
			},
			tooltip: {
				callbacks: {
					title: () => null,
					label: () => null,
					afterBody: (contexts: Array<{ dataIndex: number }>) => {
						const point = props.points[contexts[0]?.dataIndex ?? 0];

						if (!point) { return []; }

						return [
							`Total amount: ${formatMoney(point.recurringValue + point.oneTimeValue)}`,
							`Recurring: ${formatMoney(point.recurringValue)}`,
							`One-time: ${formatMoney(point.oneTimeValue)}`,
							`Events: ${formatNumber(point.events)}`,
						];
					},
				},
				bodyFont: { weight: 400, size: 13 },
				padding: 10,
				backgroundColor: bluegray700,
			},
		},
		scales: {
			x: {
				stacked: true,
				grid: { display: false },
				border: { display: false },
				ticks: { color: bluegray400, font: { size: 10, weight: 400 } },
			},
			y: {
				stacked: true,
				beginAtZero: true,
				grid: { color: dark ? bluegray700 : surface300 },
				border: { color: dark ? bluegray700 : surface300 },
				ticks: {
					color: bluegray400,
					font: { size: 10, weight: 400 },
					callback: (value: number | string) => `$${formatNumber(Number(value))}`,
				},
			},
		},
	}));
</script>
