<template>
	<Stepper v-model:activeStep="activeStep">
		<StepperPanel>
			<template #header="{ active, highlighted }">
				<StepHeader
					button-text="1"
					header-text="Set up your probe"
					:active="active"
					:highlighted="highlighted"
					:is-success="isSuccess"
				/>
			</template>
			<template #separator/>
			<template #content="{ nextCallback }">
				<TabView :pt="{ inkbar: {class: 'hidden'}}" class="dark:border-dark-300 border-t">
					<!-- TODO: try using a fixed modal size so that it doesn't change when switching between the tabs -->
					<!-- TODO: also must not change when going through steps 1-2-3, or maybe the change can at least be animated -->
					<TabPanel>
						<template #header>
							<i class="pi pi-check mr-2"/>I'm already running a probe
						</template>
						<p class="mb-4 mt-2 text-lg font-bold">Set up your probe</p>
						<p>First, update your container by running the following commands:</p>
						<CodeBlock :commands="setUpCommands" class="mt-4"/>
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
					<Button class="mr-2" label="Cancel" severity="secondary" text @click="$emit('cancel')"/>
					<Button label="Next step" icon="pi pi-arrow-right" icon-pos="right" @click="nextCallback"/>
				</div>
			</template>
		</StepperPanel>
		<StepperPanel>
			<template #header="{ active, highlighted }">
				<StepHeader
					button-text="2"
					header-text="Send adoption code"
					:active="active"
					:highlighted="highlighted"
					:is-success="isSuccess"
				/>
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
						@update:model-value="resetIsIpValid"
					/>
					<p v-if="!isIpValid" class="absolute pl-1 text-red-500">{{ invalidIpMessage }}</p>
					<div class="mt-6 text-right">
						<Button class="mr-2" label="Back" severity="secondary" text @click="prevCallback"/>
						<Button label="Send code to probe" :loading="sendAdoptionCodeLoading" @click="sendAdoptionCode(nextCallback)"/>
					</div>
				</div>
			</template>
		</StepperPanel>
		<StepperPanel>
			<template #header="{ active, highlighted }">
				<StepHeader
					button-text="3"
					header-text="Verify"
					:active="active"
					:highlighted="highlighted"
					:is-success="isSuccess"
				/>
			</template>
			<template #separator/>
			<template #content="{ prevCallback }">
				<div v-if="!isSuccess" class="p-5">
					<p class="mb-4 mt-2 text-lg font-bold">Verify</p>
					<p>Adoption code sent to <span class="font-semibold">your probe with IP address {{ ip }}</span>.</p>
					<div class="mt-6">
						<Button severity="secondary" class="mb-2 mr-2 !rounded-xl !border-0" :class="{'!text-primary !bg-[#FCF0EE] font-semibold dark:!bg-red-500/30': probeType === 'docker'}" @click="toggleProbeType">
							<nuxt-icon class="mr-2 text-inherit" name="docker"/>
							For Docker probes
						</Button>
						<Button severity="secondary" class="mb-2 mr-2 !rounded-xl !border-0" :class="{'!text-primary !bg-[#FCF0EE] font-semibold dark:!bg-red-500/30': probeType === 'hardware'}" @click="toggleProbeType">
							<nuxt-icon class="mr-2 text-inherit" name="probe"/>
							For hardware probes
						</Button>
					</div>
					<p class="mt-4">Now you need to check the probe's log output to find the verification code. If you're running it inside a Docker container then you can quickly find it by running this command:</p>
					<CodeBlock class="mt-3" :commands="probeType === 'docker' ? [['docker logs -f --tail 25 globalping-probe']] : [['ssh logs@IP-ADDRESS']]"/>
					<p class="mt-3">Find the code in the logs and input it here to verify ownership.</p>
					<div class="bg-surface-50 dark:bg-dark-600 mt-6 rounded-xl py-10 text-center">
						<InputOtp
							v-model="code"
							:length="6"
							:invalid="!isCodeValid"
							@update:model-value="resetIsCodeValid"
							@keydown="handleKeydown"
						/>
						<p v-if="!isCodeValid" class="mt-3 text-red-500">{{ invalidCodeMessage }}</p>
						<Button class="mt-3" label="Resend code" severity="secondary" text @click="resendCode"/>
					</div>
					<div class="mt-6 text-right">
						<Button class="mr-2" label="Back" severity="secondary" text @click="prevCallback"/>
						<Button label="Verify the code" :loading="verifyCodeLoading" @click="verifyCode"/>
					</div>
				</div>
				<div v-else class="px-5 py-7">
					<div class="rounded-xl bg-green-400/10 p-6">
						<p class="flex items-center justify-center text-center text-lg font-bold">
							<i class="pi pi-verified mr-2 text-green-600"/>
							Congratulations!
						</p>
						<p class="mt-4 text-center">You are now the owner of the following probe:</p>
						<div v-if="probe" class="bg-surface-0 dark:bg-dark-800 dark:border-dark-300 mt-4 rounded-xl border p-3 text-center">
							<p class="font-bold">{{ probe.city }}</p>
							<p class="flex items-center justify-center">
								<CountryFlag :country="probe.country" size="small"/>
								<span class="ml-2">{{ probe.network }}</span>
							</p>
						</div>
					</div>
					<p class="mt-4">The probe will now generate credits that you can use to run more tests. We also recommend you verify and correct the probe's location.</p>
					<div class="mt-7 flex justify-end">
						<Button label="Finish" @click="$emit('cancel')"/>
					</div>
				</div>
			</template>
		</StepperPanel>
	</Stepper>
