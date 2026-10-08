<template>
	<div class="min-h-full p-4 sm:p-6">
		<h1 class="page-title">Organization</h1>

		<div class="mt-6 flex rounded-xl border bg-surface-0 p-4 max-sm:flex-col sm:p-6 dark:bg-dark-800">
			<div class="max-sm:mb-4 sm:w-2/5 sm:pr-6">
				<h5 class="text-lg font-bold">General</h5>
			</div>
			<div class="grow sm:w-3/5">
				<label for="org-adoption-token" class="flex items-center font-bold">
					Probe adoption token <i v-tooltip.top="'Allows adopting probes into the organization by setting the GP_ADOPTION_TOKEN environment variable.'" class="pi pi-info-circle ml-2"/>
				</label>
				<div class="relative mt-2">
					<Button
						severity="contrast"
						text
						label="Regenerate"
						:icon="regenerating ? 'pi pi-sync pi-spin' : 'pi pi-sync'"
						class="!absolute right-8 top-[5px] h-6 bg-transparent !px-1 hover:bg-transparent"
						:disabled="!!auth.impersonation"
						@click="regenerateAdoptionToken"
					/>
					<i class="pi pi-lock absolute right-3 top-2.5 text-bluegray-500"/>
					<InputText id="org-adoption-token" v-model="adoptionToken" disabled class="pointer-events-auto w-full cursor-text select-auto bg-transparent pr-44 dark:bg-transparent"/>
					<CopyOnClick :content="adoptionToken">
						<div class="absolute left-0 top-0 h-full w-[calc(100%-176px)] cursor-pointer"/>
					</CopyOnClick>
				</div>

				<p class="mt-6 font-bold">Make the organization probes public</p>
				<div class="mt-3 flex">
					<div class="w-12">
						<ToggleSwitch v-model="publicProbes" input-id="org-public-probes"/>
					</div>
					<label for="org-public-probes" class="flex-1 cursor-pointer text-sm text-bluegray-500 dark:text-bluegray-300">
						When enabled, the organization probes are automatically tagged by
						<Tag class="text-nowrap bg-surface-0 font-normal dark:bg-dark-800" severity="secondary" :value="`u-${account.current.name}`"/>,
						allowing you to select them in measurements, and a list of the active probes is also available on the
						<NuxtLink class="font-semibold text-primary hover:underline" :to="`https://globalping.io/users/${account.current.name}`" target="_blank" rel="noopener">organization page</NuxtLink>.
					</label>
				</div>

				<div class="mt-6 text-right">
					<Button label="Apply settings" :loading="saveLoading" :disabled="!isSettingsDirty || !!auth.impersonation" @click="saveSettings"/>
				</div>
			</div>
		</div>

		<div v-if="extraAdoptionTokens.length" class="mt-6 flex rounded-xl border bg-surface-0 p-4 max-sm:flex-col sm:p-6 dark:bg-dark-800">
			<div class="max-sm:mb-4 sm:w-2/5 sm:pr-6">
				<h5 class="text-lg font-bold">Extra adoption tokens</h5>
				<p class="mt-2 text-sm text-bluegray-500 dark:text-bluegray-300">Previous personal adoption tokens of members who moved their probes into the organization. Probes started with them are adopted into the organization.</p>
			</div>
			<div class="grow sm:w-3/5">
				<ul class="flex flex-col gap-2">
					<li v-for="extraToken in extraAdoptionTokens" :key="extraToken.token" class="flex items-center gap-3 rounded-lg border bg-surface-50 px-4 py-3 dark:border-dark-600 dark:bg-dark-700">
						<span class="min-w-0 truncate font-semibold" :title="extraToken.github_username">{{ extraToken.github_username }}</span>
						<code class="text-sm text-bluegray-500 dark:text-bluegray-300">{{ maskToken(extraToken.token) }}</code>
						<Button
							class="ml-auto shrink-0"
							label="Remove"
							size="small"
							severity="secondary"
							outlined
							:disabled="!!auth.impersonation"
							@click="confirm({
								header: `Remove ${extraToken.github_username}'s adoption token?`,
								message: [ 'Probes started with the adoption token of ', { bold: extraToken.github_username }, ' will no longer be adopted into the organization.' ],
								label: 'Remove',
								danger: true,
								action: () => removeExtraAdoptionToken(extraToken),
							})"
						/>
					</li>
				</ul>
			</div>
		</div>

		<div v-if="redirects.length" class="mt-6 flex rounded-xl border bg-surface-0 p-4 max-sm:flex-col sm:p-6 dark:bg-dark-800">
			<div class="max-sm:mb-4 sm:w-2/5 sm:pr-6">
				<h5 class="text-lg font-bold">Credits redirect</h5>
				<p class="mt-2 text-sm text-bluegray-500 dark:text-bluegray-300">Sponsorship credits redirected from or to this organization.</p>
			</div>
			<div class="grow sm:w-3/5">
				<ul class="flex flex-col gap-2">
					<li v-for="redirect in redirects" :key="redirect.source.githubId" class="flex items-center gap-3 rounded-lg border bg-surface-50 px-4 py-3 dark:border-dark-600 dark:bg-dark-700">
						<span class="min-w-0 truncate font-semibold">{{ redirect.source.name }}</span>
						<i class="pi pi-arrow-right text-sm text-bluegray-400"/>
						<span class="min-w-0 truncate font-semibold">{{ redirect.target.name }}</span>
						<Button
							class="ml-auto shrink-0"
							label="Clear"
							size="small"
							severity="secondary"
							outlined
							:disabled="!!auth.impersonation"
							@click="confirm({
								header: 'Clear the credits redirect?',
								message: [ 'Sponsorship credits of ', { bold: redirect.source.name }, ' will no longer be added to ', { bold: redirect.target.name }, '.' ],
								label: 'Clear redirect',
								danger: true,
								action: () => clearRedirect(redirect),
							})"
						/>
					</li>
				</ul>
			</div>
		</div>

		<h2 class="page-title mt-12">
			Members <span v-if="members.length" class="font-normal text-bluegray-500 dark:text-bluegray-300">· {{ members.length }}</span>
		</h2>
		<p class="mt-4 xl:w-1/2">Role changes apply immediately. Admins manage the organization, members can use its credits, and viewers can only see it.</p>
		<DataTable
			:value="members"
			:loading="membersLoading"
			:paginator="members.length > MEMBERS_PER_PAGE"
			:rows="MEMBERS_PER_PAGE"
			data-key="id"
			class="mt-6"
		>
			<Column header="Member" class="max-w-0">
				<template #body="{ data }">
					<div class="flex min-w-0 items-center gap-1">
						<span class="truncate font-semibold" :title="data.github_username">{{ data.github_username }}</span>
						<span v-if="data.id === ownMembershipId" class="shrink-0 text-bluegray-500 dark:text-bluegray-300">(you)</span>
					</div>
				</template>
			</Column>
			<Column header="Role" class="w-1/2">
				<template #body="{ data }">
					<span v-if="data.id === ownMembershipId" v-tooltip.top="'You can\'t change your own role'" class="inline-flex h-[2.125rem] items-center px-3">{{ roleLabel(data.role) }}</span>
					<Select
						v-else
						:key="`${data.id}-${roleSelectsRevision}`"
						:model-value="data.role"
						:options="ROLES"
						option-label="label"
						option-value="value"
						:disabled="!!auth.impersonation || updatingMemberId === data.id"
						:aria-label="`Role of ${data.github_username}`"
						class="w-32 sm:w-44"
						@update:model-value="(role: Membership['role']) => changeRole(data, role)"
					/>
				</template>
			</Column>
			<template #empty>
				<p>No members to show.</p>
			</template>
		</DataTable>

		<GPDialog v-model:visible="confirmationVisible" :header="confirmation?.header">
			<div class="flex items-start gap-4">
				<i class="pi pi-exclamation-triangle mt-0.5 text-xl" :class="confirmation?.danger ? 'text-red-500 dark:text-red-400' : 'text-primary'"/>
				<div>
					<p>
						<template v-for="(part, index) in confirmation?.message" :key="index">
							<span v-if="typeof part === 'string'">{{ part }}</span>
							<span v-else class="font-bold">{{ part.bold }}</span>
						</template>
					</p>
					<p v-if="confirmation?.note" class="mt-2 text-sm text-bluegray-500 dark:text-bluegray-300">{{ confirmation.note }}</p>
				</div>
			</div>
			<div class="mt-6 text-right">
				<Button class="mr-2" label="Cancel" severity="secondary" text @click="confirmationVisible = false"/>
				<Button :label="confirmation?.label" :severity="confirmation?.danger ? 'danger' : undefined" :loading="confirming" @click="runConfirmation"/>
			</div>
		</GPDialog>
	</div>
