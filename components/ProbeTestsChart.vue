<template>
	<div class="probe-tests-chart size-full">
		<Chart type="bar" :data="chartData" :options="chartOptions" class="size-full"/>
	</div>
</template>

<script setup lang="ts">
	import Chart from 'primevue/chart';

	const documentStyle = getComputedStyle(document.documentElement);
	const bluegray400 = documentStyle.getPropertyValue('--bluegray-400');
	const bluegray700 = documentStyle.getPropertyValue('--bluegray-700');

	const chartData = computed(() => {
		return {
			labels: [ '3:00 PM', '3:00 PM' ],
			datasets: [
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
					afterBody: () => 'TODO: AFTER BODY CHART OPTIONS',
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
					display: false,
				},
			},
			y: {
				beginAtZero: true,
				ticks: {
					color: bluegray400,
				},
				grid: {
					display: false,
				},
				border: {
					display: false,
				},
			},
		},
		elements: {},
	}));
</script>
