<template>
	<div class="flex min-h-full flex-col p-6">
		<div>
			<!-- TODO: P3: this and most likely other elements should use custom classes, e.g. page-title -->
			<!-- https://tailwindcss.com/docs/adding-custom-styles#adding-component-classes -->
			<h1 class="col-span-2 text-2xl font-bold">Settings</h1>
		</div>
		<div class="bg-surface-0 dark:bg-dark-800 mt-6 flex rounded-xl border p-6 max-sm:flex-col">
			<div class="max-sm:mb-4 sm:w-2/5">
				<h5 class="text-lg font-bold">Account details</h5>
			</div>
			<div class="grow">
				<label for="firstName" class="block font-bold">First Name</label>
				<InputText id="firstName" v-model="firstName" class="mt-2 w-full"/>
				<label for="lastName" class="mt-6 block font-bold">Last Name</label>
				<InputText id="lastName" v-model="lastName" class="mt-2 w-full"/>
				<label for="username" class="mt-6 block font-bold">Username</label>
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
					<InputText id="username" v-model="user.github_username" disabled class="w-full bg-transparent pr-44 dark:bg-transparent"/>
				</div>
			</div>
		</div>
		<div class="bg-surface-0 dark:bg-dark-800 mt-6 flex rounded-xl border p-6 max-sm:flex-col">
			<div class="max-sm:mb-4 sm:w-2/5">
				<h5 class="text-lg font-bold">Interface</h5>
			</div>
			<div class="grow">
				<!-- TODO: P3: can we automatically "preview" the theme when I click a button here without saving? the setting should revert when I leave the page/reload -->
				<p class="font-bold">Theme</p>
				<SelectButton
					v-model="appearance"
					class="mt-2"
					:options="themeOptions"
					aria-labelledby="basic"
					option-value="value"
				>
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
				<label for="email" class="block font-bold">Email</label>
				<InputText id="email" v-model="email" class="mt-2 w-full"/>
				<!-- TODO: P2: let's use a "tag-like" design here, like we have for token origins -->
				<!-- should also resolve issues with overflows by breaking it up into several lines when there are many values -->
				<label for="organizations" class="mt-6 block font-bold">Organizations</label>
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
					<InputText id="organizations" v-model="organizationsString" disabled class="w-full bg-transparent pr-44 dark:bg-transparent"/>
				</div>
				<label for="userType" class="mt-6 block font-bold">User type</label>
				<div class="relative mt-2">
					<i class="pi pi-lock text-bluegray-500 absolute right-3 top-[10px]"/>
					<InputText id="userType" v-model="user.user_type" disabled class="w-full bg-transparent pr-44 dark:bg-transparent"/>
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
		<!-- TODO: P3: we have many of these in the same style, might be worth to wrap in our own component (possibly same applies to other components). -->
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
					<p>You are about to delete your Globalping account.</p>
					<p>Are you sure? All your data will be lost.</p>
				</div>
			</div>
			<div class="mt-7 text-right">
				<Button class="mr-2" label="Cancel" severity="secondary" text @click="deleteDialog = false"/>
				<Button label="Delete account" severity="danger" @click="deleteAccount"/>
			</div>
		</Dialog>
	</div>
</template>

<script setup lang="ts">
	import { customEndpoint, deleteUser, updateMe } from '@directus/sdk';
	import { useAuth } from '~/store/auth';
	import { sendToast } from '~/utils/send-toast';

	useHead({
		title: 'Settings -',
	});

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

			toast.add({ severity: 'success', summary: 'Saved', detail: 'All settings saved', life: 4000 });
		} catch (e) {
			sendToast(e);
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
		} catch (e) {
			sendToast(e);
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
			sendToast(e);
		}
	};
</script>
