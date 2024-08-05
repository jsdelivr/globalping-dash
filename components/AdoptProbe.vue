<template>
	<Stepper v-model:value="activeStep" linear @update:value="onChangeStep">
		<StepList>
			<Step v-slot="{ active, value }" as-child value="0">
				<StepHeader
					:button-text="value"
					header-text="Set up your probe"
					:active="active"
					:highlighted="Number(activeStep) > 0"
					:is-success="isSuccess"
				/>
			</Step>
			<Step v-slot="{ active, value }" as-child value="1">
				<StepHeader
					:button-text="value"
					header-text="Send adoption code"
					:active="active"
					:highlighted="Number(activeStep) > 1"
					:is-success="isSuccess"
				/>
			</Step>
			<Step v-slot="{ active, value }" as-child value="2">
				<StepHeader
					:button-text="value"
					header-text="Verify"
					:active="active"
					:highlighted="Number(activeStep) > 2"
					:is-success="isSuccess"
				/>
			</Step>
		</StepList>
		<StepPanels id="ap-step-panels" class="box-content overflow-hidden transition-[height] duration-500">
			<StepPanel v-slot="{ activateCallback }" value="0">
				<Tabs v-model:value="activeTab" :pt="{ inkbar: {class: 'hidden'}}" class="border-t dark:border-dark-400" @update:value="onChangeTab">
					<!-- TODO: P1: also must not change when going through steps 1-2-3, or maybe the change can at least be animated -->
					<TabList>
						<Tab value="0" :class="{ grow: true }"><i class="pi pi-check mr-2"/>I'm already running a probe</Tab>
						<Tab value="1" :class="{ grow: true }"><i class="pi pi-times mr-2"/>I'm not running a probe yet</Tab>
					</TabList>
					<TabPanels id="ap-tab-panels" ref="tabPanels" class="box-content overflow-hidden transition-[height] duration-500">
						<TabPanel value="0" class="overflow-auto">
							<p class="mb-4 mt-2 text-lg font-bold">Set up your probe</p>
							<p>First, update your container by running the following commands:</p>
							<CodeBlock :commands="setUpCommands" class="mt-4"/>
						</TabPanel>
						<TabPanel value="1" class="overflow-auto">
							<p class="mb-4 mt-2 text-lg font-bold">Join the network</p>
							<StartProbe/>
						</TabPanel>
					</TabPanels>
				</Tabs>
				<div class="p-5 pt-2 text-right">
					<Button class="mr-2" label="Cancel" severity="secondary" text @click="$emit('cancel')"/>
					<Button label="Next step" icon="pi pi-arrow-right" icon-pos="right" @click="activateCallback('1')"/>
				</div>
			</StepPanel>
			<StepPanel v-slot="{ activateCallback }" value="1">
				<div class="p-5">
					<p class="mb-4 mt-2 text-lg font-bold">Send adoption code</p>
					<p>Enter your probe's public IP address and we will send it a verification code.</p>
					<p class="font-semibold">Your probe will have the same IP address as the network it's connected to.</p>
					<InputText
						v-model="ip"
						placeholder="Enter IP address of your probe"
						class="mt-6 w-full"
						:invalid="!isIpValid"
						@keyup.enter="sendAdoptionCode(activateCallback)"
						@update:model-value="resetIsIpValid"
					/>
					<!-- TODO: P1: invalid state has both red and green (focus) outline; should be just red -->
					<!-- TODO: P1: can't be absolute - breaks on mobile (when scrollable) - check also other places when absolute is used-->
					<p v-if="!isIpValid" class="absolute text-red-500">{{ invalidIpMessage }}</p>
					<div class="mt-6 text-right">
						<Button class="mr-2" label="Back" severity="secondary" text @click="activateCallback('0')"/>
						<Button label="Send code to probe" :loading="sendAdoptionCodeLoading" @click="sendAdoptionCode(activateCallback)"/>
					</div>
				</div>
			</StepPanel>
			<StepPanel v-slot="{ activateCallback }" value="2">
				<div v-if="!isSuccess" class="p-5">
					<p class="mb-4 mt-2 text-lg font-bold">Verify</p>
					<p>Adoption code sent to <span class="font-semibold">your probe with IP address {{ ip }}</span>.</p>
					<div class="my-4">
						<SelectButton
							v-model="probeType"
							:options="probeTypes"
							aria-labelledby="basic"
							option-value="value"
							severity="primary"
						>
							<template #option="slotProps">
								<nuxt-icon :name="slotProps.option.icon"/>
								<span class="font-bold">{{ slotProps.option.name }}</span>
							</template>
						</SelectButton>
					</div>
					<p class="mt-4">Now you need to check the probe's log output to find the verification code. If you're running it inside a Docker container then you can quickly find it by running this command:</p>
					<CodeBlock class="mt-3" :commands="probeType === 'docker' ? [['docker logs -f --tail 25 globalping-probe']] : [['ssh logs@IP-ADDRESS']]"/>
					<p class="mt-3">Find the code in the logs and input it here to verify ownership.</p>
					<div class="mt-6 rounded-xl bg-surface-50 py-10 text-center dark:bg-dark-600 ">
						<div class="flex justify-center">
							<InputOtp
								v-model="code"
								:length="6"
								:invalid="!isCodeValid"
								integer-only
								@update:model-value="resetIsCodeValid"
								@keydown="handleKeydown"
							/>
						</div>
						<p v-if="!isCodeValid" class="mt-3 text-red-500">{{ invalidCodeMessage }}</p>
						<Button class="mt-3" label="Resend code" severity="secondary" text @click="resendCode"/>
					</div>
					<div class="mt-6 text-right">
						<Button class="mr-2" label="Back" severity="secondary" text @click="activateCallback('1')"/>
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
						<div v-if="probe" class="mt-4 rounded-xl border bg-surface-0 p-3 text-center dark:border-dark-400 dark:bg-dark-800">
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
			</StepPanel>
		</StepPanels>
	</Stepper>
