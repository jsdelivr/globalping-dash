<template>
	<div class="border-t px-5 py-7 text-bluegray-700 dark:text-surface-0">
		<label for="tokenName">Token name<i class="align-text-bottom text-primary">*</i></label>
		<InputText
			id="tokenName"
			v-model="name"
			class="mt-2 w-full"
			:invalid="isNameInvalid"
			@update:model-value="resetInvalid"
		/>
		<p v-if="isNameInvalid" class="pl-1 text-red-500">Name can't be empty</p>
		<p class="mt-1 text-xs text-bluegray-400">A unique name for this token.</p>
		<p class="mt-6">Expiration</p>
		<div class="mt-2">
			<Button
				class="mb-2 mr-2"
				:severity="activeExpire.unlimited ? undefined : 'secondary'"
				rounded
				@click="changeExpiration(null)"
			>
				Unlimited
			</Button>
			<Button
				class="mb-2 mr-2"
				:severity="activeExpire.months1 ? undefined : 'secondary'"
				rounded
				@click="changeExpiration(1)"
			>
				1 month
			</Button>
			<Button
				class="mb-2 mr-2"
				:severity="activeExpire.months3 ? undefined : 'secondary'"
				rounded
				@click="changeExpiration(3)"
			>
				3 months
			</Button>
			<Button
				class="mb-2 mr-2"
				:severity="activeExpire.months6 ? undefined : 'secondary'"
				rounded
				@click="changeExpiration(6)"
			>
				6 month
			</Button>
			<Button
				class="mb-2 mr-2"
				:severity="activeExpire.months12 ? undefined : 'secondary'"
				rounded
				@click="changeExpiration(12)"
			>
				1 year
			</Button>
			<Button
				class="mb-2 mr-2 flex items-center"
				:severity="activeExpire.custom ? undefined : 'secondary'"
				rounded
				@click="toggleDatePanel"
			>
				{{ activeExpire.custom ? formatDate(expire) : 'Custom' }} <i class="pi pi-chevron-down ml-2"/>
			</Button>
			<Popover ref="datePanel">
				<TokenCalendar :value="expire && new Date(expire)" @change="changeDate"/>
			</Popover>
		</div>
		<div class="text-xs text-bluegray-400">{{ expire ? `Token will expire ${formatDate(expire)}.` : 'Token will never expire.' }}</div>
		<label for="origins" class="mt-6 block">Origins</label>
		<AutoComplete
			id="origins"
			v-model="origins"
			class="mt-2"
			remove-token-icon="pi pi-times"
			multiple
			:typeahead="false"
			:pt="{ inputChip: { id: 'token-details-origins-input-wrapper' }, chipItem: 'my-1' }"
			:pt-options="{ mergeProps: true }"
			@update:model-value="updateOrigins"
			@blur="onAutoCompleteBlur"
		/>
		<p class="mt-1 text-xs text-bluegray-400">
			A list of origins which are allowed to use the token. If empty, any origin is valid.
			Examples of valid origins: "https://www.jsdelivr.com", "https://www.jsdelivr.com:10000".
		</p>
		<div v-if="token" class="mt-7 text-right">
			<Button class="mr-2" label="Cancel" severity="secondary" text @click="$emit('cancel')"/>
			<Button
				class="mr-2"
				severity="info"
				label="Regenerate token"
				:loading="regenerateTokenLoading"
				@click="regenerateToken"
			/>
			<Button label="Save" :loading="updateTokenLoading" @click="updateToken"/>
		</div>
		<div v-else class="mt-7 text-right">
			<Button class="mr-2" label="Cancel" severity="secondary" text @click="$emit('cancel')"/>
			<Button label="Generate token" :loading="generateTokenLoading" @click="generateToken"/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { createItem, customEndpoint, updateItem } from '@directus/sdk';
	import { formatDate } from '~/utils/date-formatters';
	import { sendErrorToast, sendToast } from '~/utils/send-toast';

	const props = defineProps({
		token: {
			type: Object as PropType<Token | null>,
			default: () => null,
		},
	});

	const emit = defineEmits([ 'generate', 'cancel', 'save', 'regenerate' ]);

	const { $directus } = useNuxtApp();

	// NAME

	const name = ref(props.token?.name || '');
	const isNameInvalid = ref(false);

	const resetInvalid = () => {
		isNameInvalid.value = false;
	};

	// EXPIRE

	const expire = ref<Date | null>(props.token?.expire ? new Date(props.token.expire) : null);

	const activeExpire = computed(() => {
		const unlimited = !expire.value;
		const months1 = isMonthsAgo(expire.value, 1);
		const months3 = isMonthsAgo(expire.value, 3);
		const months6 = isMonthsAgo(expire.value, 6);
		const months12 = isMonthsAgo(expire.value, 12);
		const custom = !(unlimited || months1 || months3 || months6 || months12);
		return { unlimited, months1, months3, months6, months12, custom };
	});

	const isMonthsAgo = (expireDate: Date | null, numberOfMonths: number) => {
		if (!expireDate) {
			return false;
		}

		const buttonDate = new Date();
		buttonDate.setMonth(buttonDate.getMonth() + numberOfMonths);
		return expireDate.toISOString().split('T')[0] === buttonDate.toISOString().split('T')[0];
	};

	const changeExpiration = (numberOfMonths: number | null) => {
		if (numberOfMonths === null) {
			expire.value = null;
		} else {
			const date = new Date();
			date.setMonth(date.getMonth() + numberOfMonths);
			expire.value = date;
		}
	};

	const datePanel = ref();
	const toggleDatePanel = (event: Event) => {
		datePanel.value.toggle(event);
	};

	const changeDate = (date: Date | null) => {
		expire.value = date;
		datePanel.value.hide();
	};

	// ORIGINS

	const origins = ref<string[]>(props.token?.origins ? [ ...props.token.origins ] : []);
	const updateOrigins = (value: string[]) => {
		origins.value = value.filter(v => !!v);
	};

	const onAutoCompleteBlur = (event: Event) => {
		const input = event?.target as HTMLInputElement | null;

		if (input?.value) {
			origins.value.push(input.value);
			input.value = '';
		}
	};

	let inputElem: HTMLInputElement | null;
	const inputChangeValueHandler = () => {
		if (!inputElem || !inputElem.value) {
			return;
		} else if (inputElem.value === ',') {
			inputElem.value = '';
			return;
		}

		if (inputElem.value.endsWith(',') && inputElem.value.replaceAll(',', '')) {
			origins.value.push(inputElem.value.replaceAll(',', ''));
			inputElem.value = '';
		}
	};

	onMounted(() => {
		inputElem = document.querySelector<HTMLInputElement>('#token-details-origins-input-wrapper input');
		inputElem && inputElem.addEventListener('input', inputChangeValueHandler);
	});

	onUnmounted(() => {
		inputElem && inputElem.removeEventListener('input', inputChangeValueHandler);
	});

	// ACTIONS

	const generateTokenLoading = ref(false);
	const generateToken = async () => {
		if (!name.value) {
			isNameInvalid.value = true;
			return;
		}

		generateTokenLoading.value = true;

		try {
			const token = await $directus.request(customEndpoint<string>({ method: 'POST', path: '/bytes' }));

			const response = await $directus.request(createItem('gp_tokens', {
				name: name.value,
				origins: origins.value,
				expire: expire.value && expire.value.toISOString().split('T')[0],
				value: token,
			}));

			emit('generate', response.id, token);
		} catch (e) {
			sendErrorToast(e);
		}

		regenerateTokenLoading.value = false;
	};

	const updateTokenLoading = ref(false);
	const updateToken = async () => {
		if (!name.value) {
			isNameInvalid.value = true;
			return;
		}

		updateTokenLoading.value = true;

		try {
			await $directus.request(updateItem('gp_tokens', props.token!.id, {
				name: name.value,
				origins: origins.value,
				expire: expire.value && expire.value.toISOString().split('T')[0],
			}));

			sendToast('success', 'Done', 'Token info was successfully updated');

			emit('save');
		} catch (e) {
			sendErrorToast(e);
		}

		updateTokenLoading.value = false;
	};

	const regenerateTokenLoading = ref(false);
	const regenerateToken = async () => {
		if (!name.value) {
			isNameInvalid.value = true;
			return;
		}

		regenerateTokenLoading.value = true;

		try {
			const token = await $directus.request(customEndpoint<string>({ method: 'POST', path: '/bytes' }));

			const response = await $directus.request(updateItem('gp_tokens', props.token!.id, {
				name: name.value,
				origins: origins.value,
				expire: expire.value && expire.value.toISOString().split('T')[0],
				value: token,
			}));

			sendToast('success', 'Done', 'Token was successfully regenerated');

			emit('regenerate', response.id, token);
		} catch (e) {
			sendErrorToast(e);
		}

		regenerateTokenLoading.value = false;
	};
</script>
