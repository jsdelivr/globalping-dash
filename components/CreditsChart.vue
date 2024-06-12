
<template>
	<Chart type="line" :data="chartData" :options="chartOptions" class="h-30rem"/>
</template>

<script setup>
	import Chart from 'primevue/chart';
	import { ref, onMounted } from 'vue';

	onMounted(() => {
		chartData.value = setChartData();
		chartOptions.value = setChartOptions();
	});

	const chartData = ref();
	const chartOptions = ref();

	const setChartData = () => {
		return {
			labels: [ 'January', 'February', 'March', 'April', 'May', 'June', 'July' ],
			datasets: [
				{
					data: [ 65, 59, 80, 81, 56, 55, 40 ],
					fill: 'origin',

				},
			],
		};
	};

	let width, height, gradient;

	function getGradient (ctx, chartArea) {
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
	}

	const setChartOptions = () => {
		const documentStyle = getComputedStyle(document.documentElement);
		const bluegray400 = documentStyle.getPropertyValue('--bluegray-400');
		const surface300 = documentStyle.getPropertyValue('--surface-300');
		const primary = documentStyle.getPropertyValue('--primary');

		return {
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
						color: surface300,
					},
					border: {
						display: false,
					},
				},
				y: {
					ticks: {
						color: bluegray400,
						font: {
						},
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
					backgroundColor: primary,
					borderWidth: 2,
					backgroundColor (context) {
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
	};
</script>
