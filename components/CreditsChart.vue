
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
	const surface300 = documentStyle.getPropertyValue('--surface-300');
	const primary = documentStyle.getPropertyValue('--primary');

	const chartData = computed(() => {
		const changesAsc = [ ...props.creditsChanges ].reverse();

		const data: {
			label: string;
			total: number;
			generated: number;
			spent: number;
		}[] = [];

		changesAsc.forEach((change) => {
			const [ _year, month, day ] = change.date_created.split('-');
			const label = `${day}/${month}`;
			const prevElem = data.at(-1);

			if (!prevElem) {
				data.push({
					label,
					total: change.type === 'addition' ? props.startAmount + change.amount : props.startAmount - change.amount,
					generated: change.type === 'addition' ? change.amount : 0,
					spent: change.type === 'deduction' ? change.amount : 0,
				});
			} else if (prevElem.label === label) {
				const currentDiff = prevElem.generated - prevElem.spent;
				const updatedDiff = currentDiff + (change.type === 'addition' ? change.amount : -change.amount);
				prevElem.total += change.type === 'addition' ? change.amount : -change.amount;

				if (updatedDiff > 0) {
					prevElem.generated = updatedDiff;
					prevElem.spent = 0;
				} else {
					prevElem.generated = 0;
					prevElem.spent = 0;
				}
			} else if (change.type === 'addition') {
				data.push({
					label,
					total: prevElem.total + change.amount,
					generated: change.amount,
					spent: 0,
				});
			} else if (change.type === 'deduction') {
				data.push({
					label,
					total: prevElem.total - change.amount,
					generated: 0,
					spent: change.amount,
				});
			}
		});

		return {
			labels: data.map(({ label }) => label),
			datasets: [
				{
					data: data.map(({ total }) => total),
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
			tooltip: {
				callbacks: {
					title: (args) => {
						console.log(args);
						return 'alo';
					},
					label: (args2) => {
						console.log(args2);
						return 'alo2';
					},
				},
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
					color: surface300,
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
				hitRadius: 50,
				hoverRadius: 5,
			},
		},
	};
</script>
