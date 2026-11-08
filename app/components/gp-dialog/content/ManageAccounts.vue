<template>
	<p class="mb-4">Manage accounts in your “Switch account” menu and choose your default. Organizations are refreshed from GitHub each time you sign in.</p>

	<div class="mb-2 overflow-hidden rounded-2xl border bg-surface-0 px-4 dark:bg-dark-800">
		<table class="w-full border-collapse text-left leading-[normal] max-sm:block">
			<thead class="max-sm:sr-only">
				<tr>
					<th scope="col" class="border-b border-surface-300 px-2 pb-3 pt-4 font-semibold dark:border-dark-600">Account</th>
					<th scope="col" class="border-b border-surface-300 px-2 pb-3 pt-4 font-semibold dark:border-dark-600">Your role</th>
					<th scope="col" colspan="2" class="border-b border-surface-300 px-2 pb-3 pt-4 font-semibold dark:border-dark-600"><span class="sr-only">Actions</span></th>
				</tr>
			</thead>
			<tbody class="max-sm:block">
				<tr v-for="row in accounts" :key="row.id" class="account-row border-b last:border-b-0 max-sm:grid max-sm:grid-cols-[minmax(0,1fr)_auto] max-sm:py-3">
					<td class="px-2 py-3 max-sm:block max-sm:min-w-0 max-sm:self-end max-sm:pb-2 max-sm:pt-0 max-sm:font-semibold max-sm:[grid-area:name]">
						<div class="flex items-center gap-2 max-sm:flex-wrap">
							<span class="max-sm:wrap-anywhere max-sm:min-w-0">
								<i :class="row.orgId ? 'pi pi-building' : 'pi pi-user'" class="mr-2 text-bluegray-400" aria-hidden="true"/>{{ row.name }}
							</span>
							<Tag v-if="isDefault(row)" value="Default" icon="pi pi-star-fill" severity="secondary" class="text-xs font-normal"/>
						</div>
					</td>
					<td class="px-2 py-3 max-sm:block max-sm:py-0 max-sm:[grid-area:role]"><OrgRoleTag :value="row.role"/></td>
					<td class="w-px whitespace-nowrap px-2 py-3 text-right max-sm:block max-sm:w-auto max-sm:py-0 max-sm:[grid-area:preference]">
						<button
							v-if="row.selected && !isDefault(row)"
							type="button"
							class="text-sm text-bluegray-600 hover:underline disabled:cursor-default disabled:no-underline disabled:opacity-60 max-sm:mt-1 max-sm:flex max-sm:min-h-11 max-sm:w-full max-sm:items-center max-sm:text-left max-sm:text-xs max-sm:text-bluegray-500 dark:text-bluegray-300 dark:max-sm:text-bluegray-400"
							:disabled="!!savingDefaultAccountId || !!auth.impersonation"
							@click="makeDefault(row)"
						>
							<i class="pi pi-star mr-1" aria-hidden="true"/>
							Make default
						</button>
					</td>
					<td class="w-px whitespace-nowrap px-2 py-3 text-right max-sm:block max-sm:w-auto max-sm:py-0 max-sm:[grid-area:toggle]">
						<Button
							v-if="row.orgId"
							:label="row.selected ? 'Remove' : 'Add'"
							:icon="row.selected ? 'pi pi-trash' : 'pi pi-plus'"
							class="max-sm:px-3 max-sm:py-1.5 max-sm:text-sm"
							:severity="row.selected ? 'secondary' : undefined"
							:outlined="row.selected"
							:loading="savingOrgId === row.orgId"
							:disabled="!!savingOrgId || !!auth.impersonation"
							@click="toggleOrganization(row)"
						/>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
	<p v-if="!auth.user.memberships.length" class="mb-2 font-semibold">No GitHub organizations are available for your account.</p>
</template>

<script setup lang="ts">
	import { updateMe } from '@directus/sdk';
	import capitalize from 'lodash/capitalize';
	import xor from 'lodash/xor';
	import { useAccount } from '~/store/account';
	import { useAuth } from '~/store/auth';
	import { sendErrorToast } from '~/utils/send-toast';

	type AccountRow = {
		id: string;
		name: string;
		orgId: string | null;
		role: string;
		selected: boolean;
	};

	const { $directus } = useNuxtApp();
	const auth = useAuth();
	const account = useAccount();
	const savingOrgId = ref<string | null>(null);
	const savingDefaultAccountId = ref<string | null>(null);

	const accounts = computed<AccountRow[]>(() => [
		{ id: account.personal.id, name: account.personal.name, orgId: null, role: 'Personal', selected: true },
		...auth.user.memberships.map(({ org, role }) => ({
			id: org.account,
			name: org.name,
			orgId: org.id,
			role: capitalize(role),
			selected: auth.user.selected_orgs.includes(org.id),
		})),
	]);

	const defaultAccountId = computed(() => accounts.value.find(row => row.id === auth.user.default_account && row.selected)?.id ?? account.personal.id);
	const isDefault = (row: AccountRow) => defaultAccountId.value === row.id;

	const setDefault = async (accountId: string) => {
		await $directus.request(updateMe({ default_account: accountId }));
		auth.user.default_account = accountId;
	};

	const makeDefault = async (row: AccountRow) => {
		savingDefaultAccountId.value = row.id;

		try {
			await setDefault(row.id);
		} catch (e) {
			sendErrorToast(e);
		} finally {
			savingDefaultAccountId.value = null;
		}
	};

	const toggleOrganization = async (row: AccountRow) => {
		const orgId = row.orgId;

		if (!orgId) {
			return;
		}

		savingOrgId.value = orgId;

		try {
			if (isDefault(row)) {
				await setDefault(account.personal.id);
			}

			await account.setSelected(xor(auth.user.selected_orgs, [ orgId ]));
		} catch (e) {
			sendErrorToast(e);
		} finally {
			savingOrgId.value = null;
		}
	};
</script>

<style scoped>
	@media (width < 640px) {
		.account-row {
			grid-template-areas:
				"name toggle"
				"role toggle"
				"preference toggle";
		}
	}
</style>
