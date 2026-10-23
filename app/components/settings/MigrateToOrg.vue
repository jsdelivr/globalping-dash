<template>
	<div class="mt-6 flex rounded-xl border bg-surface-0 p-4 max-sm:flex-col sm:p-6 dark:bg-dark-800">
		<div class="max-sm:mb-4 sm:w-2/5 sm:pr-6">
			<h5 class="text-lg font-bold">Migrate to organization</h5>
			<p class="mt-2 text-sm text-bluegray-500 dark:text-bluegray-300">Move your personal probes, tokens and credits to an organization, or redirect your sponsorship credits to it.</p>
		</div>
		<div class="grow sm:w-3/5">
			<p class="mb-2 font-bold max-sm:hidden">Probes, tokens and credits</p>
			<Button severity="secondary" outlined label="Migrate to organization" :disabled="!orgs.length || !!auth.impersonation" @click="open"/>
			<p v-if="!orgs.length" class="mt-2 text-sm text-bluegray-500 dark:text-bluegray-300">
				You have no organizations to migrate to. Add one where you're an admin or a member through "Add organization" in the account menu.
			</p>
		</div>

		<GPDialog v-model:visible="dialogVisible" header="Migrate to organization">
			<div class="sm:w-[36rem]">
				<label for="migrate-org" class="block font-bold">Organization</label>
				<Select
					v-model="orgId"
					input-id="migrate-org"
					:options="orgs"
					option-label="name"
					option-value="id"
					placeholder="Select an organization"
					class="mt-2 w-full"
					@change="reset"
				>
					<template #option="{ option }">
						<span class="grow">{{ option.name }}</span>
						<span class="ml-4 text-sm opacity-70">{{ capitalize(option.role) }}</span>
					</template>
				</Select>
				<p class="mt-2 text-sm text-bluegray-500 dark:text-bluegray-300">If the organization isn't in the list, add it through "Add organization" in the account menu first.</p>

				<p class="mt-6 text-sm font-semibold">Transfers are permanent. A redirect can be cleared any time.</p>

				<ul v-if="org" class="mt-4 divide-y dark:divide-dark-600">
					<li v-for="row in ROWS" :key="row.action" class="py-4 first:pt-0 last:pb-0">
						<div class="flex gap-4 max-sm:flex-col sm:items-center">
							<div class="min-w-0 grow">
								<p class="font-bold">{{ row.title }}</p>
								<div class="mt-1 text-sm text-bluegray-500 dark:text-bluegray-300">
									<template v-if="row.action === 'probes'">
										<p>Move your personal probes and adoption token to <b>{{ org.name }}</b>. You get a new adoption token.</p>
										<p v-if="account.personal.public_probes && org.public_probes" class="mt-1">
											Their public tag changes from <Tag :class="TAG_CLASS" severity="secondary" :value="`u-${account.personal.tag_prefix}`"/>
											to <Tag :class="TAG_CLASS" severity="secondary" :value="`u-${org.name}`"/>.
										</p>
										<p v-else-if="account.personal.public_probes" class="mt-1">
											Their public tag <Tag :class="TAG_CLASS" severity="secondary" :value="`u-${account.personal.tag_prefix}`"/>
											disappears until an admin of <b>{{ org.name }}</b> makes the organization probes public.
										</p>
									</template>
									<p v-else-if="row.action === 'tokens'">Move your personal API tokens and app approvals to <b>{{ org.name }}</b>. They spend its credits from then on.</p>
									<template v-else-if="row.action === 'credits'">
										<p>Move your personal balance, usage, sponsorship history and sponsor bonus to <b>{{ org.name }}</b>.</p>
										<p v-if="redirectFromOrg" class="mt-1"><b>{{ org.name }}</b>'s sponsorship credits will still be added to your personal account. Clear the redirect below to keep them in <b>{{ org.name }}</b>.</p>
									</template>
									<template v-else>
										<p>Move your future sponsorship credits to <b>{{ org.name }}</b> instead of your personal account.</p>
									</template>
								</div>
							</div>

							<Button
								v-if="!doneText(row.action)"
								:id="`migrate-${row.action}`"
								class="shrink-0 max-sm:w-full"
								:label="row.button"
								:severity="row.action === 'redirect' ? 'secondary' : 'danger'"
								outlined
								:loading="pending === row.action"
								:disabled="!!pending || !!confirming"
								@click="row.action === 'redirect' && !redirects.length ? run(row.action) : confirming = row.action"
							/>
						</div>

						<p v-if="doneText(row.action)" :id="`migrate-done-${row.action}`" tabindex="-1" class="mt-3 flex items-center gap-2 text-sm font-semibold text-primary-800 outline-none dark:text-primary">
							<i class="pi pi-check"/>{{ doneText(row.action) }}
						</p>

						<div v-if="confirming === row.action" class="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 max-sm:flex-wrap dark:border-red-500/30 dark:bg-red-500/10">
							<span v-if="row.action === 'redirect'" class="grow break-words text-sm text-red-600 max-sm:w-full dark:text-red-300">
								This removes
								<template v-for="(redirect, index) in redirects" :key="redirect.source.githubId">
									<b>{{ redirect.source.name }} → {{ redirect.target.name }}</b>{{ index < redirects.length - 1 ? ', ' : '.' }}
								</template>
							</span>
							<span v-else class="grow text-sm font-bold text-red-600 max-sm:w-full dark:text-red-300">This can't be undone.</span>
							<Button
								v-focus
								class="max-sm:flex-1"
								label="Cancel"
								severity="secondary"
								text
								size="small"
								@click="cancelConfirming"/>
							<Button
								class="max-sm:flex-1"
								:label="row.button"
								severity="danger"
								size="small"
								:loading="pending === row.action"
								@click="run(row.action)"/>
						</div>

						<Message
							v-if="error?.action === row.action"
							severity="error"
							icon="pi pi-times-circle"
							class="mt-3">
							{{ error.message }}
						</Message>

						<template v-if="row.action === 'redirect' && redirects.length">
							<p class="mt-4 text-sm font-bold">Current redirects</p>
							<ul aria-label="Current redirects" class="mt-2 flex flex-col gap-2">
								<li v-for="redirect in redirects" :key="redirect.source.githubId" class="flex items-center gap-3 rounded-lg border bg-surface-50 px-4 py-2 dark:border-dark-600 dark:bg-dark-700">
									<span class="min-w-0 break-words font-semibold">{{ redirect.source.name }}</span>
									<i class="pi pi-arrow-right text-sm text-bluegray-400"/>
									<span class="min-w-0 break-words font-semibold">{{ redirect.target.name }}</span>
									<template v-if="clearing === redirect.source.githubId">
										<Button
											class="ml-auto shrink-0"
											label="Clear"
											severity="danger"
											size="small"
											:loading="pending === 'clear'"
											@click="clearRedirect(redirect)"/>
										<Button
											v-focus
											class="shrink-0"
											label="Cancel"
											severity="secondary"
											text
											size="small"
											@click="clearing = null"/>
									</template>
									<Button
										v-else
										class="ml-auto shrink-0"
										label="Clear"
										severity="secondary"
										outlined
										size="small"
										@click="clearing = redirect.source.githubId"/>
								</li>
							</ul>
						</template>
					</li>
				</ul>
			</div>
		</GPDialog>
	</div>
