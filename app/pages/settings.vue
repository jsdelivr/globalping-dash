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
					Organizations <i v-tooltip.top="'You must either be a public member or your organization must allow access for the Globalping app to appear here.'" class="pi pi-info-circle ml-2"/>
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
						@click="syncFromGithub(2).then(() => showOrgsInfoMessage = true)"
					/>
					<i class="pi pi-lock absolute right-3 top-3 text-bluegray-500"/>
				</div>

				<Message v-if="showOrgsInfoMessage" severity="info" class="mt-2" icon="pi pi-info-circle">
					If your organization is still missing, make sure you're either a public member, or the organization allows access for the
					<NuxtLink to="https://github.com/settings/connections/applications/Ov23liiVFaDD1BIemPkx" class="hover:underline" target="_blank" rel="noopener">Globalping app</NuxtLink>.
				</Message>

				<template v-if="defaultAccountOptions.length > 1">
					<label for="defaultAccount" class="mt-6 flex items-center font-bold">
						Default account <i v-tooltip.top="'The account the dashboard opens in when you sign in. You can switch accounts any time from the account menu.'" class="pi pi-info-circle ml-2"/>
					</label>
					<Select
						v-model="defaultAccount"
						input-id="defaultAccount"
						aria-label="Default account"
						:options="defaultAccountOptions"
						option-label="label"
						option-value="value"
						class="mt-2 w-full"
					>
						<template #value="{ value }">
							<span class="flex items-baseline">
								<span class="grow">{{ optionOf(value)?.label }}</span>
								<span class="ml-4 text-sm leading-none">{{ optionOf(value)?.role }}</span>
							</span>
						</template>
						<template #option="{ option }">
							<span class="grow">{{ option.label }}</span>
							<span class="ml-4 text-sm">{{ option.role }}</span>
						</template>
					</Select>
				</template>

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

				<template v-if="user.default_prefix !== user.github_username">
					<label for="defaultPrefix" class="mt-6 flex items-center font-bold">
						Default tag prefix <i v-tooltip.top="'To use an organization prefix instead, migrate your probes to that organization.'" class="pi pi-info-circle ml-2"/>
					</label>
					<Select
						id="defaultPrefix"
						v-model="defaultPrefix"
						:options="[user.default_prefix, user.github_username]"
						class="mt-2 w-full"
					/>
					<Message v-if="publicProbes && defaultPrefix !== user.default_prefix" severity="warn" icon="pi pi-exclamation-triangle" class="mt-2">
						Changing the default prefix will update your public tag from
						<Tag class="text-nowrap bg-surface-0 font-normal dark:bg-dark-800" severity="secondary" :value="`u-${user.default_prefix}`"/>
						to
						<Tag class="text-nowrap bg-surface-0 font-normal dark:bg-dark-800" severity="secondary" :value="`u-${defaultPrefix}`"/> on all probes.
						Other existing tags won't change unless you update them in the probe settings.
					</Message>
				</template>
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
							<NuxtLink class="font-semibold text-primary hover:underline" :to="`https://globalping.io/users/${defaultPrefix}`" target="_blank" rel="noopener">user page</NuxtLink>.
							To use your organization tag instead, migrate probes to the organization in the panel below.
						</label>
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
				<h5 class="text-lg font-bold">Notifications</h5>
			</div>
			<div class="grow sm:w-3/5">
				<template v-if="notificationAccountOptions.length > 1">
					<label for="notificationAccount" class="flex items-center font-bold">
						Account <i v-tooltip.top="'Each selected organization you are an admin of has its own notification settings.'" class="pi pi-info-circle ml-2"/>
					</label>
					<Select
						v-model="notificationAccount"
						input-id="notificationAccount"
						aria-label="Notifications account"
						:options="notificationAccountOptions"
						option-label="label"
						option-value="value"
						class="mb-6 mt-2 w-full"
					/>
				</template>
				<div
					v-for="(notificationType, notificationTypeId, index) in notificationTypes"
					:key="notificationTypeId"
					:class="{ 'mt-6': index > 0 }"
				>
					<p class="font-bold">{{ notificationType.description }}</p>
					<div class="mt-2 flex items-center gap-4">
						<div class="flex items-center gap-2">
							<ToggleSwitch
								v-if="notificationPreferences[notificationTypeId]"
								v-model="notificationPreferences[notificationTypeId].enabled"
								:disabled="!!auth.impersonation || notificationType.readOnly"
								@update:model-value="(enabled) => !enabled && (notificationPreferences[notificationTypeId]!.emailEnabled = false)"
							/>
							<label class="cursor-text text-nowrap">App</label>
						</div>
						<div v-if="notificationType.sendEmail" class="flex items-center gap-2">
							<ToggleSwitch
								v-if="notificationPreferences[notificationTypeId]"
								v-model="notificationPreferences[notificationTypeId].emailEnabled"
								:disabled="!!auth.impersonation"
								@update:model-value="(enabled) => enabled && (notificationPreferences[notificationTypeId]!.enabled = true)"
							/>
							<label class="cursor-text text-nowrap">Email</label>
						</div>
					</div>
					<div v-if="notificationType.hasParameter" class="mt-3 flex items-center gap-2">
						<label class="cursor-text text-nowrap">Threshold:</label>
						<InputText
							v-if="notificationPreferences[notificationTypeId]"
							:model-value="notificationPreferences[notificationTypeId].parameter"
							:disabled="!!auth.impersonation || !notificationPreferences[notificationTypeId].enabled"
							inputmode="numeric"
							pattern="[0-9]*"
							class="max-w-48"
							@beforeinput="restrictToDigits"
							@update:model-value="(value) => notificationPreferences[notificationTypeId]!.parameter = String(value ?? '').replace(/\D+/g, '')"
						/>
					</div>
				</div>
			</div>
		</div>

		<SettingsMigrateToOrg/>

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
			<Button label="Apply settings" :loading="saveLoading" :disabled="!!auth.impersonation || Object.keys(notificationTypes).length === 0" @click="save"/>
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
	import { customEndpoint, updateItem, updateMe } from '@directus/sdk';
	import capitalize from 'lodash/capitalize';
	import { useErrorToast } from '~/composables/useErrorToast';
	import { useFormDirty } from '~/composables/useFormDirty';
	import { useAccount } from '~/store/account';
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

	const account = useAccount();
	const defaultAccountOptions = computed(() => [
		{ label: account.personal.name, value: account.personal.id, role: 'Personal' },
		...account.selectedOrgs.map(({ org, role }) => ({ label: org.name, value: org.account, role: capitalize(role) })),
	]);
	const optionOf = (value: string) => defaultAccountOptions.value.find(option => option.value === value);
	const savedDefaultAccount = () => defaultAccountOptions.value.some(({ value }) => value === user.value.default_account) ? user.value.default_account : account.personal.id;
	const defaultAccount = ref(savedDefaultAccount());

	const { data: notificationTypes, error: notificationTypesError, status: notificationTypesStatus } = useLazyAsyncData(
		'settings-notification-types',
		() => $directus.request<NotificationTypes>(customEndpoint({
			method: 'GET',
			path: '/metadata/notification-types',
		})),
		{ default: () => ({}) as NotificationTypes },
	);

	useErrorToast(notificationTypesError);

	type EditablePreferences = Record<string, { enabled: boolean; emailEnabled?: boolean; parameter?: string }>;

	const adminMemberships = computed(() => account.selectedOrgs.filter(({ role }) => role === 'admin'));
	const notificationAccountOptions = computed(() => [
		{ label: `${account.personal.name} (personal)`, value: account.personal.id },
		...adminMemberships.value.map(({ org }) => ({ label: org.name, value: org.account })),
	]);
	const notificationAccount = ref(account.canManageOrg ? account.current.id : account.personal.id);
	const accountsNotificationPreferences = ref<Record<string, EditablePreferences>>({});
	const notificationPreferences = computed(() => accountsNotificationPreferences.value[notificationAccount.value] ?? {});
	const showOrgsInfoMessage = ref(false);
	let initialNotificationPreferences: Record<string, string> = {};

	const resetFormDirty = useFormDirty({
		firstName: user.value.first_name,
		lastName: user.value.last_name,
		appearance: user.value.appearance,
		email: user.value.email,
		publicProbes: user.value.public_probes,
		defaultPrefix: user.value.default_prefix,
	}, (current) => {
		return firstName.value !== current.firstName
			|| lastName.value !== current.lastName
			|| appearance.value !== current.appearance
			|| email.value !== current.email
			|| publicProbes.value !== current.publicProbes
			|| defaultPrefix.value !== current.defaultPrefix
			|| defaultAccount.value !== savedDefaultAccount()
			|| adoptionToken.value !== user.value.adoption_token
			|| Object.keys(accountsNotificationPreferences.value).some(isNotificationPreferencesChanged);
	});

	// A probe transfer replaces the adoption token outside of this form.
	watch(() => user.value.adoption_token, (token) => {
		adoptionToken.value = token;
	});

	// The default account can also be set from the "Add organization" dialog.
	watch(() => user.value.default_account, () => {
		defaultAccount.value = savedDefaultAccount();
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
				notification_preferences: normalizeNotificationPreferences(account.personal.id),
				...defaultAccount.value !== savedDefaultAccount() ? { default_account: defaultAccount.value } : {},
				// Adoption token values are generated on BE and stored there for a limited time. So we are sending 'adoption_token' only if it is really changed.
				...user.value.adoption_token !== adoptionToken.value ? { adoption_token: adoptionToken.value } : {},
			}));

			lastSavedAppearance = appearance.value;

			await Promise.all(adminMemberships.value
				.filter(({ org }) => isNotificationPreferencesChanged(org.account))
				.map(({ id, org }) => $directus.request(updateItem('gp_org_members', id, { notification_preferences: normalizeNotificationPreferences(org.account) }))));

			initialNotificationPreferences = serializeAllNotificationPreferences();

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

	// NOTIFICATION PREFERENCES

	watch([ notificationTypesStatus, adminMemberships ], ([ s ]) => {
		if (s !== 'success') { return; }

		const savedPreferences = [
			[ account.personal.id, user.value.notification_preferences ] as const,
			...adminMemberships.value.map(({ org, notification_preferences }) => [ org.account, notification_preferences ] as const),
		].filter(([ accountId ]) => !accountsNotificationPreferences.value[accountId]);

		for (const [ accountId, preferences ] of savedPreferences) {
			accountsNotificationPreferences.value[accountId] = buildNotificationPreferences(preferences);
			initialNotificationPreferences[accountId] = JSON.stringify(normalizeNotificationPreferences(accountId));
		}
	}, { immediate: true });

	// This builds an object to send to the backend.
	function normalizeNotificationPreferences (accountId: string) {
		const preferences = accountsNotificationPreferences.value[accountId];

		return Object.fromEntries(Object.keys(notificationTypes.value).sort().map((type) => {
			const normalizedPreference: NotificationPreference = { enabled: notificationTypes.value[type]!.readOnly || preferences?.[type]?.enabled !== false };

			if (notificationTypes.value[type]!.sendEmail) {
				normalizedPreference.emailEnabled = preferences?.[type]?.emailEnabled !== false;
			}

			if (notificationTypes.value[type]!.hasParameter) {
				const parameter = preferences?.[type]?.parameter?.trim();

				if (parameter && /^\d+$/.test(parameter)) {
					normalizedPreference.parameter = Number.parseInt(parameter, 10);
				}
			}

			return [ type, normalizedPreference ];
		}));
	}

	function serializeAllNotificationPreferences () {
		return Object.fromEntries(Object.keys(accountsNotificationPreferences.value).map(accountId => [ accountId, JSON.stringify(normalizeNotificationPreferences(accountId)) ]));
	}

	function isNotificationPreferencesChanged (accountId: string) {
		return JSON.stringify(normalizeNotificationPreferences(accountId)) !== initialNotificationPreferences[accountId];
	}

	function restrictToDigits (event: InputEvent) {
		if (event.inputType.startsWith('delete')) {
			return;
		}

		if (event.data && /\D/.test(event.data)) {
			event.preventDefault();
		}
	}

	// This builds an object to use and edit by the form UI.
	function buildNotificationPreferences (savedPreferences: Record<string, NotificationPreference> | null) {
		const userPreferences = savedPreferences ?? {};
		const allDisabled = areAllDisabled(userPreferences);
		const allEmailDisabled = areAllEmailsDisabled(userPreferences);

		// Here we are fulfilling default values.
		const preferences = Object.fromEntries(Object.keys(notificationTypes.value)
			.map(type => [ type, {
				enabled: notificationTypes.value[type]!.readOnly || !allDisabled,
				emailEnabled: notificationTypes.value[type]!.sendEmail ? !(allDisabled || allEmailDisabled) : undefined,
				parameter: notificationTypes.value[type]!.hasParameter ? String(notificationTypes.value[type]!.defaultParameter) : undefined,
			}])) as EditablePreferences;

		// Here we are overriding default values with user preferences.
		for (const [ type, preference ] of Object.entries(userPreferences).filter(([ type ]) => type in preferences)) {
			preferences[type]!.enabled = notificationTypes.value[type]?.readOnly || preference.enabled;
			!preferences[type]!.enabled && (preferences[type]!.emailEnabled = false);

			if (typeof preference?.emailEnabled === 'boolean') {
				preferences[type]!.emailEnabled = preference.emailEnabled;
			}

			if (notificationTypes.value[type]?.hasParameter && Number.isInteger(preference.parameter)) {
				preferences[type]!.parameter = String(preference.parameter);
			}
		}

		return preferences;
	}

	function areAllDisabled (notificationPreferences: Record<string, NotificationPreference>): boolean {
		const configurable = Object.keys(notificationPreferences).filter(type => notificationTypes.value[type]?.readOnly !== true);
		return configurable.length > 0 && configurable.every(type => !notificationPreferences[type]!.enabled);
	}

	function areAllEmailsDisabled (notificationPreferences: Record<string, NotificationPreference>): boolean {
		const configured = Object.values(notificationPreferences).filter(preference => typeof preference.emailEnabled === 'boolean');
		return configured.length > 0 && configured.every(preference => preference.emailEnabled === false);
	}
</script>
