<template>
	<div class="min-h-52 rounded-xl border bg-white dark:bg-dark-800 dark:text-white">
		<h4 class="border-b px-4 py-2 font-bold md:hidden">Overview</h4>
		<AsyncBlock class="flex min-h-60 items-stretch gap-4 rounded-xl p-3 max-md:min-h-[32.5rem] max-md:flex-col" :status="loading ? 'pending' : ''">
			<div class="flex flex-col gap-2 md:min-w-44">
				<div class="flex max-w-full flex-col max-md:min-h-24 md:flex-1">
					<div class="bg-gradient-highlight flex flex-1 flex-col justify-between gap-2 rounded-lg p-4">
						<div class="flex items-center gap-2">
							<i class="pi-arrow-up pi text-primary-400"/> <span class="text-sm">Gained</span>
						</div>
						<div class="flex items-center gap-2 text-2xl font-bold">
							<NuxtIcon class="text-xl" name="coin" aria-hidden="true"/>
							<span data-testid="gained-credits">{{ totalAdditions.toLocaleString('en-US') }}</span>
						</div>
					</div>
				</div>
				<div class="flex max-w-full flex-col max-md:min-h-24 md:flex-1">
					<div class="bg-gradient-red flex flex-1 flex-col justify-between gap-2 rounded-lg p-4">
						<div class="flex items-center gap-2">
							<i class="pi-arrow-down pi text-red-400"/> <span class="text-sm">Spent</span>
						</div>
						<div class="flex items-center gap-2 text-2xl font-bold">
							<NuxtIcon class="text-xl" name="coin" aria-hidden="true"/>
							<span data-testid="spent-credits">{{ totalDeductions.toLocaleString('en-US') }}</span>
						</div>
					</div>
				</div>
			</div>
			<div class="credits-chart relative h-52 md:flex-1">
				<Chart type="line" :data="chartData" :options="chartOptions" class="size-full" :plugins="[hoverLinePlugin]"/>
			</div>
		</AsyncBlock>
	</div>
</template>

