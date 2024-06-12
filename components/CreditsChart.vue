
<template>
	<Chart type="line" :data="chartData" :options="chartOptions" class="h-30rem"/>
</template>

<script setup lang="ts">
	import Chart from 'primevue/chart';

	const props = defineProps({
		startAmount: {
			type: Number,
			default: 0,
		},
		creditsChanges: {
			type: Array as () => CreditsChange[],
			default: () => [],
		},
	});

	const documentStyle = getComputedStyle(document.documentElement);
	const bluegray400 = documentStyle.getPropertyValue('--bluegray-400');
	const surface50 = documentStyle.getPropertyValue('--surface-50');
	const surface300 = documentStyle.getPropertyValue('--surface-300');
	const primary = documentStyle.getPropertyValue('--primary');

	const chartData = computed(() => {
		const reverseChanges = [ ...props.creditsChanges ].reverse();

		const labels = reverseChanges.map(({ date_created }) => {
			const [ _year, month, day ] = date_created.split('-');
			return `${day}/${month}`;
		});

		const data: number[] = [];
		let currentAmount = props.startAmount;
		reverseChanges.forEach((change) => {
			if (change.type === 'addition') {
				data.push(currentAmount += change.amount);
			} else if (change.type === 'deduction') {
				data.push(currentAmount -= change.amount);
			} else {
				data.push(currentAmount);
			}
		});

		return {
			labels,
			datasets: [
				{
					data,
					fill: 'origin',

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

	const chartOptions = {
		maintainAspectRatio: false,
		aspectRatio: 0.6,
		plugins: {
			legend: {
				display: false,
			},
		},
		scales: {
			x: {
				ticks: {
					color: bluegray400,
					font: {
						weight: 'bold',
					},
				},
				grid: {
					color: (context: any) => context.tick.value === 0 ? surface50 : surface300,
				},
				border: {
					display: false,
				},
			},
			y: {
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
				hitRadius: 50,
				hoverRadius: 5,
			},
		},
	};
</script>
