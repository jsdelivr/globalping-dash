<template>
	<div class="bg-surface-50 flex min-h-full flex-col p-6">
		<div>
			<h1 class="col-span-2 text-2xl font-bold">Settings</h1>
		</div>
		<div class="bg-surface-0 mt-6 flex rounded-xl border p-6 max-sm:flex-col">
			<div class="max-sm:mb-4 sm:w-2/5">
				<h5 class="text-lg font-bold">Account details</h5>
			</div>
			<div class="grow">
				<p class="font-bold">First Name</p>
				<InputText v-model="me.first_name" class="mt-2 w-full"/>
				<p class="mt-6 font-bold">Last Name</p>
				<InputText v-model="me.last_name" class="mt-2 w-full"/>
				<p class="mt-6 font-bold">Username</p>
				<div class="relative mt-2">
					<Button
						severity="contrast"
						text
						label="Sync from GitHub"
						:icon="{'pi pi-sync': true, 'pi-spin': loadingIconId === 1}"
						class="!bg-surface-0 !absolute right-8 top-[5px] h-6 !px-1"
						@click="syncFromGithub(1)"
					/>
					<i class="pi pi-lock text-bluegray-500 absolute right-3 top-[10px]"/>
					<InputText v-model="me.github_username" disabled class="!bg-surface-0 w-full pr-44"/>
				</div>
			</div>
		</div>
		<div class="bg-surface-0 mt-6 flex rounded-xl border p-6 max-sm:flex-col">
			<div class="max-sm:mb-4 sm:w-2/5">
				<h5 class="text-lg font-bold">Interface</h5>
			</div>
			<div class="grow">
				<p class="font-bold">Theme</p>
				<SelectButton v-model="me.appearance" class="mt-2" :options="themeOptions" aria-labelledby="basic" option-value="value">
					<template #option="slotProps">
						<div class="flex items-center">
							<i :class="slotProps.option.icon"/>
							<span class="ml-1.5 font-bold">{{ slotProps.option.name }}</span>
						</div>
					</template>
				</SelectButton>
			</div>
		</div>
		<div class="bg-surface-0 mt-6 flex rounded-xl border p-6 max-sm:flex-col">
			<div class="max-sm:mb-4 sm:w-2/5">
				<h5 class="text-lg font-bold">Other</h5>
			</div>
			<div class="grow">
				<p class="font-bold">Email</p>
				<InputText v-model="me.email" class="mt-2 w-full"/>
				<p class="mt-6 font-bold">Organizations</p>
				<div class="relative mt-2">
					<Button
						severity="contrast"
						text
						label="Sync from GitHub"
						:icon="{'pi pi-sync': true, 'pi-spin': loadingIconId === 2}"
						class="!bg-surface-0 !absolute right-8 top-[5px] h-6 !px-1"
						@click="syncFromGithub(2)"
					/>
					<i class="pi pi-lock text-bluegray-500 absolute right-3 top-[10px]"/>
					<InputText v-model="organizationsString" disabled class="!bg-surface-0 w-full pr-44"/>
				</div>
				<p class="mt-6 font-bold">User type</p>
				<div class="relative mt-2">
					<i class="pi pi-lock text-bluegray-500 absolute right-3 top-[10px]"/>
					<InputText v-model="me.user_type" disabled class="!bg-surface-0 w-full pr-44"/>
				</div>
			</div>
		</div>
		<div class="bg-surface-0 mt-6 flex rounded-xl border p-6 max-sm:flex-col">
			<div class="max-sm:mb-4 sm:w-2/5">
				<h5 class="text-lg font-bold">Data removal</h5>
			</div>
			<div class="grow">
				<p class="mb-2 font-bold max-sm:hidden">Delete account</p>
				<Button severity="secondary" outlined label="Delete account" @click="deleteAccount"/>
			</div>
		</div>
		<div class="mt-6 text-right">
			<Button label="Apply settings" :loading="saveLoading" @click="save"/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { customEndpoint, deleteUser, readMe, updateMe } from '@directus/sdk';
	import { useAuth } from '~/store/auth';

	const { $directus } = useNuxtApp();
	const toast = useToast();
	const auth = useAuth();

	const { data: me } = await useLazyAsyncData('me', () => {
		return $directus.request(readMe());
	}, {
		default: () => ({
			id: null,
			first_name: '',
			last_name: '',
			email: '',
			github_username: '',
			github_organizations: [],
			user_type: '',
			appearance: null,
		}),
	});

	const organizationsString = computed(() => me.value.github_organizations.join(', '));

	const themeOptions = [
		{ name: 'Auto', value: null, icon: 'pi pi-cog' },
		{ name: 'Light', value: 'light', icon: 'pi pi-sun' },
		{ name: 'Dark', value: 'dark', icon: 'pi pi-moon' },
	];

	// SAVE

	const saveLoading = ref(false);
	const save = async () => {
		saveLoading.value = true;

		try {
			const response = await $directus.request(updateMe({
				first_name: me.value.first_name,
				last_name: me.value.last_name,
				appearance: me.value.appearance,
				email: me.value.email,
			}));

			me.value = response;

			await auth.refresh();

			toast.add({ severity: 'success', summary: 'Saved', detail: 'All settings saved', life: 4000 });
		} catch (e: any) {
			const detail = e.errors?.[0]?.message ?? e.errors ?? e.message ?? 'Request failed';
			toast.add({ severity: 'error', summary: 'Regeneration failed', detail, life: 20000 });
		}

		saveLoading.value = false;
	};

	// SYNC WITH GITHUB

	const loadingIconId = ref<number | null>(null);
	const syncFromGithub = async (id: number) => {
		try {
			loadingIconId.value = id;
			const response = await $directus.request(customEndpoint<{
				github_username: string;
				github_organizations: string[];
			}>({ method: 'POST', path: '/sync-github-data', body: JSON.stringify({ userId: me.value.id }) }));

			me.value.github_username = response.github_username;
			me.value.github_organizations = response.github_organizations;

			await auth.refresh();

			toast.add({ severity: 'success', summary: 'Synced', detail: 'GitHub data synced', life: 4000 });
		} catch (e: any) {
			const detail = e.errors?.[0]?.message ?? e.errors ?? e.message ?? 'Request failed';
			toast.add({ severity: 'error', summary: 'Sync failed', detail, life: 20000 });
		}

		loadingIconId.value = null;
	};

	// DELETE ACCOUNT

	const deleteAccount = async () => {
		try {
			await $directus.request(deleteUser(me.value.id!));
			reloadNuxtApp();
		} catch (e: any) {
			const detail = e.errors?.[0]?.message ?? e.errors ?? e.message ?? 'Request failed';
			toast.add({ severity: 'error', summary: 'Sync failed', detail, life: 20000 });
		}
	};
</script>
