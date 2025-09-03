<template>
	<Stepper v-model:value="activeStep" linear @update:value="onChangeStep">
		<div v-if="Number(activeStep) === 0" class="border-t bg-surface-50 p-7 text-center dark:bg-dark-600">
			<h3 class="text-lg font-bold">Select the probe type</h3>
			<p>Please select the type of your probe before proceeding</p>
		</div>
		<StepList v-else-if="Number(activeStep) > 0 && Number(activeStep) <= 2">
			<Step v-slot="{ active }" as-child value="0">
				<StepHeader
					:button-text="'0'"
					header-text="Select the probe type"
					:active="active"
					:highlighted="Number(activeStep) > 0"
					:is-success="isSuccess"
				/>
			</Step>
			<Step v-slot="{ active }" as-child value="1">
				<StepHeader
					:button-text="'1'"
					header-text="Set up your probe"
					:active="active"
					:highlighted="Number(activeStep) > 1"
					:is-success="isSuccess"
				/>
			</Step>
			<Step v-slot="{ active }" as-child value="2">
				<StepHeader
					:button-text="'2'"
					header-text="Verify"
					:active="active"
					:highlighted="Number(activeStep) > 2"
					:is-success="isSuccess"
				/>
			</Step>
		</StepList>
		<StepList v-else>
			<Step v-slot="{ active }" as-child value="0">
				<StepHeader
					:button-text="'0'"
					header-text="Select the probe type"
					:active="active"
					:highlighted="Number(activeStep) > 0"
					:is-success="isSuccess"
				/>
			</Step>
			<Step v-slot="{ active }" as-child value="3">
				<StepHeader
					:button-text="'1'"
					header-text="Set up your probe"
					:active="active"
					:highlighted="Number(activeStep) > 3"
					:is-success="isSuccess"
				/>
			</Step>
			<Step v-slot="{ active }" as-child value="4">
				<StepHeader
					:button-text="'2'"
					header-text="Send adoption code"
					:active="active"
					:highlighted="Number(activeStep) > 4"
					:is-success="isSuccess"
				/>
			</Step>
			<Step v-slot="{ active }" as-child value="5">
				<StepHeader
					:button-text="'3'"
					header-text="Verify"
					:active="active"
					:highlighted="Number(activeStep) > 5"
					:is-success="isSuccess"
				/>
			</Step>
		</StepList>
		<StepPanels ref="stepPanels" class="box-content overflow-hidden transition-[height] duration-500">
			<StepPanel v-slot="{ activateCallback }" value="0">
				<div class="flex justify-evenly gap-4 p-5 pt-7 max-sm:flex-col">
					<button class="group relative flex flex-row items-stretch overflow-hidden rounded-xl border hover:border-[#17d4a7] dark:bg-dark-900" @click="() => { probeType = 'software'; activateCallback('1'); fixTabListUnderline(); }">
						<div class="w-14 bg-surface-100 group-hover:bg-[#E5FCF6] dark:bg-dark-600 dark:group-hover:bg-dark-600">
							<Checkbox class="mt-6" size="large"/>
						</div>
						<div class="w-80 p-4 text-left sm:p-6">
							<p class="font-bold">Software probe</p>
							<p class="mt-2">A Docker container that runs on your own hardware.</p>
							<NuxtIcon class="mt-2 inline-block text-6xl text-[#099CEC]" name="docker" aria-hidden="true"/>
						</div>
					</button>
					<button class="group relative flex flex-row items-stretch overflow-hidden rounded-xl border hover:border-[#17d4a7] dark:bg-dark-900" @click="() => { probeType = 'hardware'; activateCallback('3'); }">
						<div class="w-14 bg-surface-100 group-hover:bg-[#E5FCF6] dark:bg-dark-600 dark:group-hover:bg-dark-600">
							<Checkbox class="mt-6" size="large"/>
						</div>
						<div class="w-80 p-4 text-left sm:p-6">
							<p class="font-bold">Hardware probe</p>
							<p class="mt-2">A dedicated device that you received from us or one of our partners.</p>
							<img class="mt-4 w-14" src="~/assets/images/hw-probe-small.png" alt="Hardware probe">
						</div>
					</button>
				</div>
			</StepPanel>
			<StepPanel v-slot="{ activateCallback }" value="1">
				<Tabs v-model:value="activeTab" :pt="{ inkbar: {class: 'hidden'}}" class="border-t dark:border-dark-400" @update:value="onChangeTab">
					<TabList>
						<Tab value="0" :class="{ grow: true }"><i class="pi pi-check mr-2"/>I'm already running a probe</Tab>
						<Tab value="1" :class="{ grow: true }"><i class="pi pi-times mr-2"/>I'm not running a probe yet</Tab>
					</TabList>
					<TabPanels ref="tabPanels" class="box-content overflow-hidden transition-[height] duration-500">
						<TabPanel value="0">
							<!-- inline-block is required so mt-2 is not collapsed -->
							<p class="mb-4 mt-2 inline-block text-lg font-bold">Configure the probe</p>
							<p>Recreate the container by running the following commands. The new container will be automatically bound to your account.</p>
							<StartProbeCommands :adopt="true" :recreate="true"/>
						</TabPanel>
						<TabPanel value="1">
							<p class="mb-4 mt-2 inline-block text-lg font-bold">Join the network</p>
							<StartProbe :adopt="true"/>
						</TabPanel>
					</TabPanels>
				</Tabs>
				<div class="p-5 pt-2 text-right">
					<Button class="mr-2" label="Back" severity="secondary" text @click="activateCallback('0')"/>
					<Button label="Next step" icon="pi pi-arrow-right" icon-pos="right" @click="searchNewProbes(activateCallback)"/>
				</div>
			</StepPanel>
			<StepPanel v-slot="{ activateCallback }" value="2">
				<div v-if="!isSuccess && !isFailed" class="px-5 py-7">
					<div class="rounded-xl bg-surface-50 p-7 text-center dark:bg-dark-600">
						<p class="text-lg font-bold">Waiting for the probe to connect...</p>
						<p class="mt-2">This shouldn't take more than a few seconds.</p>
						<div class="mt-4">
							<span class="pi pi-spinner animate-spin text-4xl text-primary-500"/>
						</div>
					</div>
				</div>
				<ProbeAdoptedContent v-else-if="isSuccess" :probes="newProbes" @cancel="$emit('cancel')"/>
				<div v-else class="p-5">
					<div class="rounded-xl bg-red-100/70 px-24 py-6 text-center max-sm:px-4 dark:bg-red-500/20">
						<p class="flex items-center justify-center text-center text-lg font-bold">
							<i class="pi pi-times-circle mr-2 text-[#E24C4C]"/>
							Adoption failed
						</p>
						<p class="mt-4">
							We haven't detected any new probes under your account.<br>
							If your probe is up and running, please try manual adoption instead.
						</p>

						<div class="mt-4 flex flex-wrap justify-center gap-2">
							<Button label="Adopt the probe manually" severity="contrast" @click="() => { activateCallback('4'); isFailed = false; }"/>
							<Button label="Retry automated adoption" severity="secondary" @click="() => { activateCallback('1'); isFailed = false; }"/>
						</div>
					</div>
				</div>
			</StepPanel>
			<StepPanel v-slot="{ activateCallback }" value="3">
				<div class="p-5">
					<p class="mb-4 mt-2 text-lg font-bold">Set up your probe</p>
					<p class="mt-4">
						Make sure your probe is running, connected to the network, and the green LED is on.
						The probe usually takes about 4 minutes to start after being turned on.
					</p>
				</div>
				<div class="flex flex-wrap justify-end gap-8 p-5 pt-2 text-right">
					<NuxtLink to="https://github.com/jsdelivr/globalping-probe#hardware-probes" tabindex="-1" target="_blank" class="mr-auto max-sm:w-full">
						<Button label="Learn more about hardware probes" severity="secondary" icon="pi pi-info-circle" class="mr-4 w-full"/>
					</NuxtLink>

					<div>
						<Button class="mr-2" label="Back" severity="secondary" text @click="activateCallback('0')"/>
						<Button label="Next step" icon="pi pi-arrow-right" icon-pos="right" @click="activateCallback('4')"/>
					</div>
				</div>
			</StepPanel>
			<StepPanel v-slot="{ activateCallback }" value="4">
				<div class="p-5">
					<p class="mb-4 mt-2 text-lg font-bold">Send adoption code</p>
					<p>Enter your probe's public IP address and we will send it a verification code.</p>
					<p class="font-semibold">Your probe will have the same IP address as the network it's connected to.</p>
					<div class="relative">
						<InputText
							v-model="ip"
							placeholder="Enter IP address of your probe"
							class="mt-6 w-full"
							:invalid="!isIpValid"
							@keyup.enter="sendAdoptionCode(activateCallback)"
							@update:model-value="resetIsIpValid"
						/>
						<p v-if="!isIpValid" class="absolute text-red-500">{{ invalidIpMessage }}</p>
					</div>
					<div class="mt-6 text-right">
						<Button class="mr-2" label="Back" severity="secondary" text @click="probeType === 'software' ? activateCallback('0') : activateCallback('3')"/>
						<Button :label="isResendingCode ? 'Resend code' : 'Send adoption code'" :loading="sendAdoptionCodeLoading" :disabled="!ip.length" @click="sendAdoptionCode(activateCallback)"/>
					</div>
				</div>
			</StepPanel>
			<StepPanel v-slot="{ activateCallback }" value="5">
				<div v-if="!isSuccess" class="p-5">
					<p class="mb-4 mt-2 text-lg font-bold">Verify</p>
					<p>The adoption code has been sent to <span class="font-semibold">your probe with IP address {{ ip }}</span>.</p>
					<p class="mt-4">Now you need to check the probe's log output to find the verification code. You can quickly find it by running this command:</p>
					<CodeBlock class="mt-3" :commands="probeType === 'software' ? [['docker logs -f --tail 25 globalping-probe']] : [['ssh logs@LOCAL-IP-ADDRESS']]"/>
					<p class="mt-3">Find the code in the logs and enter it below to verify ownership.</p>
					<div class="mt-6 rounded-xl bg-surface-50 py-10 text-center dark:bg-dark-600">
						<div class="flex justify-center">
							<InputOtp
								v-model="code"
								data-testid="adoption-code"
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
						<Button class="mr-2" label="Back" severity="secondary" text @click="activateCallback('4')"/>
						<Button label="Verify the code" :loading="verifyCodeLoading" :disabled="code.length < 6" @click="verifyCode"/>
					</div>
				</div>
				<ProbeAdoptedContent v-else :probes="newProbes" @cancel="$emit('cancel')"/>
			</StepPanel>
		</StepPanels>
	</Stepper>
