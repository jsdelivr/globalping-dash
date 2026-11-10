<template>
	<GPDialog v-model:visible="visible" header="Set up your account" content-class="!p-0" overlay-scrollbars @after-hide="onHide">
		<p class="border-y bg-surface-50 px-6 py-5 text-center text-lg font-bold dark:border-dark-600 dark:bg-dark-800">Choose your default account</p>

		<div class="p-6">
			<div role="radiogroup" aria-label="Default account" class="grid gap-4 sm:grid-cols-2">
				<label
					v-for="card in CARDS"
					:key="card.value"
					class="group flex cursor-pointer overflow-hidden rounded-xl border ring-offset-surface-0 transition-colors has-[:disabled]:cursor-not-allowed has-[:checked]:!border-primary has-[:disabled]:opacity-60 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-2 dark:border-dark-600 dark:ring-offset-dark-700"
				>
					<input
						v-model="choice"
						type="radio"
						name="onboarding-account"
						:value="card.value"
						:disabled="isDisabled(card.value)"
						class="sr-only"
					>
					<span class="flex w-12 shrink-0 justify-center bg-surface-100 pt-5 group-has-[:checked]:bg-primary-50 max-sm:w-10 max-sm:pt-4 dark:bg-dark-800 dark:group-has-[:checked]:bg-primary-500/20">
						<span class="flex size-5 items-center justify-center rounded border border-surface-300 bg-surface-0 group-has-[:checked]:border-primary group-has-[:checked]:bg-primary dark:border-dark-500 dark:bg-dark-700">
							<i class="pi pi-check invisible text-xs text-white group-has-[:checked]:visible" aria-hidden="true"/>
						</span>
					</span>
					<span class="flex flex-col gap-2 p-5 max-sm:p-4">
						<span class="flex items-center gap-2 font-bold">
							<i :class="card.icon" class="text-bluegray-400 group-has-[:checked]:text-primary sm:!hidden" aria-hidden="true"/>{{ card.title }}
						</span>
						<span>{{ isDisabled(card.value) ? 'No GitHub organizations are available for your account.' : card.description }}</span>
						<i :class="card.icon" class="mt-auto pt-2 text-3xl text-bluegray-400 group-has-[:checked]:text-primary max-sm:!hidden" aria-hidden="true"/>
					</span>
				</label>
			</div>

			<template v-if="choice === 'personal'">
				<p class="mt-6 font-bold">Make my probes public</p>
				<div class="mt-3 flex">
					<div class="w-12">
						<ToggleSwitch v-model="publicProbes" input-id="onboarding-public-probes"/>
					</div>
					<label class="flex-1 cursor-text leading-relaxed">
						When enabled, your probes are automatically tagged by
						<Tag class="-my-1 text-nowrap bg-surface-0 font-normal dark:bg-dark-800" severity="secondary" :value="`u-${auth.user.default_prefix}`"/>,
						allowing you to select them in measurements,
						and a list of your active probes is also available on your
						<NuxtLink class="font-semibold text-primary hover:underline" :to="`https://globalping.io/users/${auth.user.default_prefix}`" target="_blank" rel="noopener">user page</NuxtLink>.
					</label>
				</div>
			</template>

			<template v-else>
				<label for="onboarding-org" class="mt-6 block font-bold">Organization</label>
				<Select
					v-model="orgId"
					input-id="onboarding-org"
					:options="memberships"
					option-label="org.name"
					option-value="org.id"
					placeholder="Select an organization"
					class="mt-2 w-full"
				>
					<template #value="{ placeholder }">
						<span v-if="membership" class="flex items-center">
							<span class="min-w-0 grow truncate">{{ membership.org.name }}</span>
							<OrgRoleTag class="ml-6" :value="capitalize(membership.role)"/>
						</span>
						<template v-else>{{ placeholder }}</template>
					</template>
					<template #option="{ option }">
						<span class="-my-0.5 min-w-0 grow truncate leading-normal">{{ option.org.name }}</span>
						<OrgRoleTag class="ml-6" :value="capitalize(option.role)"/>
					</template>
				</Select>

				<template v-if="membership?.role === 'admin'">
					<p class="mt-6 font-bold">Make the organization probes public</p>
					<div class="mt-3 flex">
						<div class="w-12">
							<ToggleSwitch v-model="orgPublicProbes" input-id="onboarding-org-public-probes"/>
						</div>
						<label class="flex-1 cursor-text leading-relaxed">
							When enabled, the organization probes are automatically tagged by
							<Tag class="-my-1 text-nowrap bg-surface-0 font-normal dark:bg-dark-800" severity="secondary" :value="`u-${membership.org.name}`"/>,
							allowing you to select them in measurements,
							and a list of the organization's active probes is also available on its
							<NuxtLink class="font-semibold text-primary hover:underline" :to="`https://globalping.io/users/${membership.org.name}`" target="_blank" rel="noopener">user page</NuxtLink>.
						</label>
					</div>

					<template v-if="showProfileFields">
						<Divider align="center" class="my-6 before:dark:!border-dark-600" :pt="{ content: { class: 'z-10 bg-surface-0 px-1 dark:bg-dark-700' } }">
							<span>Improve your public profile (optional)</span>
						</Divider>
						<OrgProfileFields
							v-model:website="website"
							v-model:description="description"
							v-model:banner="banner"
							:disabled="!!pending"
							id-prefix="onboarding"
						/>
					</template>
				</template>
			</template>

			<Message severity="secondary" icon="pi pi-info-circle" class="mt-6">
				Switch accounts any time from the account menu. Change your default account in Settings.
			</Message>

			<div class="mt-6 flex justify-end gap-2 border-t pt-4 dark:border-dark-600">
				<Button
					label="Skip"
					severity="secondary"
					text
					:loading="pending === 'skip'"
					:disabled="!!pending"
					@click="skip"/>
				<Button
					label="Save preferences"
					:loading="pending === 'apply'"
					:disabled="!!pending || !canApply"
					@click="apply"
				/>
			</div>
		</div>
	</GPDialog>
