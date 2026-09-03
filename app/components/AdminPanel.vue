<template>
	<div class="flex flex-col gap-4 rounded-xl p-4 sm:p-6">
		<p class="text-sm font-semibold">Admin mode</p>
		<div class="flex items-center justify-between gap-2">
			<p>Show data of all users.</p>
			<ToggleSwitch v-model="auth.adminMode"/>
		</div>
		<Divider class="!my-0"/>
		<p class="text-sm font-semibold">User impersonation</p>
		<div v-if="impersonation?.impersonatedUser" class="rounded-lg border bg-surface-50 dark:border-table-border dark:bg-dark-800">
			<div class="relative p-3 pr-11">
				<p class="mb-1 text-xs font-semibold text-surface-500">Directus ID</p>
				<div class="min-h-7">
					<p class="break-all font-mono text-sm leading-7">{{ impersonation.impersonatedUser.id }}</p>
					<CopyButton :content="impersonation.impersonatedUser.id" class="!right-3 !top-1/2 size-7 -translate-y-1/2 [&>button]:!size-full [&>button]:!p-0"/>
				</div>
			</div>
			<div class="relative border-t p-3 pr-11 dark:border-table-border">
				<p class="mb-1 text-xs font-semibold text-surface-500">GitHub ID</p>
				<div class="min-h-7">
					<p class="break-all font-mono text-sm leading-7">{{ impersonation.impersonatedUser.external_identifier || 'Unavailable' }}</p>
					<CopyButton v-if="impersonation.impersonatedUser.external_identifier" :content="impersonation.impersonatedUser.external_identifier" class="!right-3 !top-1/2 size-7 -translate-y-1/2 [&>button]:!size-full [&>button]:!p-0"/>
				</div>
			</div>
		</div>
		<div v-if="!impersonation" class="flex items-center justify-between gap-2">
			<InputText v-model="impersonateUsername" placeholder="Enter username" class="w-full" @keydown.enter="checkImpersonation"/>
		</div>
		<Button
			v-if="!impersonation"
			:disabled="impersonationLoading"
			:loading="impersonationLoading"
			@click="checkImpersonation"
		>
			<i v-if="impersonationLoading" class="pi pi-spin pi-spinner"/>
			<span v-else>Apply</span>
		</Button>
		<div v-if="impersonationError" class="text-red-500">{{ impersonationError }}</div>
		<div v-if="impersonationList.length > 1" class="flex flex-col gap-2">
			<p class="text-sm font-semibold">Select a user to impersonate:</p>
			<div v-for="item in impersonationList" :key="item.id" class="flex items-center justify-between gap-2">
				<p>{{ item.first_name }} {{ item.last_name }}</p>
				<Button text rounded @click="applyImpersonation(item)">
					Apply
				</Button>
			</div>
		</div>

		<Button v-if="impersonation" severity="danger" @click="clearImpersonation">
			Stop impersonation
		</Button>
	</div>
</template>

<script setup lang="ts">
	import { customEndpoint } from '@directus/sdk';
	import { useAuth } from '~/store/auth';

	const auth = useAuth();
	const { adminMode, impersonation } = storeToRefs(auth);
	const { $directus } = useNuxtApp();

	const impersonateUsername = ref(impersonation.value?.github_username || '');
	const impersonationError = ref('');
	const impersonationLoading = ref(false);
	const impersonationList = ref<User[]>([]);

	// ADMIN
	watch([ adminMode ], () => {
		if (adminMode.value) {
			impersonateUsername.value = '';
			impersonation.value = null;
		}

		auth.storeAdminConfig();
		window.location.reload();
	});

	const checkImpersonation = async () => {
		impersonationError.value = '';
		impersonationList.value = [];

		try {
			if (!auth.isAdmin) {
				throw new Error('You are not authorized to impersonate users');
			}

			if (!impersonateUsername.value) {
				throw new Error('Please enter a username to impersonate');
			}

			impersonationLoading.value = true;
			const users = await $directus.request<User[]>(customEndpoint({
				method: 'GET',
				path: '/users',
				params: {
					filter: {
						github_username: { _eq: impersonateUsername.value },
					},
				},
			}));

			if (!users.length) {
				throw new Error('User not found');
			}

			impersonationList.value = users as (User & { github_username: string })[];

			if (impersonationList.value.length === 1) {
				applyImpersonation(impersonationList.value[0]!);
			}
		} catch (error) {
			console.error('Error during impersonation:', error instanceof Error ? error.message : 'Unknown error');
			impersonationError.value = error instanceof Error ? error.message : 'An unknown error occurred';
		} finally {
			impersonationLoading.value = false;
		}
	};

	const applyImpersonation = (user: User) => {
		auth.impersonate(user);
	};

	const clearImpersonation = () => {
		auth.clearImpersonation();
		impersonationList.value = [];
		impersonateUsername.value = '';
	};
</script>
