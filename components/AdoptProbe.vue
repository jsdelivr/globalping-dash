<template>
	<Stepper v-model:activeStep="activeStep">
		<StepperPanel>
			<template #header="{ index, active, highlighted, clickCallback }">
				<StepHeader :on-click="clickCallback" button-text="1" header-text="Set up your probe" :active="active" :highlighted="highlighted"/>
			</template>
			<template #separator/>
			<template #content="{ nextCallback }">
				<TabView class="border-t" :pt="{ inkbar: {class: 'hidden'}}">
					<TabPanel>
						<template #header>
							<i class="pi pi-check mr-2"/>I'm already running a probe
						</template>
						<p class="mb-4 mt-2 text-lg font-bold">Set up your probe</p>
						<p>First, update your container by running following commands:</p>
						<div class="relative mt-4 rounded-xl border p-4">
							<div class="no-scrollbar overflow-scroll">
								<pre v-for="line in commands" :key="line.toString()"><code>{{ line[0] }}</code><code class="text-bluegray-300 mr-12">{{ line[1] }}</code></pre>
							</div>
							<div class="!absolute right-2 top-2">
								<Button
									icon="pi pi-copy"
									severity="secondary"
									raised
									@click="copyCommand"
								/>
								<div v-if="copyTooltip" class="bg-bluegray-700 text-surface-0 absolute left-1/2 top-[-40px] -translate-x-1/2 rounded-md p-2">
									Copied!
								</div>
							</div>
						</div>
					</TabPanel>
					<TabPanel>
						<template #header>
							<i class="pi pi-times mr-2"/>I'm not running a probe
						</template>
						<p class="mb-4 mt-2 text-lg font-bold">Join the network</p>
						<StartProbe/>
					</TabPanel>
				</TabView>
			</template>
		</StepperPanel>
		<StepperPanel>
			<template #header="{ index, active, highlighted, clickCallback }">
				<StepHeader :on-click="clickCallback" button-text="2" header-text="Send adoption code" :active="active" :highlighted="highlighted"/>
			</template>
			<template #separator/>
			<template #content="{ nextCallback }">
				<Button label="Next 1" icon="pi pi-arrow-right" icon-pos="right" @click="nextCallback"/>
			</template>
		</StepperPanel>
		<StepperPanel>
			<template #header="{ index, active, highlighted, clickCallback }">
				<StepHeader :on-click="clickCallback" button-text="3" header-text="Verify" :active="active" :highlighted="highlighted"/>
			</template>
			<template #separator/>
			<template #content="{ nextCallback }">
				<Button label="Next 2" icon="pi pi-arrow-right" icon-pos="right" @click="nextCallback"/>
			</template>
		</StepperPanel>
	</Stepper>
</template>

<script setup lang="ts">
	// Stepper
	const activeStep = ref(0);

	// "Set up your probe" panel

	const commands = [
		[ 'docker pull ghcr.io/jsdelivr/globalping-probe' ],
		[ 'docker stop globalping-probe' ],
		[ 'docker rm globalping-probe' ],
		[ 'docker run -d --log-driver local --network host --restart=always --name globalping-probe ghcr.io/jsdelivr/globalping-probe' ],
	];

	const copyTooltip = ref(false);
	const copyCommand = async () => {
		const content = commands.map(parts => parts.join('')).join('\n');

		await navigator.clipboard.writeText(content);
		copyTooltip.value = true;
		setTimeout(() => copyTooltip.value = false, 1000);
	};
</script>
