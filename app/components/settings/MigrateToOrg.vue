<template>
	<div class="mt-6 flex rounded-xl border bg-surface-0 p-4 max-sm:flex-col sm:p-6 dark:bg-dark-800">
		<div class="max-sm:mb-4 sm:w-2/5 sm:pr-6">
			<h5 class="text-lg font-bold">Transfer to an organization</h5>
			<p class="mt-2 text-sm text-bluegray-500 dark:text-bluegray-300">Transfer your personal probes, tokens and credits to an organization, or redirect future sponsorship credits.</p>
		</div>
		<div class="grow sm:w-3/5">
			<p class="mb-2 font-bold max-sm:hidden">Probes, tokens and credits</p>
			<Button severity="secondary" outlined label="Transfer to an organization" :disabled="!orgs.length || !!auth.impersonation" @click="open"/>
			<p v-if="!orgs.length" class="mt-2 text-sm text-bluegray-500 dark:text-bluegray-300">
				You must be an admin or a member of an organization to transfer resources.
			</p>
		</div>

		<GPDialog v-model:visible="dialogVisible" header="Transfer to an organization">
			<div class="sm:w-[36rem]">
				<p class="mb-6 text-sm text-bluegray-500 dark:text-bluegray-300">Choose an organization, then select what to transfer. Each action below runs separately.</p>
				<label for="migrate-org" class="block font-bold">Destination organization</label>
				<Select
					v-model="orgId"
					input-id="migrate-org"
					:options="orgs"
					option-label="name"
					option-value="id"
					placeholder="Select an organization"
					class="mt-2 w-full"
					:disabled="!!pending"
					@change="reset"
				>
					<template #value="{ placeholder }">
						<span v-if="org" class="flex items-center">
							<span class="min-w-0 grow truncate">{{ org.name }}</span>
							<Tag class="ml-4 shrink-0 bg-neutral-100 font-normal text-neutral-700 dark:bg-neutral-500/20 dark:text-neutral-300" severity="secondary" :value="capitalize(org.role)"/>
						</span>
						<template v-else>{{ placeholder }}</template>
					</template>
					<template #option="{ option }">
						<span class="min-w-0 grow truncate">{{ option.name }}</span>
						<Tag class="ml-4 shrink-0 bg-neutral-100 font-normal text-neutral-700 dark:bg-neutral-500/20 dark:text-neutral-300" severity="secondary" :value="capitalize(option.role)"/>
					</template>
				</Select>
				<p class="mt-2 text-sm text-bluegray-500 dark:text-bluegray-300">Only organizations where you're an admin or a member are listed.</p>

				<Message v-if="org" severity="warn" icon="pi pi-exclamation-triangle" class="mt-6">
					Transfers of probes, tokens and credits cannot be undone. Sponsorship credit redirects can be removed at any time.
				</Message>

				<ul v-if="org" class="mt-4 divide-y dark:divide-dark-600">
					<li v-for="row in ROWS" :key="row.action" class="py-4 first:pt-0 last:pb-0">
						<div class="flex gap-4 max-sm:flex-col sm:items-center">
							<div class="min-w-0 grow">
								<p class="font-bold">{{ row.title }}</p>
								<div class="mt-1 text-sm text-bluegray-500 dark:text-bluegray-300">
									<template v-if="row.action === 'probes'">
										<p>Move all your personal probes to <b>{{ org.name }}</b>. Your current adoption token moves with them, and your personal account gets a new token.</p>
										<p v-if="account.personal.public_probes && org.public_probes" class="mt-1">
											Their public tag changes from <Tag :class="TAG_CLASS" severity="secondary" :value="`u-${account.personal.tag_prefix}`"/>
											to <Tag :class="TAG_CLASS" severity="secondary" :value="`u-${org.name}`"/>.
										</p>
										<p v-else-if="account.personal.public_probes" class="mt-1">
											Their public tag <Tag :class="TAG_CLASS" severity="secondary" :value="`u-${account.personal.tag_prefix}`"/> is removed.
											An organization admin can enable public probes to add <Tag :class="TAG_CLASS" severity="secondary" :value="`u-${org.name}`"/>.
										</p>
									</template>
									<p v-else-if="row.action === 'tokens'">Move your personal tokens and app approvals to <b>{{ org.name }}</b>. Measurements made with them will use the organization's credits.</p>
									<template v-else-if="row.action === 'credits'">
										<p>Move your personal credit balance, usage history, sponsorship history and sponsor bonus to <b>{{ org.name }}</b>.</p>
										<p v-if="redirectFromOrg" class="mt-1">Sponsorship credits for <b>{{ org.name }}</b> will continue going to your personal account. Remove the redirect below to keep future credits in <b>{{ org.name }}</b>.</p>
									</template>
									<template v-else>
										<p>Send future sponsorship credits to <b>{{ org.name }}</b> instead of your personal account.</p>
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
								This will remove
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
											label="Remove"
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
										label="Remove"
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
	type TransferResult = { probes?: number; tokens?: number; apps?: number; credits?: number };

	const ROWS: { action: Action; title: string; button: string }[] = [
		{ action: 'probes', title: 'Probes', button: 'Transfer probes' },
		{ action: 'tokens', title: 'Tokens and app approvals', button: 'Transfer tokens' },
		{ action: 'credits', title: 'Credit balance and history', button: 'Transfer credits' },
		{ action: 'redirect', title: 'Future sponsorship credits', button: 'Redirect credits' },
	];

	const TAG_CLASS = 'text-nowrap bg-surface-0 font-normal dark:bg-dark-800';

	const { $directus } = useNuxtApp();
	const auth = useAuth();
	const account = useAccount();

	const orgs = computed(() => auth.user.memberships
		.filter(({ role }) => role !== 'viewer')
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
			sendToast('success', 'Redirect removed', `Removed the sponsorship credit redirect from ${source.name} to ${target.name}.`);
		} catch (e) {
			sendErrorToast(e);
		}

		pending.value = null;
	};

	// MIGRATION

	const doneText = (action: Action) => action === 'redirect' ? redirectedToOrg.value && 'Sponsorship credits redirected' : moved.value[action];

	const count = (value = 0, noun: string) => `${formatNumber(value)} ${pluralize(noun, value)}`;

	const describe: Record<Exclude<Action, 'redirect'>, (result: TransferResult) => string> = {
		probes: ({ probes }) => count(probes, 'probe'),
		tokens: ({ tokens, apps }) => `${count(tokens, 'token')} and ${count(apps, 'app')}`,
		credits: ({ credits }) => count(credits, 'credit'),
	};

	const setRedirect = async ({ id, name }: { id: string; name: string }) => {
		const { becameAdmin } = await $directus.request<{ becameAdmin: boolean }>(customEndpoint({
			method: 'POST',
			path: '/transfer-data/credits-redirect',
			body: JSON.stringify({ accountId: account.personal.id, orgId: id }),
		}));

		await Promise.all([ refreshRedirects(), becameAdmin && auth.refresh() ]);
		sendToast('success', 'Redirect enabled', `Future sponsorship credits will be added to ${name}.`);
	};

	const transfer = async (action: Exclude<Action, 'redirect'>, { id, name }: { id: string; name: string }) => {
		const result = await $directus.request<TransferResult>(customEndpoint({
			method: 'POST',
			path: `/transfer-data/${action}`,
			body: JSON.stringify({ orgId: id }),
		}));

		const text = `Transferred ${describe[action](result)}`;
		moved.value[action] = text;
		await auth.refresh();
		sendToast('success', 'Transferred', `${text} to ${name}`);
	};

	const errorMessage = (action: Action, e: unknown) => {
		const message = getErrorMessage(e);

		return action === 'probes' && message.includes('no admin')
			? `Only organization admins can transfer probes to ${org.value!.name}. Ask an existing admin to change your role.`
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
