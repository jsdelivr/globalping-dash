<template>
	<div class="border-t p-5 pt-7">
		<div class="flex">
			<div class="mr-2 flex w-10 flex-col">
				<div v-if="step1Completed" class="mx-auto flex size-7 items-center justify-center rounded-full bg-primary">
					<i class="pi pi-check text-surface-0"/>
				</div>
				<div v-else class="mx-auto flex size-7 items-center justify-center rounded-full border">1</div>
				<div class="mt-2 grow">
					<div class="mx-auto h-full w-px border-l" :class="{ 'border-primary': step1Completed }"/>
				</div>
			</div>
			<div class="w-full rounded-xl border p-4 pt-3">
				<h6 class="text-md text-base font-bold">Sign up</h6>
				<p class="mt-1 text-bluegray-500">
					Create a free account to help us fight abuse and get access to higher limits and extra features.
				</p>
				<div
					class="mt-1 rounded-xl p-2 max-md:p-4"
					:class="{
						'bg-surface-50 dark:bg-dark-800': !step1Completed,
						'bg-gradient-to-r from-[#F4FCF7] to-[#E5FCF6] dark:from-dark-800 dark:to-dark-800': step1Completed,
					}"
				>
					<div class="flex items-center justify-between max-sm:flex-col max-sm:text-center">
						<div class="ml-2">
							You get
							<span class="ml-1.5 whitespace-nowrap rounded-full border bg-surface-0 px-2.5 py-1.5 max-sm:leading-10 dark:bg-dark-700">
								<span class="font-bold" :class="{'text-primary': step1Completed}">500 free tests</span>
								/ hour
							</span>
						</div>
						<Button
							v-if="step1Completed"
							disabled
							severity="secondary"
							outlined
							label="Signed up"
							icon="pi pi-check"
							class="text-primary !opacity-100"
						/>
						<Button
							v-else
							label="Sign up"
							@click="auth.login"
						/>
					</div>
				</div>
			</div>
		</div>

		<div class="mt-2 flex">
			<div class="mr-2 flex w-10 flex-col">
				<div v-if="!step1Completed" class="mx-auto flex size-7 items-center justify-center rounded-full bg-surface-100 dark:bg-dark-600">
					<i class="pi pi-lock"/>
				</div>
				<div v-else-if="step2Completed" class="mx-auto flex size-7 items-center justify-center rounded-full bg-primary">
					<i class="pi pi-check text-surface-0"/>
				</div>
				<div v-else class="mx-auto flex size-7 items-center justify-center rounded-full border">2</div>
			</div>
			<div class="w-full rounded-xl p-4 pt-3" :class="{ 'cursor-not-allowed bg-surface-50 opacity-50 dark:bg-dark-800': !step1Completed, 'border': step1Completed }">
				<h6 class="text-md text-base font-bold">Host a probe</h6>
				<p class="mt-1 text-bluegray-500">
					Become a member of the community by hosting a probe. For each day your probe stays online, you will get additional free credits.
				</p>
				<div
					class="mt-1 rounded-xl bg-surface-50 p-2 max-md:p-4 dark:bg-dark-700"
					:class="{
						'border': !step1Completed,
						'bg-gradient-to-r from-[#F4FCF7] to-[#E5FCF6] dark:from-dark-800 dark:to-dark-800': step2Completed,
						'bg-surface-50 dark:bg-dark-800': !step2Completed,
					}"
				>
					<div class="flex items-center justify-between max-sm:flex-col max-sm:text-center">
						<div class="ml-2">You get <span class="ml-1.5 whitespace-nowrap rounded-full border bg-surface-0 px-2.5 py-1.5 max-sm:leading-10 dark:bg-dark-700"><span class="font-bold" :class="{'text-primary': step2Completed}">+{{ creditsPerAdoptedProbe }} credits</span> / probe / day</span></div>
						<Button
							v-if="!step1Completed"
							disabled
							severity="secondary"
							outlined
							label="Adopt a probe"
						/>
						<Button
							v-else-if="step2Completed"
							severity="secondary"
							outlined
							label="Adopt another probe"
							class="text-primary !opacity-100"
							@click="$emit('adopt-a-probe')"
						/>
						<Button
							v-else
							label="Adopt your first probe"
							@click="$emit('adopt-a-probe')"
						/>
					</div>
				</div>
			</div>
		</div>

		<div class="mt-7 flex justify-between">
			<NuxtLink to="https://globalping.io/credits" tabindex="-1" target="_blank">
				<Button label="Learn more about Globalping credits." severity="secondary" icon="pi pi-info-circle" class="mr-4"/>
			</NuxtLink>
			<Button label="Close" severity="secondary" outlined @click="$emit('cancel')"/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { readItems } from '@directus/sdk';
	import { useUserFilter } from '~/composables/useUserFilter';
	import { useAuth } from '~/store/auth';
	import { useMetadata } from '~/store/metadata';
	const { $directus } = useNuxtApp();

	const auth = useAuth();
	const metadata = useMetadata();
	const { getUserFilter } = useUserFilter();

	defineEmits([ 'cancel', 'adopt-a-probe' ]);

	const { data: adoptionsExists } = await useLazyAsyncData(
		'gp_adopted_probes_exist',
		() => auth.isLoggedIn
			? $directus.request(readItems('gp_probes', {
				filter: getUserFilter('userId'),
				limit: 1,
			}))
			: Promise.resolve([]),
		{ default: () => false, transform: data => !!data.length },
	);

	const creditsPerAdoptedProbe = metadata.creditsPerAdoptedProbe;

	const step1Completed = computed(() => auth.isLoggedIn);
	const step2Completed = computed(() => adoptionsExists.value);
</script>