</template>

<script setup lang="ts">
	import { customEndpoint, readItems, updateItem } from '@directus/sdk';
	import { useErrorToast } from '~/composables/useErrorToast';
	import { useFormDirty } from '~/composables/useFormDirty';
	import { useAccount } from '~/store/account';
	import { useAuth } from '~/store/auth';
	import { sendErrorToast, sendToast } from '~/utils/send-toast';

	type OrgMember = { id: string; role: Membership['role']; github_username: string | null };
	type Confirmation = {
		header: string;
		message: (string | { bold: string })[];
		note?: string;
		label: string;
		danger?: boolean;
		action: () => Promise<void> | void;
	};

	const MEMBERS_PER_PAGE = 10;
	const ROLES: { value: Membership['role']; label: string }[] = [
		{ value: 'admin', label: 'Admin' },
		{ value: 'member', label: 'Member' },
		{ value: 'viewer', label: 'Viewer' },
	];

	definePageMeta({
		middleware: () => useAccount().canManageOrg ? undefined : navigateTo('/'),
	});

	useHead({
		title: 'Organization -',
	});

	const { $directus } = useNuxtApp();
	const auth = useAuth();
	const account = useAccount();

	const orgId = account.current.org_id!;
	const ownMembershipId = auth.user.memberships.find(({ org }) => org.id === orgId)?.id;

	const roleRank = (role: Membership['role']) => ROLES.findIndex(({ value }) => value === role);
	const roleLabel = (role: Membership['role']) => ROLES[roleRank(role)]?.label;
	const maskToken = (token: string) => `${token.slice(0, 6)}••••${token.slice(-4)}`;

	// CONFIRMATION

	const confirmation = ref<Confirmation | null>(null);
	const confirmationVisible = ref(false);
	const confirming = ref(false);

	const confirm = (value: Confirmation) => {
		confirmation.value = value;
		confirmationVisible.value = true;
	};

	const runConfirmation = async () => {
		confirming.value = true;

		try {
			await confirmation.value?.action();
			confirmationVisible.value = false;
		} catch (e) {
			sendErrorToast(e);
		}

		confirming.value = false;
	};

	// Selects are re-created by bumping their key, which resets them to the member's saved role.
	const roleSelectsRevision = ref(0);

	// SETTINGS

	const adoptionToken = ref(account.current.adoption_token ?? '');
	const publicProbes = ref(account.current.public_probes);
	const isSettingsDirty = computed(() => adoptionToken.value !== account.current.adoption_token || publicProbes.value !== account.current.public_probes);

	const resetFormDirty = useFormDirty(null, () => isSettingsDirty.value);

	const regenerating = ref(false);
	const regenerateAdoptionToken = async () => {
		regenerating.value = true;

		try {
			adoptionToken.value = await $directus.request(customEndpoint<string>({ method: 'POST', path: '/bytes' }));
		} catch (e) {
			sendErrorToast(e);
		}

		regenerating.value = false;
	};

	const saveLoading = ref(false);
	const saveSettings = async () => {
		saveLoading.value = true;

		try {
			await $directus.request(updateItem('gp_orgs', orgId, {
				public_probes: publicProbes.value,
				// Adoption token values are generated on BE and stored there for a limited time, so the token is sent only when it changed.
				...adoptionToken.value !== account.current.adoption_token ? { adoption_token: adoptionToken.value } : {},
			}));

			await auth.refresh();
			resetFormDirty();
			sendToast('success', 'Saved', 'Organization settings saved');
		} catch (e) {
			sendErrorToast(e);
		}

		saveLoading.value = false;
	};

	// EXTRA ADOPTION TOKENS

	const extraAdoptionTokens = computed(() => account.current.extra_adoption_tokens);

	const removeExtraAdoptionToken = async (removed: ExtraAdoptionToken) => {
		await $directus.request(updateItem('gp_orgs', orgId, {
			extra_adoption_tokens: extraAdoptionTokens.value.filter(({ token }) => token !== removed.token),
		}));

		await auth.refresh();
		sendToast('success', 'Removed', `The adoption token of ${removed.github_username} was removed`);
	};

	// CREDITS REDIRECT

	const { data: redirects, error: redirectsError, refresh: refreshRedirects } = await useLazyAsyncData(
		'organization-credits-redirect',
		() => $directus.request<{ redirects: CreditsRedirect[] }>(customEndpoint({
			method: 'GET',
			path: '/transfer-data/credits-redirect',
			params: { accountId: account.current.id },
		})),
		{ default: () => [], transform: ({ redirects }) => redirects },
	);

	const clearRedirect = async ({ source, target }: CreditsRedirect) => {
		await $directus.request(customEndpoint({
			method: 'DELETE',
			path: '/transfer-data/credits-redirect',
			body: JSON.stringify({ accountId: account.current.id, source: source.githubId, target: target.githubId }),
		}));

		await refreshRedirects();
		sendToast('success', 'Cleared', 'The credits redirect was cleared');
	};

	// MEMBERS

	const { data: members, pending: membersLoading, error: membersError } = await useLazyAsyncData(
		'organization-members',
		() => $directus.request<OrgMember[]>(readItems('gp_org_members', {
			filter: { org: { id: { _eq: orgId } } },
			// github_username is added to every row by the gp_org_members read hook.
			fields: [ 'id', 'role' ],
			limit: -1,
		})),
		{
			default: () => [],
			transform: rows => rows.sort((a, b) => roleRank(a.role) - roleRank(b.role) || (a.github_username ?? '').localeCompare(b.github_username ?? '')),
		},
	);

	useErrorToast(redirectsError, membersError);

	const updatingMemberId = ref<string | null>(null);

	const updateRole = async (member: OrgMember, role: Membership['role']) => {
		updatingMemberId.value = member.id;

		try {
			await $directus.request(updateItem('gp_org_members', member.id, { role }));
			member.role = role;
			sendToast('success', 'Saved', `${member.github_username} is now ${role === 'admin' ? 'an' : 'a'} ${role}`);
		} finally {
			updatingMemberId.value = null;
			roleSelectsRevision.value++;
		}
	};

	const githubAdminNote = (member: OrgMember) => `If ${member.github_username} is an admin of the organization on GitHub, they'll become an admin again on their next sign-in.`;

	const changeRole = (member: OrgMember, role: Membership['role']) => {
		if (role === 'viewer') {
			roleSelectsRevision.value++;

			confirm({
				header: `Change ${member.github_username} to viewer?`,
				message: [{ bold: member.github_username ?? '' }, ' will lose access to the organization credits. Their tokens and app approvals in this organization will be deleted. This can\'t be undone.' ],
				note: member.role === 'admin' ? githubAdminNote(member) : undefined,
				label: 'Change to viewer',
				danger: true,
				action: () => updateRole(member, role),
			});

			return;
		}

		if (member.role === 'admin') {
			roleSelectsRevision.value++;

			confirm({
				header: `Change ${member.github_username} to member?`,
				message: [ githubAdminNote(member) ],
				label: 'Change to member',
				action: () => updateRole(member, role),
			});

			return;
		}

		updateRole(member, role).catch(sendErrorToast);
	};
</script>
