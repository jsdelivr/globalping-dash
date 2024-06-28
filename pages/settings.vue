<template>
	<div class="flex min-h-full flex-col p-6">
		<div>
			<h1 class="col-span-2 text-2xl font-bold">Settings</h1>
		</div>
		<div class="bg-surface-0 dark:bg-dark-800 mt-6 flex rounded-xl border p-6 max-sm:flex-col">
			<div class="max-sm:mb-4 sm:w-2/5">
				<h5 class="text-lg font-bold">Account details</h5>
			</div>
			<div class="grow">
				<p class="font-bold">First Name</p>
				<InputText v-model="firstName" class="mt-2 w-full"/>
				<p class="mt-6 font-bold">Last Name</p>
				<InputText v-model="lastName" class="mt-2 w-full"/>
				<p class="mt-6 font-bold">Username</p>
				<div class="relative mt-2">
					<Button
						severity="contrast"
						text
						label="Sync from GitHub"
						:icon="{'pi pi-sync': true, 'pi-spin': loadingIconId === 1}"
						class="!absolute right-8 top-[5px] h-6 bg-transparent !px-1 hover:bg-transparent"
						@click="syncFromGithub(1)"
					/>
					<i class="pi pi-lock text-bluegray-500 absolute right-3 top-[10px]"/>
					<InputText v-model="user.github_username" disabled class="w-full bg-transparent pr-44 dark:bg-transparent"/>
				</div>
			</div>
		</div>
		<div class="bg-surface-0 dark:bg-dark-800 mt-6 flex rounded-xl border p-6 max-sm:flex-col">
			<div class="max-sm:mb-4 sm:w-2/5">
				<h5 class="text-lg font-bold">Interface</h5>
			</div>
			<div class="grow">
				<p class="font-bold">Theme</p>
				<SelectButton v-model="appearance" class="mt-2" :options="themeOptions" aria-labelledby="basic" option-value="value">
					<template #option="slotProps">
						<div class="flex items-center">
							<i :class="slotProps.option.icon"/>
							<span class="ml-1.5 font-bold">{{ slotProps.option.name }}</span>
						</div>
					</template>
				</SelectButton>
			</div>
		</div>
		<div class="bg-surface-0 dark:bg-dark-800 mt-6 flex rounded-xl border p-6 max-sm:flex-col">
			<div class="max-sm:mb-4 sm:w-2/5">
				<h5 class="text-lg font-bold">Other</h5>
			</div>
			<div class="grow">
				<p class="font-bold">Email</p>
				<InputText v-model="email" class="mt-2 w-full"/>
				<p class="mt-6 font-bold">Organizations</p>
				<div class="relative mt-2">
					<Button
						severity="contrast"
						text
						label="Sync from GitHub"
						:icon="{'pi pi-sync': true, 'pi-spin': loadingIconId === 2}"
						class="!absolute right-8 top-[5px] h-6 bg-transparent !px-1 hover:bg-transparent"
						@click="syncFromGithub(2)"
					/>
					<i class="pi pi-lock text-bluegray-500 absolute right-3 top-[10px]"/>
					<InputText v-model="organizationsString" disabled class="w-full bg-transparent pr-44 dark:bg-transparent"/>
				</div>
				<p class="mt-6 font-bold">User type</p>
				<div class="relative mt-2">
					<i class="pi pi-lock text-bluegray-500 absolute right-3 top-[10px]"/>
					<InputText v-model="user.user_type" disabled class="w-full bg-transparent pr-44 dark:bg-transparent"/>
				</div>
			</div>
		</div>
		<div class="bg-surface-0 dark:bg-dark-800 mt-6 flex rounded-xl border p-6 max-sm:flex-col">
			<div class="max-sm:mb-4 sm:w-2/5">
				<h5 class="text-lg font-bold">Data removal</h5>
			</div>
			<div class="grow">
				<p class="mb-2 font-bold max-sm:hidden">Delete account</p>
				<Button severity="secondary" outlined label="Delete account" @click="deleteDialog = true"/>
			</div>
		</div>
		<div class="mt-6 text-right">
			<Button label="Apply settings" :loading="saveLoading" @click="save"/>
		</div>
		<Dialog
			v-model:visible="deleteDialog"
			class="min-w-[700px] max-md:min-w-[95%]"
			modal
			dismissable-mask
			:draggable="false"
			header="Delete account"
		>
			<div class="flex items-center">
				<div>
					<i class="pi pi-exclamation-triangle text-primary text-xl"/>
				</div>
				<div class="ml-3">
					<p>You're about to delete your Globalping account.</p>
					<p>Are you sure you? All your data will be lost.</p>
				</div>
			</div>
			<div class="mt-7 text-right">
				<Button class="mr-2" label="Cancel" severity="contrast" text @click="deleteDialog = false"/>
				<Button label="Delete token" severity="danger" @click="deleteAccount"/>
			</div>
		</Dialog>
	</div>
</template>

<script setup lang="ts">
	import { customEndpoint, deleteUser, updateMe } from '@directus/sdk';
	import { useAuth } from '~/store/auth';

	const { $directus } = useNuxtApp();
	const toast = useToast();
	const auth = useAuth();
	const user = auth.getUser as User;

	const firstName = ref(user.first_name);
	const lastName = ref(user.last_name);
	const appearance = ref(user.appearance);
	const email = ref(user.email);
	const organizationsString = computed(() => user.github_organizations.join(', '));

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
			await $directus.request(updateMe({
				first_name: firstName.value,
				last_name: lastName.value,
				appearance: appearance.value,
				email: email.value,
			}));

			await auth.refresh();

			toast.add({ severity: 'success', summary: 'Saved', detail: 'All settings saved' });
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

			await $directus.request(updateMe({
				first_name: firstName.value,
				last_name: lastName.value,
				appearance: appearance.value,
				email: email.value,
			}));

			const response = await $directus.request(customEndpoint<{
				github_username: string;
				github_organizations: string[];
			}>({ method: 'POST', path: '/sync-github-data', body: JSON.stringify({ userId: user.id }) }));

			user.github_username = response.github_username;
			user.github_organizations = response.github_organizations;

			await auth.refresh();

			toast.add({ severity: 'success', summary: 'Synced', detail: 'GitHub data synced', life: 4000 });
		} catch (e: any) {
			const detail = e.errors?.[0]?.message ?? e.errors ?? e.message ?? 'Request failed';
			toast.add({ severity: 'error', summary: 'Sync failed', detail, life: 20000 });
		}

		loadingIconId.value = null;
	};

	// DELETE ACCOUNT

	const deleteDialog = ref(false);
	const deleteAccount = async () => {
		try {
			await $directus.request(deleteUser(user.id!));
			reloadNuxtApp();
		} catch (e: any) {
			const detail = e.errors?.[0]?.message ?? e.errors ?? e.message ?? 'Request failed';
			toast.add({ severity: 'error', summary: 'Sync failed', detail, life: 20000 });
		}
	};
</script>
