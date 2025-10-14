<template>
	<div class="p-5">
		<div class="rounded-xl bg-green-400/10 p-6 text-center">
			<p class="flex items-center justify-center text-lg font-bold">
				<i class="pi pi-verified mr-2 text-green-600"/>
				Congratulations!
			</p>
			<p class="mt-4">You are now the owner of the following {{ pluralize('probe', probes.length) }}:</p>
			<div v-for="probe in probes" :key="probe.id" class="mt-4">
				<NuxtLink :to="`/probes/${probe.id}`">
					<div class="rounded-xl border bg-surface-0 p-3 dark:border-dark-400 dark:bg-dark-800">
						<p class="flex items-center justify-center font-bold"><CountryFlag :country="probe.country" size="small"/><span class="ml-2">{{ probe.city }}</span></p>
						<p>{{ probe.network }}</p>
					</div>
				</NuxtLink>
			</div>
		</div>

		<div v-if="!auth.impersonation" class="mt-4 rounded-xl bg-surface-50 p-6 text-center dark:bg-dark-600">
			<ToggleSwitch v-model="publicProbes" :disabled="isLoading" :input-id="`public-probes-${getCurrentInstance()?.uid}`" @update:model-value="updatePublicProbes"/>
			<label :for="`public-probes-${getCurrentInstance()?.uid}`" class="block cursor-pointer font-bold">Make your probes public</label>
			<p class="mt-3 text-xs">
				When enabled, your probes are automatically tagged by
				<Tag class="text-nowrap bg-surface-0 font-normal dark:bg-dark-800" severity="secondary" :value="`u-${user.default_prefix}`"/>,
				allowing you to select them in measurements,
				and a list of your active probes is also available on your
				<NuxtLink class="font-semibold text-primary hover:underline" :to="`https://globalping.io/users/${user.default_prefix}`" target="_blank" rel="noopener">user page</NuxtLink>.
			</p>
		</div>

		<div class="mt-4 text-center">
			<p>Each probe generates credits that you can use to run more tests.<br>We also recommend you verify and correct the probe's location if needed.</p>
		</div>
		<div class="mt-7 flex justify-end">
			<Button label="Finish" @click="$emit('cancel')"/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { updateMe } from '@directus/sdk';
	import CountryFlag from 'vue-country-flag-next';
	import { useNotifications } from '~/composables/useNotifications';
	import { useAuth } from '~/store/auth';
	import { minDelay } from '~/utils/min-delay';
	import { pluralize } from '~/utils/pluralize';
	import { sendErrorToast } from '~/utils/send-toast';

	const { $directus } = useNuxtApp();
	const auth = useAuth();
	const { user } = storeToRefs(auth);
	const { updateHeaderNotifications } = useNotifications();

	defineProps({
		probes: {
			type: Array as PropType<Probe[]>,
			default: () => [],
		},
	});

	defineEmits([ 'cancel' ]);

	const publicProbes = ref(user.value.public_probes);
	const isLoading = ref(false);

	const updatePublicProbes = async () => {
		isLoading.value = true;

		try {
			await minDelay($directus.request(updateMe({
				public_probes: publicProbes.value,
			})), 500);
		} catch (e) {
			sendErrorToast(e);
		}

		await auth.refresh();
		publicProbes.value = user.value.public_probes;
		isLoading.value = false;
	};

	onMounted(async () => {
		await updateHeaderNotifications();
	});
</script>
