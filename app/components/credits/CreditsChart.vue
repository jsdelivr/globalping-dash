<template>
	<div class="min-h-52 rounded-xl border bg-white text-black dark:bg-dark-800 dark:text-white">
		<h4 class="border-b px-4 py-2 font-bold md:hidden">Overview</h4>
		<AsyncBlock class="flex min-h-64 items-stretch gap-4 rounded-xl p-4 max-md:min-h-[32.5rem] max-md:flex-col" :status="loading ? 'pending' : ''">
			<div class="flex flex-col gap-2 md:min-w-44">
				<AsyncCell class="flex max-w-full flex-col max-md:min-h-24 md:flex-1" :loading="loading">
					<div class="bg-gradient-highlight flex flex-1 flex-col justify-between gap-2 rounded-lg p-4">
						<div class="flex items-center gap-2">
							<i class="pi-arrow-up pi text-primary-400"/> <span class="text-sm">Gained</span>
						</div>
						<div class="flex items-center gap-2 text-2xl font-bold">
							<NuxtIcon class="text-xl" name="coin" aria-hidden="true"/>
							<span data-testid="generated-credits">{{ totalAdditions.toLocaleString('en-US') }}</span>
						</div>
					</div>
				</AsyncCell>
				<AsyncCell class="flex max-w-full flex-col max-md:min-h-24 md:flex-1" :loading="loading">
					<div class="bg-gradient-orange flex flex-1 flex-col justify-between gap-2 rounded-lg p-4">
						<div class="flex items-center gap-2">
							<i class="pi-arrow-down pi text-jsd-orange"/> <span class="text-sm">Spent</span>
						</div>
						<div class="flex items-center gap-2 text-2xl font-bold">
							<NuxtIcon class="text-xl" name="coin" aria-hidden="true"/>
							<span data-testid="spent-credits">{{ totalDeductions.toLocaleString('en-US') }}</span>
						</div>
					</div>
				</AsyncCell>
			</div>
			<div class="credits-chart relative h-52 md:flex-1">
				<AsyncCell class="h-full min-h-full max-w-full" :loading="loading">
					<Chart type="line" :data="chartData" :options="chartOptions" class="size-full"/>
				</AsyncCell>
			</div>
		</AsyncBlock>
	</div>
</template>

<script setup lang="ts">
	import Chart from 'primevue/chart';
	import { useCreditsFilters } from '~/composables/useCreditsFilters';
	import { formatDate } from '~/utils/date-formatters';

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
	const jsdOrange = documentStyle.getPropertyValue('--jsd-orange');
	const dark = document.documentElement.classList.contains('dark');

	const totalAdditions = computed(() => props.additions.reduce((acc, { amount }) => acc + amount, 0));
	const totalDeductions = computed(() => props.deductions.reduce((acc, { amount }) => acc + amount, 0));

	const { filter } = useCreditsFilters();

	type ChangeData = {
		label: string;
		gained: number;
		spent: number;
	};

	let lastComputedChanges: ChangeData[] = [];

	const changes = computed<ChangeData[]>(() => {
		// avoid updating chart data if the data is still loading
		if (props.loading && lastComputedChanges.length > 0) {
			return lastComputedChanges;
		}

		const dateToAddition = new Map<string, number>();
		const dateToDeduction = new Map<string, number>();

		const periodKeys: string[] = [];
		const now = new Date();

		// create x axis keys based on the applied filter
		if (filter.value.year === 'past') {
			for (let i = 11; i >= 0; i--) {
				const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
				periodKeys.push(formatDate(d.toISOString(), 'year-month'));
			}
		} else if (filter.value.month === 'past') {
			for (let i = 29; i >= 0; i--) {
				const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
				periodKeys.push(formatDate(d.toISOString(), 'short'));
			}
		} else if (typeof filter.value.month === 'undefined') {
			const year = filter.value.year as number;

			for (let i = 0; i < 12; i++) {
				const d = new Date(Date.UTC(year, i, 1));
				periodKeys.push(formatDate(d.toISOString(), 'year-month'));
			}
		} else {
			const year = filter.value.year as number;
			const month = filter.value.month as number;
			const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

			for (let i = 1; i <= daysInMonth; i++) {
				const d = new Date(Date.UTC(year, month, i));
				periodKeys.push(formatDate(d.toISOString(), 'short'));
			}
		}

		// prefill with zeros
		periodKeys.forEach((key) => {
			dateToAddition.set(key, 0);
			dateToDeduction.set(key, 0);
		});

		// fill with actual values
		const groupBy = typeof filter.value.month === 'undefined' ? 'year' : 'day';

		for (const addition of props.additions) {
			const day = formatDate(addition.date_created, groupBy === 'day' ? 'short' : 'year-month');
			const current = dateToAddition.get(day) ?? 0;
			dateToAddition.set(day, current + addition.amount);
		}

		for (const deduction of props.deductions) {
			const day = formatDate(deduction.date, groupBy === 'day' ? 'short' : 'year-month');
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

		lastComputedChanges = data;
		return data;
	});

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
					borderColor: jsdOrange,
					backgroundColor: jsdOrange,
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
			},
			point: {
				radius: 0,
				hitRadius: 100,
				hoverRadius: 5,
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
