<template>
	<div class="min-h-full p-6">
		<div>
			<h1 class="page-title">Settings</h1>
		</div>
		<div class="mt-6 flex rounded-xl border bg-surface-0 p-6 max-sm:flex-col dark:bg-dark-800">
			<div class="max-sm:mb-4 sm:w-2/5">
				<h5 class="text-lg font-bold">Account details</h5>
			</div>
			<div class="grow">
				<label for="firstName" class="block font-bold">First Name</label>
				<InputText id="firstName" v-model="firstName" class="mt-2 w-full"/>

				<label for="lastName" class="mt-6 block font-bold">Last Name</label>
				<InputText id="lastName" v-model="lastName" class="mt-2 w-full"/>

				<label for="email" class="mt-6 block font-bold">Email</label>
				<InputText id="email" v-model="email" class="mt-2 w-full"/>

				<label for="username" class="mt-6 block font-bold">Username</label>
				<div class="relative mt-2">
					<Button
						severity="contrast"
						text
						label="Sync from GitHub"
						:icon="loadingIconId === 1 ? 'pi pi-sync pi-spin' : 'pi pi-sync'"
						class="!absolute right-8 top-[5px] h-6 bg-transparent !px-1 hover:bg-transparent"
						@click="syncFromGithub(1)"
					/>
					<i class="pi pi-lock absolute right-3 top-2.5 text-bluegray-500"/>
					<InputText id="username" v-model="user.github_username" disabled class="pointer-events-auto w-full cursor-text select-auto bg-transparent pr-44 dark:bg-transparent"/>
				</div>

				<label for="organizations" class="mt-6 block font-bold">Organizations</label>
				<div class="relative mt-2">
					<ReadOnlyAutoComplete
						id="tags"
						v-model="user.github_organizations"
						:pt="{
							inputMultiple: { class: 'pb-1 pr-48 min-h-10' },
						}"
					/>
					<Button
						severity="contrast"
						size="small"
						text
						label="Sync from GitHub"
						:icon="loadingIconId === 2 ? 'pi pi-sync pi-spin' : 'pi pi-sync'"
						class="!absolute right-8 top-2 h-6 bg-transparent !px-1 hover:bg-transparent"
						@click="syncFromGithub(2)"
					/>
					<i class="pi pi-lock absolute right-3 top-3 text-bluegray-500"/>
				</div>

				<label for="userType" class="mt-6 block font-bold">User type</label>
				<div class="relative mt-2">
					<i class="pi pi-lock absolute right-3 top-2.5 text-bluegray-500"/>
					<InputText id="userType" v-model="user.user_type" disabled class="pointer-events-auto w-full cursor-text select-auto bg-transparent pr-44 dark:bg-transparent"/>
				</div>
			</div>
		</div>

		<div class="mt-6 flex rounded-xl border bg-surface-0 p-6 max-sm:flex-col dark:bg-dark-800">
			<div class="max-sm:mb-4 sm:w-2/5">
				<h5 class="text-lg font-bold">Interface</h5>
			</div>
			<div class="grow">
				<p class="font-bold">Theme</p>
				<SelectButton
					v-model="appearance"
					class="mt-2"
					:options="themeOptions"
					:allow-empty="false"
					aria-labelledby="basic"
					option-label="name"
					option-value="value"
					@update:model-value="auth.setAppearance"
				>
					<template #option="slotProps">
						<i :class="slotProps.option.icon"/>
						<span>{{ slotProps.option.name }}</span>
					</template>
				</SelectButton>
			</div>
		</div>

		<div class="mt-6 flex rounded-xl border bg-surface-0 p-6 max-sm:flex-col dark:bg-dark-800">
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
		<GPDialog
			v-model:visible="deleteDialog"
			header="Delete account"
		>
			<div class="flex items-center">
				<div>
					<i class="pi pi-exclamation-triangle text-xl text-primary"/>
				</div>
				<div class="ml-3">
					<p>You are about to delete your Globalping account.</p>
					<p>Are you sure? All your data will be lost.</p>
				</div>
			</div>
			<div class="mt-7 text-right">
				<Button class="mr-2" label="Cancel" severity="secondary" text @click="deleteDialog = false"/>
				<Button label="Delete account" severity="danger" @click="deleteAccount"/>
			</div>
		</GPDialog>
	</div>
</template>

<script setup lang="ts">
	import { customEndpoint, deleteUser, updateMe } from '@directus/sdk';
	import { useAuth } from '~/store/auth';
	import { sendErrorToast, sendToast } from '~/utils/send-toast';

	useHead({
		title: 'Settings -',
	});

	const { $directus } = useNuxtApp();
	const auth = useAuth();
	const user = auth.getUser as User;

	const firstName = ref(user.first_name);
	const lastName = ref(user.last_name);
	const appearance = ref(user.appearance);
	const email = ref(user.email);

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

			lastSavedAppearance = appearance.value;

			await auth.refresh();

			sendToast('success', 'Saved', 'All settings saved');
		} catch (e) {
			sendErrorToast(e);
		}

		saveLoading.value = false;
	};

	// APPEARANCE

	let lastSavedAppearance = user.appearance;
	onUnmounted(() => auth.setAppearance(lastSavedAppearance));

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

			sendToast('success', 'Synced', 'GitHub data synced');
		} catch (e) {
			sendErrorToast(e);
		}

		loadingIconId.value = null;
	};

	// DELETE ACCOUNT

	const deleteDialog = ref(false);
	const deleteAccount = async () => {
		try {
			await $directus.request(deleteUser(user.id!));
			reloadNuxtApp();
		} catch (e) {
			sendErrorToast(e);
		}
	};
</script>
