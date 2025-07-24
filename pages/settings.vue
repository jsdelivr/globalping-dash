<template>
	<div class="min-h-full p-4 sm:p-6">
		<div>
			<h1 class="page-title">Settings</h1>
		</div>
		<div class="mt-6 flex rounded-xl border bg-surface-0 p-4 max-sm:flex-col sm:p-6 dark:bg-dark-800">
			<div class="max-sm:mb-4 sm:w-2/5">
				<h5 class="text-lg font-bold">Account details</h5>
			</div>
			<div class="grow sm:w-3/5">
				<label for="firstName" class="block font-bold">First name</label>
				<InputText id="firstName" v-model="firstName" class="mt-2 w-full"/>

				<label for="lastName" class="mt-6 block font-bold">Last name</label>
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
						:disabled="!!auth.impersonation"
						@click="syncFromGithub(1)"
					/>
					<i class="pi pi-lock absolute right-3 top-2.5 text-bluegray-500"/>
					<InputText id="username" v-model="user.github_username" disabled class="pointer-events-auto w-full cursor-text select-auto bg-transparent pr-44 dark:bg-transparent"/>
				</div>

				<label for="organizations" class="mt-6 flex items-center font-bold">
					Organizations <i v-tooltip.top="'You must be a public member for the organization to appear here.'" class="pi pi-info-circle ml-2"/>
				</label>
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
						:disabled="!!auth.impersonation"
						@click="syncFromGithub(2)"
					/>
					<i class="pi pi-lock absolute right-3 top-3 text-bluegray-500"/>
				</div>

				<label for="defaultPrefix" class="mt-6 flex items-center font-bold">
					Default tag prefix <i v-tooltip.top="'Your probe tags will have this prefix by default, but you can adjust it for each tag in the probe settings.'" class="pi pi-info-circle ml-2"/>
				</label>
				<Select
					id="defaultPrefix"
					v-model="defaultPrefix"
					:options="[user.github_username, ...user.github_organizations]"
					class="mt-2 w-full"
					:scroll-height="'200px'"
				/>
				<Message v-if="publicProbes && defaultPrefix !== user.default_prefix" severity="warn" icon="pi pi-exclamation-triangle" class="mt-2">
					Changing the default prefix will update your user tag from
					<Tag class="text-nowrap bg-surface-0 font-normal dark:bg-dark-800" severity="secondary" :value="`u-${user.default_prefix}`"/>
					to
					<Tag class="text-nowrap bg-surface-0 font-normal dark:bg-dark-800" severity="secondary" :value="`u-${defaultPrefix}`"/> on all probes.
					Other existing tags won't change unless you update them in the probe settings.
				</Message>

				<label for="userType" class="mt-6 block font-bold">User type</label>
				<div class="relative mt-2">
					<i class="pi pi-lock absolute right-3 top-2.5 text-bluegray-500"/>
					<InputText id="userType" v-model="user.user_type" disabled class="pointer-events-auto w-full cursor-text select-auto bg-transparent pr-44 dark:bg-transparent"/>
				</div>

				<label for="adoption-token" class="mt-6 flex items-center font-bold">
					Probe adoption token <i v-tooltip.top="'Allows adopting probes by simply setting an GP_ADOPTION_TOKEN environment variable.'" class="pi pi-info-circle ml-2"/>
				</label>
				<div class="relative mt-2">
					<Button
						severity="contrast"
						text
						label="Regenerate"
						:icon="loadingIconId === 3 ? 'pi pi-sync pi-spin' : 'pi pi-sync'"
						class="!absolute right-8 top-[5px] h-6 bg-transparent !px-1 hover:bg-transparent"
						:disabled="!!auth.impersonation"
						@click="regenerateAdoptionToken(3)"
					/>
					<i class="pi pi-lock absolute right-3 top-2.5 text-bluegray-500"/>
					<InputText id="adoption-token" v-model="adoptionToken" disabled class="pointer-events-auto w-full cursor-text select-auto bg-transparent pr-44 dark:bg-transparent"/>
					<CopyOnClick :content="adoptionToken">
						<div class="absolute left-0 top-0 h-full w-[calc(100%-176px)] cursor-pointer"/>
					</CopyOnClick>
				</div>
			</div>
		</div>

		<div class="mt-6 flex rounded-xl border bg-surface-0 p-4 max-sm:flex-col sm:p-6 dark:bg-dark-800">
			<div class="max-sm:mb-4 sm:w-2/5">
				<h5 class="text-lg font-bold">Privacy</h5>
			</div>
			<div class="grow sm:w-3/5">
				<p class="font-bold">Make my probes public</p>

				<div class="mt-3 flex">
					<div class="w-12">
						<ToggleSwitch v-model="publicProbes"/>
					</div>

					<div class="flex-1">
						<label class="cursor-text">
							When enabled, your probes are automatically tagged by
							<Tag class="text-nowrap bg-surface-0 font-normal dark:bg-dark-800" severity="secondary" :value="`u-${defaultPrefix}`"/>,
							allowing you to select them in measurements,
							and a list of your active probes is also available on your
							<NuxtLink class="font-semibold text-primary hover:underline" :to="`https://globalping.io/users/${defaultPrefix}`" target="_blank" rel="noopener">user page</NuxtLink>.</label>
					</div>
				</div>
			</div>
		</div>

		<div class="mt-6 flex rounded-xl border bg-surface-0 p-4 max-sm:flex-col sm:p-6 dark:bg-dark-800">
			<div class="max-sm:mb-4 sm:w-2/5">
				<h5 class="text-lg font-bold">Interface</h5>
			</div>
			<div class="grow sm:w-3/5">
				<p class="font-bold">Theme</p>
				<SelectButton
					v-model="selectedTheme"
					class="mt-2"
					:options="themeOptions"
					:allow-empty="false"
					aria-labelledby="basic"
					option-label="name"
					option-value="value"
					:disabled="!!auth.impersonation"
					@update:model-value="() => auth.setAppearance(appearance)"
				>
					<template #option="slotProps">
						<i :class="slotProps.option.icon"/>
						<span>{{ slotProps.option.name }}</span>
					</template>
				</SelectButton>
			</div>
		</div>

		<div class="mt-6 flex rounded-xl border bg-surface-0 p-4 max-sm:flex-col sm:p-6 dark:bg-dark-800">
			<div class="max-sm:mb-4 sm:w-2/5">
				<h5 class="text-lg font-bold">Data removal</h5>
			</div>
			<div class="grow sm:w-3/5">
				<p class="mb-2 font-bold max-sm:hidden">Delete account</p>
				<Button severity="secondary" outlined label="Delete account" :disabled="!!auth.impersonation" @click="deleteDialog = true"/>
			</div>
		</div>
		<div class="mt-6 text-right">
			<Button label="Apply settings" :loading="saveLoading" :disabled="!!auth.impersonation" @click="save"/>
		</div>
		<GPDialog
			v-model:visible="deleteDialog"
			header="Delete account"
		>
			<div class="flex items-center gap-4">
				<div>
					<i class="pi pi-exclamation-triangle text-xl text-red-500 dark:text-red-400"/>
				</div>
				<div>
					<p>You are about to delete your Globalping account.</p>
					<p>Are you sure? All your data will be lost.</p>
				</div>
			</div>
			<div class="mt-6 text-right">
				<Button class="mr-2" label="Cancel" severity="secondary" text @click="deleteDialog = false"/>
				<Button label="Delete account" severity="danger" @click="deleteAccount"/>
			</div>
		</GPDialog>
	</div>