</template>

<script setup lang="ts">
	import { updateItem, updateMe } from '@directus/sdk';
	import capitalize from 'lodash/capitalize';
	import union from 'lodash/union';
	import { useAccount } from '~/store/account';
	import { useAuth } from '~/store/auth';
	import { type BannerChange, isValidWebsite, saveBanner } from '~/utils/org-profile';
	import { sendErrorToast, sendToast } from '~/utils/send-toast';

	const CARDS = [
		{ value: 'personal', title: 'Personal', description: 'Use your personal probes, credits, and tokens.', icon: 'pi pi-user' },
		{ value: 'org', title: 'Organization', description: 'Use your GitHub organization\'s probes, credits, and tokens.', icon: 'pi pi-building' },
	] as const;

	const { $directus } = useNuxtApp();
	const auth = useAuth();
	const account = useAccount();

	// Shown to GitHub users until they pick a default account.
	const needsDefaultAccount = computed(() => auth.isLoggedIn && !!auth.user.github_username && !auth.impersonation && !auth.user.default_account);
	const visible = ref(false);
	watch(needsDefaultAccount, (show) => {
		visible.value = show;
	}, { immediate: true });

	const choice = ref<'personal' | 'org'>('personal');
	const publicProbes = ref(auth.user.public_probes);

	const memberships = computed(() => [ ...auth.user.memberships ].sort((a, b) => a.org.name.localeCompare(b.org.name)));
	const isDisabled = (value: typeof choice.value) => value === 'org' && !memberships.value.length;
	const orgId = ref(memberships.value.length === 1 ? memberships.value[0]!.org.id : null);
	const membership = computed(() => memberships.value.find(({ org }) => org.id === orgId.value));
	const hasProfile = computed(() => !!(membership.value?.org.website || membership.value?.org.description || membership.value?.org.banner));

	const orgPublicProbes = ref(false);
	const website = ref('');
	const description = ref('');
	const banner = ref<BannerChange>();
	const showProfileFields = computed(() => membership.value?.role === 'admin' && orgPublicProbes.value && !hasProfile.value);

	watch(orgId, () => {
		orgPublicProbes.value = membership.value?.org.public_probes ?? false;
		website.value = '';
		description.value = '';
		banner.value = undefined;
	}, { immediate: true });

	const canApply = computed(() => choice.value === 'personal' || (!!membership.value && (!showProfileFields.value || isValidWebsite(website.value))));

	// SAVE

	const pending = ref<'apply' | 'skip' | null>(null);

	const run = async (action: NonNullable<typeof pending.value>, save: () => Promise<void>) => {
		pending.value = action;

		try {
			await save();
		} catch (e) {
			sendErrorToast(e);
		} finally {
			pending.value = null;
		}
	};

	const setDefaultAccount = async (accountId: string, changes: Partial<DirectusUser> = {}) => {
		await $directus.request(updateMe({ default_account: accountId, ...changes }));
		await auth.refresh();
		visible.value = false;
	};

	const skip = () => run('skip', () => setDefaultAccount(account.personal.id));

	// Closing the dialog in any way counts as skipping it.
	const onHide = () => {
		if (needsDefaultAccount.value && !pending.value) {
			skip();
		}
	};

	const apply = () => run('apply', async () => {
		if (choice.value === 'personal') {
			await setDefaultAccount(account.personal.id, { public_probes: publicProbes.value });
			sendToast('success', 'Preferences saved', 'Your personal account is now your default.');
			return;
		}

		const { org, role } = membership.value!;

		if (role === 'admin') {
			await Promise.all([
				$directus.request(updateItem('gp_orgs', org.id, {
					public_probes: orgPublicProbes.value,
					...showProfileFields.value && { website: website.value || null, description: description.value || null },
				})),
				saveBanner($directus, org.id, showProfileFields.value ? banner.value : undefined),
			]);
		}

		await setDefaultAccount(org.account, { selected_orgs: union(auth.user.selected_orgs, [ org.id ]) });
		await account.switchTo(org.account);
	});
</script>
