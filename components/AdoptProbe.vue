<template>
	<Stepper v-model:activeStep="activeStep">
		<StepperPanel>
			<template #header="{ active, highlighted, clickCallback }">
				<StepHeader :on-click="clickCallback" button-text="1" header-text="Set up your probe" :active="active" :highlighted="highlighted"/>
			</template>
			<template #separator/>
			<template #content="{ nextCallback }">
				<TabView :pt="{ inkbar: {class: 'hidden'}}">
					<TabPanel>
						<template #header>
							<i class="pi pi-check mr-2"/>I'm already running a probe
						</template>
						<p class="mb-4 mt-2 text-lg font-bold">Set up your probe</p>
						<p>First, update your container by running following commands:</p>
						<Code :commands="setUpCommands" class="mt-4"/>
					</TabPanel>
					<TabPanel>
						<template #header>
							<i class="pi pi-times mr-2"/>I'm not running a probe
						</template>
						<p class="mb-4 mt-2 text-lg font-bold">Join the network</p>
						<StartProbe/>
					</TabPanel>
				</TabView>
				<div class="p-5 pt-2 text-right">
					<Button class="mr-2" label="Cancel" severity="contrast" text @click="$emit('cancel')"/>
					<Button label="Next step" icon="pi pi-arrow-right" icon-pos="right" @click="nextCallback"/>
				</div>
			</template>
		</StepperPanel>
		<StepperPanel>
			<template #header="{ active, highlighted, clickCallback }">
				<StepHeader :on-click="clickCallback" button-text="2" header-text="Send adoption code" :active="active" :highlighted="highlighted"/>
			</template>
			<template #separator/>
			<template #content="{ prevCallback, nextCallback }">
				<div class="p-5">
					<p class="mb-4 mt-2 text-lg font-bold">Send adoption code</p>
					<p>Enter your probe's public IP address and we will send it a verification code.</p>
					<p class="font-semibold">Your probe will have the same IP as the network it's connected to.</p>
					<InputText
						v-model="ip"
						placeholder="Enter IP address of your probe"
						class="mt-6 w-full"
						:invalid="!isIpValid"
						@keyup.enter="sendAdoptionCode(nextCallback)"
						@update:model-value="resetIsValid"
					/>
					<p v-if="!isIpValid" class="absolute pl-1 text-red-500">{{ invalidMessage }}</p>
					<div class="mt-6 text-right">
						<Button class="mr-2" label="Back" severity="contrast" text @click="prevCallback"/>
						<Button label="Send code to probe" @click="sendAdoptionCode(nextCallback)"/>
					</div>
				</div>
			</template>
		</StepperPanel>
		<StepperPanel>
			<template #header="{ active, highlighted, clickCallback }">
				<StepHeader :on-click="clickCallback" button-text="3" header-text="Verify" :active="active" :highlighted="highlighted"/>
			</template>
			<template #separator/>
			<template #content="{ prevCallback }">
				<div class="p-5">
					<p class="mb-4 mt-2 text-lg font-bold">Verify</p>
					<p>Adoption code sent to <span class="font-semibold">your probe with IP address {{ ip }}</span>.</p>
					<div class="mt-6">
						<Button severity="secondary" class="mr-2 !rounded-xl !border-0" :class="{'text-primary bg-[#FCF0EE] font-semibold': probeType === 'docker'}" @click="toggleProbeType">
							<nuxt-icon class="mr-2 text-inherit" name="docker"/>
							For Docker probes
						</Button>
						<Button severity="secondary" class="mr-2 !rounded-xl !border-0" :class="{'text-primary bg-[#FCF0EE] font-semibold': probeType === 'hardware'}" @click="toggleProbeType">
							<nuxt-icon class="mr-2 text-inherit" name="probe"/>
							For hardware probes
						</Button>
					</div>
					<p class="mt-6">Now you need to check the probe's log output to find the verification code. If you're running it inside a Docker container then you can quickly find it by running this command:</p>
					<Code class="mt-3" :commands="probeType === 'docker' ? [['docker logs -f --tail 25 globalping-probe']] : [['ssh logs@IP-ADDRESS']]"/>
					<p class="mt-3">Find the code in the logs and input it here to verify ownership.</p>
					<div class="mt-6 text-right">
						<Button class="mr-2" label="Back" severity="contrast" text @click="prevCallback"/>
						<Button label="Verify the code" @click="verifyCode"/>
					</div>
				</div>
			</template>
		</StepperPanel>
	</Stepper>
</template>

<script setup lang="ts">
	import { customEndpoint } from '@directus/sdk';
	const { $directus } = useNuxtApp();

	defineEmits([ 'cancel' ]);

	const activeStep = ref(0);

	// STEP 1

	const setUpCommands = [
		[ 'docker pull ghcr.io/jsdelivr/globalping-probe' ],
		[ 'docker stop globalping-probe' ],
		[ 'docker rm globalping-probe' ],
		[ 'docker run -d --log-driver local --network host --restart=always --name globalping-probe ghcr.io/jsdelivr/globalping-probe' ],
	];

	// STEP 2

	const ip = ref('');
	const isIpValid = ref(true);
	const invalidMessage = ref('');

	const resetIsValid = () => {
		isIpValid.value = true;
		invalidMessage.value = '';
	};

	const sendAdoptionCode = async (nextCallback: Function) => {
		const isValid = validateIp(ip.value);

		if (!isValid) {
			isIpValid.value = false;
			invalidMessage.value = 'Invalid ip format';
			return;
		}

		try {
			await $directus.request(customEndpoint({ method: 'POST', path: '/adoption-code/send-code', body: JSON.stringify({ ip: ip.value }) }));
			nextCallback();
		} catch (e: any) {
			const detail = e.errors ?? e.message ?? 'Request failed';
			isIpValid.value = false;
			invalidMessage.value = detail;
		}
	};

	// STEP 3

	const probeType = ref('docker');
	const toggleProbeType = () => {
		probeType.value = probeType.value === 'docker' ? 'hardware' : 'docker';
	};

	const verifyCode = () => {};

</script>
