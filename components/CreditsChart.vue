<template>
	<div class="credits-chart">
		<Chart type="line" :data="chartData" :options="chartOptions" class="h-40"/>
	</div>
</template>

<script setup lang="ts">
	import Chart from 'primevue/chart';
	import { formatDate } from '~/utils/date-formatters';

	const props = defineProps({
		start: {
			type: Number,
			default: 0,
		},
		additions: {
			type: Array as PropType<CreditsAddition[]>,
			default: () => [],
		},
		deductions: {
			type: Array as PropType<CreditsDeduction[]>,
			default: () => [],
		},
	});

	const documentStyle = getComputedStyle(document.documentElement);
	const bluegray400 = documentStyle.getPropertyValue('--bluegray-400');
	const surface300 = documentStyle.getPropertyValue('--p-surface-300');
	const primary = documentStyle.getPropertyValue('--p-primary-color');

	const changes = computed(() => {
		const dayToAddition = new Map(props.additions.map((addition) => {
			return [ formatDate(addition.date_created, 'short'), addition ];
		}));
		const dayToDeduction = new Map(props.deductions.map((deduction) => {
			return [ formatDate(deduction.date, 'short'), deduction ];
		}));
		const last30Days = getLast30Days();

		const data: {
			label: string;
			total: number;
			generated: number;
			spent: number;
		}[] = [{
			label: last30Days[0],
			total: props.start,
			generated: dayToAddition.get(last30Days[0])?.amount ?? 0,
			spent: dayToDeduction.get(last30Days[0])?.amount ?? 0,
		}];

		for (let i = 1; i < last30Days.length; i++) {
			const day = last30Days[i];
			const addition = dayToAddition.get(day)?.amount ?? 0;
			const deduction = dayToDeduction.get(day)?.amount ?? 0;

			data.push({
				label: day,
				total: data[i - 1].total + addition - deduction,
				generated: addition,
				spent: deduction,
			});
		}

		return data;
	});

	const getLast30Days = () => {
		const days = [];
		const currentDay = new Date();
		currentDay.setDate(currentDay.getDate() + 1);

		for (let i = 0; i < 30; i++) {
			currentDay.setDate(currentDay.getDate() - 1);
			days.push(formatDate(currentDay, 'short'));
		}

		return days.reverse();
	};

	const chartData = computed(() => {
		return {
			labels: changes.value.map(({ label }) => label),
			datasets: [
				{
					data: changes.value.map(({ total }) => total),
				},
			],
		};
	});

	let width: number, height: number, gradient: any;

	const getGradient = (ctx: any, chartArea: any) => {
		const chartWidth = chartArea.right - chartArea.left;
		const chartHeight = chartArea.bottom - chartArea.top;

		if (!gradient || width !== chartWidth || height !== chartHeight) {
			// Create the gradient because this is either the first render
			// or the size of the chart has changed
			width = chartWidth;
			height = chartHeight;
			gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
			gradient.addColorStop(1, 'rgba(23,212,167,0.6)');
			gradient.addColorStop(0, 'rgba(23,212,167,0)');
		}

		return gradient;
	};

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
					afterBody: (ctx: any) => `Total credits: ${changes.value[ctx[0].dataIndex].total.toLocaleString('en-US')}
Generated: ${changes.value[ctx[0].dataIndex].generated.toLocaleString('en-US')}
Spent: ${changes.value[ctx[0].dataIndex].spent.toLocaleString('en-US')}`,
				},
				bodyFont: {
					weight: 400,
					size: 12,
				},
				padding: 10,
				backgroundColor: '#4b5563',
			},
		},
		scales: {
			x: {
				ticks: {
					color: bluegray400,
				},
				grid: {
					color: surface300,
				},
				border: {
					display: false,
				},
			},
			y: {
				max: changes.value.length ? undefined : 1000,
				beginAtZero: true,
				ticks: {
					color: bluegray400,
				},
				grid: {
					color: surface300,
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
				fill: 'origin',
				backgroundColor (context: any) {
					const chart = context.chart;
					const { ctx, chartArea } = chart;

					if (!chartArea) {
						// This case happens on initial chart load
						return;
					}

					return getGradient(ctx, chartArea);
				},
			},
			point: {
				borderColor: primary,
				backgroundColor: primary,
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
