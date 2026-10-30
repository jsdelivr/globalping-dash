<template>
	<p class="mb-4">The organizations you pick here appear in the "Act as organization" menu. Your organizations come from GitHub and are updated every time you sign in.</p>

	<DataTable v-if="auth.user.memberships.length" :value="auth.user.memberships" data-key="id" class="mb-2">
		<Column header="Organization">
			<template #body="{ data }">
				<span class="flex items-center gap-2">
					{{ data.org.name }}
					<Tag v-if="isDefault(data)" value="Default" severity="secondary" class="text-xs font-normal"/>
				</span>
			</template>
		</Column>
		<Column header="Role">
			<template #body="{ data }">{{ capitalize(data.role) }}</template>
		</Column>
		<Column class="w-px">
			<template #body="{ data }">
				<div class="flex items-center justify-end gap-2 whitespace-nowrap">
					<button
						v-if="isSelected(data) && !isDefault(data)"
						type="button"
						class="mr-2 text-sm text-bluegray-600 hover:underline disabled:cursor-default disabled:no-underline disabled:opacity-60 dark:text-bluegray-300"
						:disabled="!!savingDefaultOrgId || !!auth.impersonation"
						@click="makeDefault(data)"
					>
						Make default
					</button>
					<Button
						:label="isSelected(data) ? 'Remove' : 'Add'"
						:severity="isSelected(data) ? 'secondary' : undefined"
						:outlined="isSelected(data)"
						:loading="savingOrgId === data.org.id"
						:disabled="!!savingOrgId || !!auth.impersonation"
						@click="toggle(data)"
					/>
				</div>
			</template>
		</Column>
	</DataTable>
	<p v-else class="mb-2 font-semibold">You are not a member of any organization on GitHub.</p>
</template>

<script setup lang="ts">
	import { updateMe } from '@directus/sdk';
	import capitalize from 'lodash/capitalize';
	import xor from 'lodash/xor';
	import { useAccount } from '~/store/account';
	import { useAuth } from '~/store/auth';
	import { sendErrorToast } from '~/utils/send-toast';

	const { $directus } = useNuxtApp();
	const auth = useAuth();
	const account = useAccount();
	const savingOrgId = ref<string | null>(null);
	const savingDefaultOrgId = ref<string | null>(null);

	const isSelected = (membership: Membership) => auth.user.selected_orgs.includes(membership.org.id);
	const isDefault = (membership: Membership) => isSelected(membership) && auth.user.default_account === membership.org.account;

	const setDefault = async (accountId: string) => {
		await $directus.request(updateMe({ default_account: accountId }));
		auth.user.default_account = accountId;
	};

	const makeDefault = async (membership: Membership) => {
		savingDefaultOrgId.value = membership.org.id;

		try {
			await setDefault(membership.org.account);
		} catch (e) {
			sendErrorToast(e);
		}

		savingDefaultOrgId.value = null;
	};

	const toggle = async (membership: Membership) => {
		savingOrgId.value = membership.org.id;

		try {
			if (isDefault(membership)) {
				await setDefault(account.personal.id);
			}

			await account.setSelected(xor(auth.user.selected_orgs, [ membership.org.id ]));
		} catch (e) {
			sendErrorToast(e);
		}

		savingOrgId.value = null;
	};
</script>