<script setup lang="ts">
	import Chart from 'primevue/chart';
	import { useCreditsFilters } from '~/composables/useCreditsFilters';
	import { formatUtcDate } from '~/utils/date-formatters';

	const props = defineProps({
		additions: {
			type: Array as PropType<Pick<CreditsAddition, 'amount' | 'date_created'>[]>,
			default: () => [],
		},
		deductions: {
			type: Array as PropType<Pick<CreditsDeduction, 'amount' | 'date'>[]>,
			default: () => [],
		},
		loading: {
			type: Boolean,
			default: false,
		},
	});

	const documentStyle = getComputedStyle(document.documentElement);
	const bluegray400 = documentStyle.getPropertyValue('--bluegray-400');
	const bluegray700 = documentStyle.getPropertyValue('--bluegray-700');
	const surface300 = documentStyle.getPropertyValue('--p-surface-300');
	const primary = documentStyle.getPropertyValue('--p-primary-color');
	const red400 = documentStyle.getPropertyValue('--red-400');
	const dark = document.documentElement.classList.contains('dark');

	const totalAdditions = computed(() => props.additions.reduce((acc, { amount }) => acc + amount, 0));
	const totalDeductions = computed(() => props.deductions.reduce((acc, { amount }) => acc + amount, 0));

	const { filter } = useCreditsFilters();

	type ChangeData = {
		label: string;
		gained: number;
		spent: number;
	};

	const changes = computed<ChangeData[]>(() => {
		const dateToAddition = new Map<string, number>();
		const dateToDeduction = new Map<string, number>();

		const periodKeys: string[] = [];
		const now = new Date();

		// create x axis keys based on the applied filter
		if (filter.value.period.year === 'past') {
			for (let i = 12; i >= 0; i--) {
				const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
				periodKeys.push(formatUtcDate(d.toISOString(), 'year-month'));
			}
		} else if (filter.value.period.month === 'past') {
			for (let i = 29; i >= 0; i--) {
				const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
				periodKeys.push(formatUtcDate(d.toISOString(), 'short'));
			}
		} else if (typeof filter.value.period.month === 'undefined') {
			const year = filter.value.period.year;

			for (let i = 0; i < 12; i++) {
				const d = new Date(Date.UTC(year, i, 1));
				periodKeys.push(formatUtcDate(d.toISOString(), 'year-month'));
			}
		} else {
			const { year, month } = filter.value.period;
			const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

			for (let i = 1; i <= daysInMonth; i++) {
				const d = new Date(Date.UTC(year, month, i));
				periodKeys.push(formatUtcDate(d.toISOString(), 'short'));
			}
		}

		// prefill with zeros
		periodKeys.forEach((key) => {
			dateToAddition.set(key, 0);
			dateToDeduction.set(key, 0);
		});

		// fill with actual values
		const groupBy = typeof filter.value.period.month === 'undefined' ? 'year' : 'day';

		for (const addition of props.additions) {
			const day = formatUtcDate(addition.date_created, groupBy === 'day' ? 'short' : 'year-month');
			const current = dateToAddition.get(day) ?? 0;
			dateToAddition.set(day, current + addition.amount);
		}

		for (const deduction of props.deductions) {
			const day = formatUtcDate(deduction.date, groupBy === 'day' ? 'short' : 'year-month');
			const current = dateToDeduction.get(day) ?? 0;
			dateToDeduction.set(day, current + deduction.amount);
		}

		const data: ChangeData[] = [];

		for (const date of periodKeys) {
			const gained = dateToAddition.get(date) ?? 0;
			const spent = dateToDeduction.get(date) ?? 0;

			data.push({
				label: date,
				gained,
				spent,
			});
		}

		return data;
	});

	const hoverLinePlugin = {
		afterDatasetsDraw (chart: any) {
			const { ctx, tooltip, chartArea: { top, bottom } } = chart;

			// find the hovered x position
			let targetX = null;

			if (tooltip && tooltip._active && tooltip._active.length) {
				targetX = tooltip._active[0].element.x;
			}

			// persist hover line state
			if (typeof chart._hoverLineX === 'undefined') {
				chart._hoverLineX = null;
			}

			if (targetX === null) {
				// nothing to draw
				chart._hoverLineX = null;
				return;
			}

			if (chart._hoverLineX === null) {
				chart._hoverLineX = targetX;
			}

			// move hover line towards the hovered x position (animated)
			const diff = targetX - chart._hoverLineX;

			if (Math.abs(diff) > 0.5) {
				chart._hoverLineX += diff * 0.02;
				requestAnimationFrame(() => chart.draw());
			} else {
				chart._hoverLineX = targetX;
			}

			// draw the line
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(chart._hoverLineX, top);
			ctx.lineTo(chart._hoverLineX, bottom);

			ctx.lineWidth = 1;
			ctx.strokeStyle = bluegray400;

			ctx.stroke();
			ctx.restore();
		},
	};

	const chartData = computed(() => {
		return {
			labels: changes.value.map(({ label }) => label),
			datasets: [
				{
					data: changes.value.map(({ gained }) => gained),
					borderColor: primary,
					backgroundColor: primary,
				},
				{
					data: changes.value.map(({ spent }) => spent),
					borderColor: red400,
					backgroundColor: red400,
				},
			],
		};
	});

	const chartOptions = computed(() => ({
		animation: {
			duration: 0,
		},
		maintainAspectRatio: false,
		aspectRatio: 0.6,
		interaction: {
			mode: 'index',
			intersect: false,
		},
		plugins: {
			legend: {
				display: false,
			},
			tooltip: {
				callbacks: {
					title: () => null,
					label: () => null,
					afterBody: (ctx: any) => {
						const dataIndex = ctx[0]?.dataIndex;
						const change = changes.value[dataIndex];

						if (change) {
							return `Gained: ${change.gained.toLocaleString('en-US')}
Spent: ${change.spent.toLocaleString('en-US')}`;
						}

						return '';
					},
				},
				bodyFont: {
					weight: 400,
					size: 13,
				},
				padding: 10,
				backgroundColor: bluegray700,
			},
		},
		scales: {
			x: {
				ticks: {
					color: bluegray400,
					font: {
						size: 10,
						weight: 400,
					},
				},
				grid: {
					color: dark ? bluegray700 : surface300,
				},
				border: {
					display: false,
				},
			},
			y: {
				max: totalAdditions.value + totalDeductions.value ? undefined : 1000,
				beginAtZero: true,
				ticks: {
					color: bluegray400,
					font: {
						size: 10,
						weight: 400,
					},
				},
				grid: {
					color: dark ? bluegray700 : surface300,
				},
				border: {
					display: false,
				},
			},
		},
		elements: {
			line: {
				borderColor: primary,
				borderWidth: 2,
				tension: 0.25,
				cubicInterpolationMode: 'monotone',
			},
			point: {
				radius: 0,
			},
		},
	}));
</script>

<style>
	/* https://github.com/chartjs/Chart.js/issues/11005 */
	.credits-chart canvas {
		width: 100% !important;
		height: 100% !important;
	}
</style>