</template>

<script setup lang="ts">
	import { customEndpoint } from '@directus/sdk';
	import capitalize from 'lodash/capitalize';
	import { useErrorToast } from '~/composables/useErrorToast';
	import { useAccount } from '~/store/account';
	import { useAuth } from '~/store/auth';
	import { formatNumber } from '~/utils/format-number';
	import { pluralize } from '~/utils/pluralize';
	import { getErrorMessage, sendErrorToast, sendToast } from '~/utils/send-toast';

	type Action = 'probes' | 'tokens' | 'credits' | 'redirect';
	type TransferResult = { probes?: number; tokens?: number; approvals?: number; credits?: number; becameAdmin: boolean };

	const ROWS: { action: Action; title: string; button: string }[] = [
		{ action: 'probes', title: 'Probes', button: 'Transfer probes' },
		{ action: 'tokens', title: 'Tokens', button: 'Transfer tokens' },
		{ action: 'credits', title: 'Credits', button: 'Transfer credits' },
		{ action: 'redirect', title: 'Future sponsorship credits', button: 'Redirect credits' },
	];

	const TAG_CLASS = 'text-nowrap bg-surface-0 font-normal dark:bg-dark-800';

	const { $directus } = useNuxtApp();
	const auth = useAuth();
	const account = useAccount();

	const orgs = computed(() => account.nonViewerOrgs
		.map(({ org, role }) => ({ ...org, role }))
		.sort((a, b) => a.name.localeCompare(b.name)));

	const dialogVisible = ref(false);
	const orgId = ref<string | null>(null);
	const org = computed(() => orgs.value.find(({ id }) => id === orgId.value));

	const confirming = ref<Action | null>(null);
	const clearing = ref<string | null>(null);
	const pending = ref<Action | 'clear' | null>(null);
	const error = ref<{ action: Action; message: string } | null>(null);
	const moved = ref<Partial<Record<Action, string>>>({});

	const reset = () => {
		confirming.value = null;
		clearing.value = null;
		error.value = null;
		moved.value = {};
	};

	const focusById = async (id: string) => {
		await nextTick();
		document.getElementById(id)?.focus();
	};

	const vFocus = { mounted: (el: HTMLElement) => el.focus() };

	const cancelConfirming = () => {
		const action = confirming.value;
		confirming.value = null;
		focusById(`migrate-${action}`);
	};

	const open = () => {
		orgId.value = null;
		reset();
		refreshRedirects();
		dialogVisible.value = true;
	};

	// REDIRECTS

	const { data: redirects, error: redirectsError, refresh: refreshRedirects } = useLazyAsyncData(
		'settings-credits-redirect',
		() => $directus.request<{ redirects: CreditsRedirect[] }>(customEndpoint({
			method: 'GET',
			path: '/transfer-data/credits-redirect',
			params: { accountId: account.personal.id },
		})),
		{ default: () => [], transform: ({ redirects }) => redirects, immediate: false },
	);

	useErrorToast(redirectsError);

	const redirectedToOrg = computed(() => redirects.value.some(({ target }) => target.githubId === org.value?.github_id));
	const redirectFromOrg = computed(() => redirects.value.some(({ source }) => source.githubId === org.value?.github_id));

	const clearRedirect = async ({ source, target }: CreditsRedirect) => {
		pending.value = 'clear';

		try {
			await $directus.request(customEndpoint({
				method: 'DELETE',
				path: '/transfer-data/credits-redirect',
				body: JSON.stringify({ accountId: account.personal.id, source: source.githubId, target: target.githubId }),
			}));

			await refreshRedirects();
			clearing.value = null;
			sendToast('success', 'Cleared', 'The credits redirect was cleared');
		} catch (e) {
			sendErrorToast(e);
		}

		pending.value = null;
	};

	// MIGRATION

	const doneText = (action: Action) => action === 'redirect' ? redirectedToOrg.value && 'Redirected' : moved.value[action];

	const describe = ({ probes, tokens, approvals, credits }: TransferResult) => [
		probes && `${formatNumber(probes)} ${pluralize('probe', probes)}`,
		tokens && `${formatNumber(tokens)} ${pluralize('token', tokens)}`,
		approvals && `${formatNumber(approvals)} ${pluralize('app approval', approvals)}`,
		credits && `${formatNumber(credits)} ${pluralize('credit', credits)}`,
	].filter(Boolean).join(' and ') || 'your credits history';

	const setRedirect = async ({ id, name }: { id: string; name: string }) => {
		await $directus.request(customEndpoint({
			method: 'POST',
			path: '/transfer-data/credits-redirect',
			body: JSON.stringify({ accountId: account.personal.id, orgId: id }),
		}));

		await refreshRedirects();
		sendToast('success', 'Redirected', `Your sponsorship credits will be added to ${name}`);
	};

	const transfer = async (action: Exclude<Action, 'redirect'>, { id, name }: { id: string; name: string }) => {
		const result = await $directus.request<TransferResult>(customEndpoint({
			method: 'POST',
			path: `/transfer-data/${action}`,
			body: JSON.stringify({ orgId: id }),
		}));

		const text = `Moved ${describe(result)}`;
		moved.value[action] = text;
		await auth.refresh();
		sendToast('success', 'Transferred', `${text} to ${name}${result.becameAdmin ? `. You're now an admin of ${name}` : ''}`);
	};

	const errorMessage = (action: Action, e: unknown) => {
		const message = getErrorMessage(e);

		return action === 'probes' && message.includes('no admin')
			? `Only admins can move probes into ${org.value!.name} once it has an admin, so ask one to make you an admin.`
			: message;
	};

	const run = async (action: Action) => {
		error.value = null;
		pending.value = action;

		try {
			await (action === 'redirect' ? setRedirect(org.value!) : transfer(action, org.value!));
		} catch (e) {
			error.value = { action, message: errorMessage(action, e) };
		}

		confirming.value = null;
		pending.value = null;
		focusById(error.value ? `migrate-${action}` : `migrate-done-${action}`);
	};
</script>