</template>

<script setup lang="ts">
	import { customEndpoint } from '@directus/sdk';
	import CountryFlag from 'vue-country-flag-next';
	import { validateIp } from '~/utils/validate-ip';

	const { $directus } = useNuxtApp();
	const toast = useToast();

	const emit = defineEmits([ 'cancel', 'adopted' ]);

	const activeStep = ref(0);

	// STEP 1

	const setUpCommands = [
		[ 'docker pull globalping/globalping-probe' ],
		[ 'docker stop globalping-probe' ],
		[ 'docker rm globalping-probe' ],
		[ 'docker run -d --log-driver local --network host --restart=always --name globalping-probe globalping/globalping-probe' ],
	];

	// STEP 2

	const ip = ref('');
	const isIpValid = ref(true);
	const invalidIpMessage = ref('');

	const resetIsIpValid = () => {
		isIpValid.value = true;
		invalidIpMessage.value = '';
	};

	const sendAdoptionCodeLoading = ref(false);
	const sendAdoptionCode = async (nextCallback: Function) => {
		const isValid = validateIp(ip.value);

		if (!isValid) {
			isIpValid.value = false;
			invalidIpMessage.value = 'Invalid ip format';
			return;
		}

		sendAdoptionCodeLoading.value = true;

		try {
			await $directus.request(customEndpoint({ method: 'POST', path: '/adoption-code/send-code', body: JSON.stringify({ ip: ip.value }) }));
			nextCallback();
		} catch (e: any) {
			const detail = e.errors ?? 'Request failed';
			isIpValid.value = false;
			invalidIpMessage.value = detail;
		}

		sendAdoptionCodeLoading.value = false;
	};

	// STEP 3

	const probeType = ref('docker');
	const code = ref('');
	const isCodeValid = ref(true);
	const invalidCodeMessage = ref('');
	const probe = ref<Probe | null>(null);

	const toggleProbeType = () => {
		probeType.value = probeType.value === 'docker' ? 'hardware' : 'docker';
	};

	const resetIsCodeValid = () => {
		isCodeValid.value = true;
		invalidCodeMessage.value = '';
	};

	const resendCode = async () => {
		code.value = '';
		resetIsCodeValid();

		try {
			await $directus.request(customEndpoint({ method: 'POST', path: '/adoption-code/send-code', body: JSON.stringify({ ip: ip.value }) }));
			toast.add({ severity: 'info', summary: 'Code was resent', detail: 'Now you need to get it and paste to the input', life: 5000 });
		} catch (e: any) {
			const detail = e.errors ?? 'Request failed';
			isIpValid.value = false;
			invalidIpMessage.value = detail;
			toast.add({ severity: 'error', summary: 'Resend failed', detail, life: 20000 });
		}
	};

	const verifyCodeLoading = ref(false);
	const verifyCode = async () => {
		verifyCodeLoading.value = true;

		try {
			const response = await $directus.request(customEndpoint({ method: 'POST', path: '/adoption-code/verify-code', body: JSON.stringify({ code: code.value.substring(0, 6) }) })) as Probe;
			probe.value = response;
			isSuccess.value = true;
			emit('adopted');
		} catch (e: any) {
			const detail = e.errors ?? 'Request failed';
			isCodeValid.value = false;
			invalidCodeMessage.value = detail;
		}

		verifyCodeLoading.value = false;
	};

	const handleKeydown = async (event: KeyboardEvent) => {
		if (event.key === 'Enter') {
			await verifyCode();
		}
	};

	// SUCCESS STEP

	const isSuccess = ref(false);
</script>