</template>

<script setup lang="ts">
	import { customEndpoint, readItems } from '@directus/sdk';
	import { useUserFilter } from '~/composables/useUserFilter';
	import { useAuth } from '~/store/auth';
	import { sendErrorToast, sendToast } from '~/utils/send-toast';
	import { smoothResize } from '~/utils/smooth-resize';
	import { validateIp } from '~/utils/validate-ip';

	const { $directus } = useNuxtApp();
	const { getUserFilter } = useUserFilter();
	const emit = defineEmits([ 'cancel', 'adopted' ]);
	const auth = useAuth();
	const { user } = storeToRefs(auth);

	const activeStep = ref('0');
	const probeType = ref<'software' | 'hardware'>('software');
	const newProbes = ref<Probe[]>([]);
	const isSuccess = ref(false);
	const isFailed = ref(false);

	const stepPanels = ref();
	let prevStep = '0';
	watchEffect(() => { prevStep = activeStep.value; });

	const onChangeStep = (i: string | number) => {
		const wrapper = stepPanels.value.$el;
		const currentChild = wrapper.children[Number(prevStep)];
		const newChild = wrapper.children[Number(i)];
		smoothResize(wrapper, currentChild, newChild);
	};

	// STEP 1

	const fixTabListUnderline = () => { setTimeout(() => { activeTab.value = '0'; }); };

	let prevTab = '0';
	const activeTab = ref('1');
	const tabPanels = ref();

	watchEffect(() => { prevTab = activeTab.value; });

	const onChangeTab = function (i: string | number) {
		const wrapper = tabPanels.value.$el;
		const currentChild = wrapper.children[Number(prevTab)];
		const newChild = wrapper.children[Number(i)];
		smoothResize(wrapper, currentChild, newChild);
	};

	// STEP 2

	const { data: initialProbes } = await useLazyAsyncData(
		'initial_user_probes',
		() => $directus.request(readItems('gp_probes', {
			filter: getUserFilter('userId'),
		})),
		{ default: () => [] },
	);

	const searchNewProbes = async (activateCallback: (step: string | number) => void) => {
		activateCallback('2');
		const startTime = Date.now();

		while (Date.now() - startTime <= 10_000) {
			try {
				const currentProbes = await $directus.request(readItems('gp_probes', {
					filter: getUserFilter('userId'),
				}));

				if (currentProbes.length > initialProbes.value.length) {
					newProbesFound(currentProbes);
					return;
				}

				await new Promise(resolve => setTimeout(resolve, 1000));
			} catch (e: any) {
				sendErrorToast(e);
				newProbesNotFound();
				return;
			}
		}

		newProbesNotFound();
	};

	const newProbesFound = (currentProbes: Probe[]) => {
		const initialProbesIds = new Set(initialProbes.value.map(probe => probe.id));
		newProbes.value = currentProbes.filter(probe => !initialProbesIds.has(probe.id));
		isSuccess.value = true;

		const wrapper = stepPanels.value.$el;
		const currentChild = wrapper.children[Number(activeStep.value)];
		smoothResize(wrapper, currentChild, currentChild);
		emit('adopted');
	};

	const newProbesNotFound = () => {
		isFailed.value = true;
		const wrapper = stepPanels.value.$el;
		const currentChild = wrapper.children[Number(activeStep.value)];
		smoothResize(wrapper, currentChild, currentChild);
	};

	// STEP 4

	const ip = ref('');
	const isIpValid = ref(true);
	const invalidIpMessage = ref('');
	const isResendingCode = ref(false);

	const resetIsIpValid = () => {
		isIpValid.value = true;
		invalidIpMessage.value = '';
	};

	const sendAdoptionCodeLoading = ref(false);
	const sendAdoptionCode = async (activateCallback: (step: string | number) => void) => {
		const isValid = validateIp(ip.value);

		if (!isValid) {
			isIpValid.value = false;
			invalidIpMessage.value = 'Invalid IP address format';
			return;
		}

		sendAdoptionCodeLoading.value = true;

		try {
			await $directus.request(customEndpoint({
				method: 'POST',
				path: '/adoption-code/send-code',
				body: JSON.stringify({
					// If getUserFilter returned {} send admin ID.
					userId: getUserFilter('user_id').user_id?._eq || user.value.id,
					ip: ip.value,
				}),
			}));

			activateCallback('5');
		} catch (e: any) {
			const detail = e.errors ?? 'Request failed';
			isIpValid.value = false;
			invalidIpMessage.value = detail;
			isResendingCode.value = true;
		}

		sendAdoptionCodeLoading.value = false;
	};

	// STEP 5

	const code = ref('');
	const isCodeValid = ref(true);
	const invalidCodeMessage = ref('');

	const resetIsCodeValid = () => {
		isCodeValid.value = true;
		invalidCodeMessage.value = '';
	};

	const resendCode = async () => {
		code.value = '';
		resetIsCodeValid();

		try {
			await $directus.request(customEndpoint({
				method: 'POST',
				path: '/adoption-code/send-code',
				body: JSON.stringify({
					userId: getUserFilter('user_id').user_id?._eq || user.value.id,
					ip: ip.value,
				}),
			}));

			sendToast('info', 'The code has been resent', 'Paste it to the input to adopt the probe');
		} catch (e: any) {
			sendErrorToast(e);
		}
	};

	const verifyCodeLoading = ref(false);
	const verifyCode = async () => {
		verifyCodeLoading.value = true;

		try {
			const response = await $directus.request(customEndpoint({
				method: 'POST',
				path: '/adoption-code/verify-code',
				body: JSON.stringify({
					userId: getUserFilter('user_id').user_id?._eq || user.value.id,
					code: code.value.substring(0, 6),
				}),
			})) as Probe;
			newProbes.value = [ response ];
			isSuccess.value = true;

			const wrapper = stepPanels.value.$el;
			const currentChild = wrapper.children[Number(activeStep.value)];
			smoothResize(wrapper, currentChild, currentChild);

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
</script>