</template>

<script setup lang="ts">
	import { customEndpoint, updateMe } from '@directus/sdk';
	import { useFormDirty } from '~/composables/useFormDirty';
	import { useAuth } from '~/store/auth';
	import { sendErrorToast, sendToast } from '~/utils/send-toast';

	useHead({
		title: 'Settings -',
	});

	const { $directus } = useNuxtApp();
	const auth = useAuth();
	const { user } = storeToRefs(auth);
	const firstName = ref(user.value.first_name);
	const lastName = ref(user.value.last_name);
	const selectedTheme = ref<'auto' | 'dark' | 'light'>(user.value.appearance ?? 'auto');
	const appearance = computed(() => selectedTheme.value === 'auto' ? null : selectedTheme.value);
	const email = ref(user.value.email);
	const publicProbes = ref(user.value.public_probes);
	const defaultPrefix = ref(user.value.default_prefix);
	const adoptionToken = ref(user.value.adoption_token);

	const resetFormDirty = useFormDirty({
		firstName: user.value.first_name,
		lastName: user.value.last_name,
		appearance: user.value.appearance,
		email: user.value.email,
		publicProbes: user.value.public_probes,
		defaultPrefix: user.value.default_prefix,
		adoptionToken: user.value.adoption_token,
	}, (current) => {
		return firstName.value !== current.firstName
			|| lastName.value !== current.lastName
			|| appearance.value !== current.appearance
			|| email.value !== current.email
			|| publicProbes.value !== current.publicProbes
			|| defaultPrefix.value !== current.defaultPrefix
			|| adoptionToken.value !== current.adoptionToken;
	});

	const themeOptions = [
		{ name: 'Auto', value: 'auto', icon: 'pi pi-cog' },
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
				public_probes: publicProbes.value,
				default_prefix: defaultPrefix.value,
				// Adoption token values are generated on BE and stored there for a limited time. So we are sending 'adoption_token' only if it is really changed.
				...user.value.adoption_token !== adoptionToken.value ? { adoption_token: adoptionToken.value } : {},
			}));

			lastSavedAppearance = appearance.value;

			await auth.refresh();

			sendToast('success', 'Saved', 'All settings saved');
			resetFormDirty();
		} catch (e) {
			sendErrorToast(e);
		}

		saveLoading.value = false;
	};

	// APPEARANCE

	let lastSavedAppearance = user.value.appearance;
	onUnmounted(() => auth.setAppearance(lastSavedAppearance));

	// SYNC WITH GITHUB

	const loadingIconId = ref<number | null>(null);
	const syncFromGithub = async (iconId: number) => {
		try {
			loadingIconId.value = iconId;

			await $directus.request(updateMe({
				first_name: firstName.value,
				last_name: lastName.value,
				appearance: appearance.value,
				email: email.value,
				public_probes: publicProbes.value,
			}));

			const response = await $directus.request(customEndpoint<{
				github_username: string;
				github_organizations: string[];
			}>({ method: 'POST', path: '/sync-github-data', body: JSON.stringify({ userId: user.value.id }) }));

			user.value.github_username = response.github_username;
			user.value.github_organizations = response.github_organizations;

			await auth.refresh();

			sendToast('success', 'Synced', 'GitHub data synced');
		} catch (e) {
			sendErrorToast(e);
		}

		loadingIconId.value = null;
	};

	// REGENERATE ADOPTION TOKEN

	const regenerateAdoptionToken = async (iconId: number) => {
		try {
			loadingIconId.value = iconId;

			const token = await $directus.request(customEndpoint<string>({ method: 'POST', path: '/bytes' }));
			adoptionToken.value = token;
		} catch (e) {
			sendErrorToast(e);
		}

		loadingIconId.value = null;
	};

	// DELETE ACCOUNT

	const deleteDialog = ref(false);
	const deleteAccount = async () => {
		try {
			await auth.deleteAccount();
		} catch (e) {
			sendErrorToast(e);
		}
	};
</script>
