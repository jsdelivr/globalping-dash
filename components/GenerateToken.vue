<template>
	<div class="text-bluegray-700 border-t px-5 py-7">
		<p>Token name<i class="text-primary align-text-bottom">*</i></p>
		<InputText
			v-model="name"
			class="mt-2 w-full"
			:invalid="isNameInvalid"
			@update:model-value="resetInvalid"
		/>
		<p v-if="isNameInvalid" class="pl-1 text-red-500">Name can't be empty</p>
		<p class="mt-1 text-xs">A unique name for this token.</p>
		<p class="mt-6">Expiration</p>
		<div class="mt-2">
			<Button
				class="mr-2"
				:severity="activeExpire.unlimited ? undefined : 'secondary'"
				rounded
				@click="changeExpiration(null)"
			>
				Unlimited
			</Button>
			<Button
				class="mr-2"
				:severity="activeExpire.months1 ? undefined : 'secondary'"
				rounded
				@click="changeExpiration(1)"
			>
				1 month
			</Button>
			<Button
				class="mr-2"
				:severity="activeExpire.months3 ? undefined : 'secondary'"
				rounded
				@click="changeExpiration(3)"
			>
				3 months
			</Button>
			<Button
				class="mr-2"
				:severity="activeExpire.months6 ? undefined : 'secondary'"
				rounded
				@click="changeExpiration(6)"
			>
				6 month
			</Button>
			<Button
				class="mr-2"
				:severity="activeExpire.months12 ? undefined : 'secondary'"
				rounded
				@click="changeExpiration(12)"
			>
				1 year
			</Button>
			<Button
				class="mr-2 flex items-center"
				:severity="activeExpire.custom ? undefined : 'secondary'"
				rounded
				@click="toggleDatePanel"
			>
				{{ activeExpire.custom ? formatDate(expire) : 'Custom' }} <i class="pi pi-chevron-down ml-2"/>
			</Button>
			<OverlayPanel ref="datePanel">
				<TokenCalendar :value="expire && new Date(expire)" @change="changeDate"/>
			</OverlayPanel>
		</div>
		<div class="mt-2 text-xs">{{ expire ? `Token will expire ${formatDate(expire)}.` : 'Token will never expire.' }}</div>
		<p class="mt-6">Origins</p>
		<div class="mt-2">
			<div v-for="(origin, index) in origins" :key="index" class="mr-1 inline-block">
				<span class="bg-primary text-surface-0 flex items-center rounded-md border-0 px-1.5 py-0.5">{{ origin }}
					<Button
						icon="pi pi-times-circle"
						class="text-surface-0 focus:ring-surface-0 ml-0.5 h-6 w-4"
						severity="secondary"
						text
						aria-label="Remove origin"
						size="small"
						@click="removeOrigin(index)"
					/></span>
			</div>
		</div>
		<InputText
			v-model="newOrigin"
			class="mt-2 w-full"
			placeholder="Type an origin and press Enter"
			@keyup.enter="addOrigin"
		/>
		<p class="mt-1 text-xs">
			A list of origins which are allowed to use the token. If empty - any origin is valid. Examples of valid origins: "www.jsdelivr.com", "www.jsdelivr.com:10000".
		</p>
		<div class="mt-7 text-right">
			<Button class="mr-2" label="Cancel" severity="contrast" text @click="$emit('cancel')"/>
			<Button label="Generate token" @click="generateToken"/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { createItem, customEndpoint } from '@directus/sdk';

	// NAME

	const emit = defineEmits([ 'generate', 'cancel' ]);
	const { $directus } = useNuxtApp();

	const name = ref('');
	const isNameInvalid = ref(false);

	const resetInvalid = () => {
		isNameInvalid.value = false;
	};

	// EXPIRE

	const expire = ref<Date | null>(null);

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

	const origins = ref<string[]>([]);
	const newOrigin = ref('');

	const addOrigin = () => {
		if (!newOrigin.value) {
			return;
		}

		origins.value.push(newOrigin.value);
		newOrigin.value = '';
	};


	const removeOrigin = (index: number) => {
		origins.value.splice(index, 1);
	};

	const generateToken = async () => {
		if (!name.value) {
			isNameInvalid.value = true;
			return;
		}

		const token = await $directus.request(customEndpoint<string>({ method: 'POST', path: '/token-generator' }));

		const response = await $directus.request(createItem('gp_tokens', {
			name: name.value,
			origins: origins.value,
			expire: expire.value && expire.value.toISOString().split('T')[0],
			value: token,
		}));

		emit('generate', response.id, token);
	};
</script>
