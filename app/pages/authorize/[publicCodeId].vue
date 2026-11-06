<template>
	<div class="my-4">
		<BlockLoading v-if="status === 'pending'"/>

		<div v-else-if="status === 'success' && code">
			<h2 class="text-3xl font-bold">Authorize<br>{{ code?.client.name }}</h2>
			<NuxtLink v-if="code?.client.owner.name" :to="code?.client.owner.url as string" class="text-bluegray-400 hover:underline" target="_blank">by {{ code?.client.owner.name }} <i class="pi pi-external-link text-2xs"/></NuxtLink>
			<span v-else class="text-bluegray-400">by Globalping <i class="pi pi-check-circle text-2xs text-primary"/></span>
			<template v-if="accountOptions.length > 1">
				<h3 class="mt-8">to perform measurements under your account:</h3>
				<Select
					v-model="accountId"
					:options="accountOptions"
					option-label="name"
					option-value="id"
					aria-label="Account"
					class="mt-2 w-full"
				>
					<template #value="{ value }">
						<span class="flex items-center">
							<i class="mr-2 shrink-0" :class="optionOf(value)?.icon" aria-hidden="true"/>
							<span class="min-w-0 grow truncate">{{ optionOf(value)?.name }}</span>
						</span>
					</template>
					<template #option="{ option }">
						<i class="mr-2 shrink-0" :class="option.icon" aria-hidden="true"/>
						<span class="-my-1 min-w-0 grow truncate leading-normal">{{ option.name }}</span>
					</template>
				</Select>
			</template>
			<h3 v-else class="mt-8">to perform measurements under your <strong>{{ account.personal.name }}</strong> account.</h3>
			<p v-if="canAddOrg" class="mt-2 text-sm text-bluegray-500">Want to act as an organization? Add it under "Switch account" in the dashboard account menu, then select here.</p>

			<Divider class="h-2 before:border-t-2"/>

			<div class="flex gap-2">
				<form :action="`${config.public.gpAuthUrl}/oauth/approve/${route.params.publicCodeId}`" method="post" class="w-1/2">
					<input type="hidden" name="approved" value="0">

					<Button
						type="submit"
						class="h-12 w-full bg-black"
						severity="secondary"
						label="Cancel"
					/>
				</form>

				<form :action="`${config.public.gpAuthUrl}/oauth/approve/${route.params.publicCodeId}`" method="post" class="w-1/2">
					<input type="hidden" name="approved" value="1">
					<input type="hidden" name="accountId" :value="accountId">

					<Button
						type="submit"
						class="h-12 w-full bg-black"
						severity="contrast"
						label="Authorize"
					/>
				</form>
			</div>
		</div>

		<div v-else>
			<Message severity="error" class="font-normal">
				Failed to load the application details.
				Please try refreshing the page.
				<div v-if="codeError"><br>Error code: {{ codeError.statusCode }}</div>
			</Message>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { useAccount } from '~/store/account';
	import { useAuth } from '~/store/auth';

	definePageMeta({
		layout: 'info',
	});

	const account = useAccount();
	const auth = useAuth();
	const route = useRoute();
	const config = useRuntimeConfig();

	const accountOptions = [
		{ id: account.personal.id, name: account.personal.name, icon: 'pi pi-user' },
		...account.nonViewerOrgs.map(({ org }) => ({ id: org.account, name: org.name, icon: 'pi pi-building' })),
	];
	const optionOf = (id: string) => accountOptions.find(option => option.id === id);

	// Only an org the user may act for that isn't in the account menu yet can be added and picked here.
	const canAddOrg = auth.user.memberships.some(({ org, role }) => role !== 'viewer' && !auth.user.selected_orgs.includes(org.id));

	const accountId = ref([ account.current.id, auth.user.default_account ].find(id => accountOptions.some(option => option.id === id)) ?? account.personal.id);

	const { status, data: code, error: codeError } = await useLazyFetch<CodeApprovalDetails>(`${config.public.gpAuthUrl}/oauth/approve/${route.params.publicCodeId}`);

	watch(code, () => {
		useHead({
			title: `Authorize ${code.value?.client.name ? `${code.value?.client.name} ` : ''}- `,
		});
	});
</script>
