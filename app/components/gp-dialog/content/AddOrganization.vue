<template>
	<p class="mb-4">The organizations you pick here appear in the "Act as organization" menu. Your organizations come from GitHub and are updated every time you sign in.</p>

	<DataTable v-if="auth.user.memberships.length" :value="auth.user.memberships" data-key="id" class="mb-2">
		<Column header="Organization" field="org.name"/>
		<Column header="Role">
			<template #body="{ data }">{{ capitalize(data.role) }}</template>
		</Column>
		<Column class="w-px">
			<template #body="{ data }">
				<Button
					v-if="isSelected(data)"
					label="Remove"
					severity="secondary"
					outlined
					:loading="savingOrgId === data.org.id"
					:disabled="!!savingOrgId || !!auth.impersonation"
					@click="toggle(data.org.id)"
				/>
				<Button
					v-else
					label="Add"
					:loading="savingOrgId === data.org.id"
					:disabled="!!savingOrgId || !!auth.impersonation"
					@click="toggle(data.org.id)"
				/>
			</template>
		</Column>
	</DataTable>
	<p v-else class="mb-2 font-semibold">You are not a member of any organization on GitHub.</p>
</template>

<script setup lang="ts">
	import capitalize from 'lodash/capitalize';
	import xor from 'lodash/xor';
	import { useAccount } from '~/store/account';
	import { useAuth } from '~/store/auth';
	import { sendErrorToast } from '~/utils/send-toast';

	const auth = useAuth();
	const account = useAccount();
	const savingOrgId = ref<string | null>(null);

	const isSelected = (membership: Membership) => auth.user.selected_orgs.includes(membership.org.id);

	const toggle = async (orgId: string) => {
		savingOrgId.value = orgId;

		try {
			await account.setSelected(xor(auth.user.selected_orgs, [ orgId ]));
		} catch (e) {
			sendErrorToast(e);
		}

		savingOrgId.value = null;
	};
</script>
