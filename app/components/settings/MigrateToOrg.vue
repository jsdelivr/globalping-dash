<template>
	<div class="mt-6 flex rounded-xl border bg-surface-0 p-4 max-sm:flex-col sm:p-6 dark:bg-dark-800">
		<div class="max-sm:mb-4 sm:w-2/5 sm:pr-6">
			<h5 class="text-lg font-bold">Transfer to an organization</h5>
			<p class="mt-2 text-sm text-bluegray-500 dark:text-bluegray-300">Transfer your personal probes, tokens and credits to an organization, or redirect future sponsorship credits.</p>
		</div>
		<div class="min-w-0 grow sm:w-3/5">
			<label for="migrate-org" class="block font-bold">Destination organization</label>
			<Select
				v-model="orgId"
				input-id="migrate-org"
				:options="orgs"
				option-label="name"
				option-value="id"
				placeholder="Select an organization"
				class="mt-2 w-full"
				:disabled="!orgs.length || !!auth.impersonation || !!pending"
				@change="changeOrg"
			>
				<template #value="{ placeholder }">
					<span v-if="org" class="flex items-center">
						<span class="min-w-0 grow truncate">{{ org.name }}</span>
						<Tag class="ml-4 shrink-0 bg-neutral-100 font-normal text-neutral-700 dark:bg-neutral-500/20 dark:text-neutral-300" severity="secondary" :value="capitalize(org.role)"/>
					</span>
					<template v-else>{{ placeholder }}</template>
				</template>
				<template #option="{ option }">
					<span class="min-w-0 grow truncate leading-normal">{{ option.name }}</span>
					<Tag class="ml-4 shrink-0 bg-neutral-100 font-normal text-neutral-700 dark:bg-neutral-500/20 dark:text-neutral-300" severity="secondary" :value="capitalize(option.role)"/>
				</template>
			</Select>
			<p v-if="orgs.length" class="mt-2 text-sm text-bluegray-500 dark:text-bluegray-300">Only organizations where you're an admin or a member are listed.</p>
			<p v-else class="mt-2 text-sm text-bluegray-500 dark:text-bluegray-300">You must be an admin or a member of an organization to transfer resources.</p>

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
							:disabled="!!pending || (row.action === 'redirect' && redirectsStatus !== 'success')"
							@click="row.action === 'redirect' && !redirects.length ? run(row.action) : confirmRow(row)"
						/>
					</div>

					<p v-if="doneText(row.action)" :id="`migrate-done-${row.action}`" tabindex="-1" class="mt-3 flex items-center gap-2 text-sm font-semibold text-primary-800 outline-none dark:text-primary">
						<i class="pi pi-check"/>{{ doneText(row.action) }}
					</p>

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
							<li v-for="redirect in redirects" :key="redirect.source.githubId" class="flex items-center gap-3 rounded-lg border bg-surface-50 px-4 py-2 max-sm:flex-wrap dark:border-dark-600 dark:bg-dark-700">
								<span class="flex min-w-0 grow flex-wrap items-center gap-x-3 max-sm:w-full">
									<span class="max-w-full break-words font-semibold">{{ redirect.source.name }}</span>
									<i class="pi pi-arrow-right text-sm text-bluegray-400"/>
									<span class="max-w-full break-words font-semibold">{{ redirect.target.name }}</span>
								</span>
								<Button
									class="ml-auto shrink-0"
									label="Remove"
									severity="secondary"
									outlined
									size="small"
									@click="confirmationDialog?.confirm({
										header: 'Remove the credits redirect?',
										message: [ 'Sponsorship credits of ', { bold: redirect.source.name }, ' will no longer be added to ', { bold: redirect.target.name }, '.' ],
										label: 'Remove',
										action: () => clearRedirect(redirect),
									})"/>
							</li>
						</ul>
					</template>
				</li>
			</ul>
		</div>

		<SettingsConfirmationDialog ref="confirmationDialog"/>
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
	import { getErrorMessage, sendToast } from '~/utils/send-toast';

	type Action = 'probes' | 'tokens' | 'credits' | 'redirect';
	type Row = { action: Action; title: string; button: string };
	type TransferResult = { probes?: number; tokens?: number; apps?: number; credits?: number };

	const ROWS: Row[] = [
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

	const orgId = ref<string | null>(null);
	const org = computed(() => orgs.value.find(({ id }) => id === orgId.value));
	const confirmationDialog = useTemplateRef('confirmationDialog');

	const pending = ref<Action | null>(null);
	const error = ref<{ action: Action; message: string } | null>(null);
	const moved = ref<Partial<Record<Action, string>>>({});

	const focusById = async (id: string) => {
		await nextTick();
		document.getElementById(id)?.focus();
	};

	// REDIRECTS

	const { data: redirects, status: redirectsStatus, error: redirectsError, refresh: refreshRedirects } = useLazyAsyncData(
		'settings-credits-redirect',
		() => $directus.request<{ redirects: CreditsRedirect[] }>(customEndpoint({
			method: 'GET',
			path: '/transfer-data/credits-redirect',
			params: { accountId: account.personal.id },
		})),
		{ default: () => [], transform: ({ redirects }) => redirects, immediate: false },
	);

	useErrorToast(redirectsError);

	const changeOrg = () => {
		error.value = null;
		moved.value = {};
		refreshRedirects();
	};

	const redirectedToOrg = computed(() => redirects.value.some(({ target }) => target.githubId === org.value?.github_id));
	const redirectFromOrg = computed(() => redirects.value.some(({ source }) => source.githubId === org.value?.github_id));

	const clearRedirect = async ({ source, target }: CreditsRedirect) => {
		await $directus.request(customEndpoint({
			method: 'DELETE',
			path: '/transfer-data/credits-redirect',
			body: JSON.stringify({ accountId: account.personal.id, source: source.githubId, target: target.githubId }),
		}));

		await refreshRedirects();
		sendToast('success', 'Redirect removed', `Removed the sponsorship credit redirect from ${source.name} to ${target.name}.`);
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

		pending.value = null;
		focusById(error.value ? `migrate-${action}` : `migrate-done-${action}`);
	};

	// Transfers can't be undone and a redirect replaces the existing ones, so both are confirmed first.
	const confirmRow = ({ action, button }: Row) => confirmationDialog.value?.confirm({
		header: `${button} to ${org.value!.name}?`,
		message: action === 'redirect'
			? [ 'This will remove ', ...redirects.value.flatMap(({ source, target }, index) => [ ...index ? [ ', ' ] : [], { bold: `${source.name} → ${target.name}` }]), '.' ]
			: [ 'This can\'t be undone.' ],
		label: button,
		action: () => run(action),
	});
</script>