</template>

<script setup lang="ts">
	import { customEndpoint } from '@directus/sdk';
	import CountryFlag from 'vue-country-flag-next';
	import { validateIp } from '~/utils/validate-ip';

	const { $directus } = useNuxtApp();
	const toast = useToast();

	const emit = defineEmits([ 'cancel', 'adopted' ]);

	let prevStep = '0';
	const activeStep = ref('0');

	watchEffect(() => { prevStep = activeStep.value; });

	// ANIMATE STEP HEIGHT CHANGE

	const onChangeStep = (i: string | number) => {
		const newIndex = Number(i);
		const currentIndex = Number(prevStep);
		const wrapper = document.querySelector('#ap-step-panels')!;
		const children = wrapper.children;
		const currentChildHeight = children[currentIndex].scrollHeight;
		wrapper.style.height = currentChildHeight + 'px';

		requestAnimationFrame(() => {
			wrapper.addEventListener('transitionend', () => {
				// remove "height" from the wrapper's inline styles, so it can return to its initial value
				wrapper.style.height = null;
			}, { once: true });

			const newChildHeight = children[newIndex].scrollHeight;
			wrapper.style.height = newChildHeight + 'px';
		});
	};

	// STEP 1

	const tabPanels = ref(null);
	let prevTab = '0';
	const activeTab = ref('0');

	watchEffect(() => { prevTab = activeTab.value; });

	const onChangeTab = (i: string | number) => {
		const newIndex = Number(i);
		const currentIndex = Number(prevTab);
		const wrapper = document.querySelector('#ap-tab-panels')!;
		const children = wrapper.children;
		const currentChildHeight = children[currentIndex].scrollHeight;
		wrapper.style.height = currentChildHeight + 'px';

		requestAnimationFrame(() => {
			wrapper.addEventListener('transitionend', () => {
				// remove "height" from the wrapper's inline styles, so it can return to its initial value
				wrapper.style.height = null;
			}, { once: true });

			const newChildHeight = children[newIndex].scrollHeight;
			wrapper.style.height = newChildHeight + 'px';
		});
	};

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
	const sendAdoptionCode = async (activateCallback: Function) => {
		const isValid = validateIp(ip.value);

		if (!isValid) {
			isIpValid.value = false;
			invalidIpMessage.value = 'Invalid ip format';
			return;
		}

		sendAdoptionCodeLoading.value = true;

		try {
			await $directus.request(customEndpoint({ method: 'POST', path: '/adoption-code/send-code', body: JSON.stringify({ ip: ip.value }) }));
			activateCallback('2');
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

	const probeTypes = [
		{ name: 'Docker probes', value: 'docker', icon: 'docker' },
		{ name: 'Hardware probes', value: 'hardware', icon: 'probe' },
	];

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
