<template>
	<div class="p-5">
		<div class="rounded-xl bg-green-400/10 p-6 text-center">
			<p class="flex items-center justify-center text-lg font-bold">
				<i class="pi pi-verified mr-2 text-green-600"/>
				Congratulations!
			</p>
			<p class="mt-4">You are now the owner of the following probe:</p>
			<div v-for="probe in probes" :key="probe.id" class="mt-4 rounded-xl border bg-surface-0 p-3 dark:border-dark-400 dark:bg-dark-800">
				<p class="flex items-center justify-center font-bold"><CountryFlag :country="probe.country" size="small"/><span class="ml-2">{{ probe.city }}</span></p>
				<p>{{ probe.network }}</p>
			</div>
		</div>
		<div v-if="!user.public_probes" class="mt-4 rounded-xl bg-surface-50 p-6 text-center">
			<ToggleSwitch v-model="publicProbes" :input-id="`public-probes-${getCurrentInstance()?.uid}`"/>
			<label :for="`public-probes-${getCurrentInstance()?.uid}`" class="block cursor-pointer font-bold">Make your probes public</label>
			<p class="mt-3 text-xs">If enabled, your probes will be automatically tagged by <Tag class="text-nowrap bg-surface-0 font-normal dark:bg-dark-800" severity="secondary" :value="`u-${user.github_username}`"/>, allowing you to select them in measurements. A list of your active probes will also be available at <NuxtLink class="font-semibold text-primary hover:underline" :to="`https://globalping.io/users/${user.github_username}`" target="_blank" rel="noopener">https://globalping.io/users/{{ user.github_username }}</NuxtLink> (once this feature is live).</p>
		</div>
		<div class="mt-4 text-center">
			<p>The probe will generate credits that you can use to run more tests. We also recommend you verify and correct the probe's location.</p>
			<p class="mt-3">Probe can be found on the <NuxtLink rel="noopener" target="_blank" class="font-bold" to="/probes">adopted probes</NuxtLink> page.</p>
		</div>
		<div class="mt-7 flex justify-end">
			<Button label="Finish" @click="() => { updatePublicProbes(); $emit('cancel'); }"/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { updateMe } from '@directus/sdk';
	import CountryFlag from 'vue-country-flag-next';
	import { useAuth } from '~/store/auth';

	useHead({
		title: 'Credits -',
	});

	const { $directus } = useNuxtApp();
	const auth = useAuth();
	const user = auth.getUser;

	defineProps({
		probes: {
			type: Array as PropType<Probe[]>,
			default: () => [],
		},
	});

	defineEmits([ 'cancel' ]);

	const publicProbes = ref(user.public_probes);
	const updatePublicProbes = async () => {
		if (publicProbes.value === user.public_probes) {
			return;
		}

		await $directus.request(updateMe({
			public_probes: publicProbes.value,
		}));

		await auth.refresh();
	};
</script>
