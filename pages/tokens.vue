<template>
	<div class="min-h-full p-4 sm:p-6" :class="{'min-w-[640px]': tokens.length}">
		<div data-testid="tokens-table">
			<div class="mb-4 flex">
				<h1 class="page-title">Tokens</h1>
				<Button class="ml-auto" label="Generate new token" :disabled="!!auth.impersonation" @click="openTokenDetails('generate')"/>
			</div>
			<p class="xl:w-1/2">
				Generate a token and use it in your API requests to get a higher hourly measurements limit.
				After reaching the hourly limit, you can keep running measurements by spending the earned credits.
			</p>
			<div v-if="tokens.length || loadingTokens" class="mt-6">
				<DataTable
					v-model:expanded-rows="expandedTokens"
					:value="tokens"
					lazy
					:first="firstToken"
					:rows="itemsPerPage"
					data-key="id"
					:total-records="tokensCount"
					:loading="loadingTokens"
				>
					<Column header="Name" field="name"/>
					<Column header="Origins">
						<template #body="slotProps">
							<Tag v-for="(origin, index) in slotProps.data.origins" :key="index" class="my-0.5 mr-1 flex py-0.5 font-normal" severity="secondary" :value="origin"/>
						</template>
					</Column>
					<Column header="Created">
						<template #body="slotProps">
							{{ getRelativeTimeString(slotProps.data.date_created) || 'Never' }}
						</template>
					</Column>
					<Column header="Last used">
						<template #body="slotProps">
							{{ getRelativeTimeString(slotProps.data.date_last_used, true) || 'Never' }}
						</template>
					</Column>
					<Column header="Expires">
						<template #body="slotProps">
							{{ formatDate(slotProps.data.expire) || 'Never' }}
						</template>
					</Column>
					<Column :row-editor="true" body-class="!py-2">
						<template #body="slotProps">
							<TokenOptions
								@edit="openTokenDetails('edit', slotProps.data.id)"
								@regenerate="openRegenerateDialog(slotProps.data.id)"
								@delete="openDeleteDialog(slotProps.data.id)"
							/>
						</template>
					</Column>
					<template #expansion="">
						<div class="flex rounded-xl bg-surface-50 p-4 dark:bg-dark-600">
							<div><i class="pi pi-info-circle mr-3 text-xl"/></div>
							<div>
								<p class="font-bold">Don't forget to copy your new access token.</p>
								<p class="mt-2">You won’t be able to see it again.</p>
								<CodeBlock data-testid="token-value" class="mt-2" :commands="[[generatedToken!.value]]"/>
							</div>
							<div class="ml-auto">
								<Button
									icon="pi pi-times"
									severity="secondary"
									text
									rounded
									aria-label="Close"
									@click="resetState"
								/>
							</div>
						</div>
					</template>
				</DataTable>
				<Paginator
					v-if="tokens.length !== tokensCount"
					class="mt-6"
					:first="firstToken"
					:rows="itemsPerPage"
					:total-records="tokensCount"
					:page-link-size="pageLinkSize"
					:template="template"
					@page="tokensPage = $event.page"
				/>
			</div>
			<div v-else class="mt-6 rounded-xl border bg-surface-0 px-4 py-3 dark:bg-dark-800">
				<div class="rounded-xl bg-surface-50 p-6 text-center dark:bg-dark-600">
					<p class="font-semibold">No data to show</p>
					<p class="mt-4">Generate a token and use it in your API requests to get a higher hourly measurements limit.</p>
				</div>
			</div>
		</div>
		<div data-testid="applications-table">
			<div class="mb-4 mt-12">
				<h2 class="page-title">Authorized Apps</h2>
			</div>
			<p class="xl:w-1/2">
				Sign in with your Globalping account in supported apps to get a higher hourly measurements limit.
				After reaching the hourly limit, you can keep running measurements by spending the earned credits.
			</p>
			<div v-if="apps.length || loadingApplications" class="mt-6">
				<DataTable
					:value="apps"
					lazy
					:first="firstApp"
					:rows="itemsPerPage"
					data-key="id"
					:total-records="appsCount"
					:loading="loadingApplications"
				>
					<Column header="Name" field="name"/>
					<Column header="Owner">
						<template #body="slotProps">
							<a v-if="slotProps.data.owner_url" class="underline" :href="slotProps.data.owner_url" target="_blank" rel="noopener">{{ slotProps.data.owner_name }}</a>
							<span v-else>{{ slotProps.data.owner_name }}</span>
						</template>
					</Column>
					<Column header="Last used">
						<template #body="slotProps">
							{{ getRelativeTimeString(slotProps.data.date_last_used, true) || 'Never' }}
						</template>
					</Column>
					<Column :row-editor="true" body-class="!py-2">
						<template #body="slotProps">
							<ApplicationOptions @revoke="openRevokeDialog(slotProps.data.id)"/>
						</template>
					</Column>
				</DataTable>
				<Paginator
					v-if="apps.length !== appsCount"
					class="mt-6"
					:first="firstApp"
					:rows="itemsPerPage"
					:total-records="appsCount"
					:page-link-size="pageLinkSize"
					:template="template"
					@page="appsPage = $event.page"
				/>
			</div>
			<div v-else class="mt-6 rounded-xl border bg-surface-0 px-4 py-3 dark:bg-dark-800">
				<div class="rounded-xl bg-surface-50 p-6 text-center dark:bg-dark-600">
					<p class="font-semibold">No data to show</p>
					<p class="mt-4">Sign in with your Globalping account in supported apps to get a higher hourly measurements limit.</p>
				</div>
			</div>
		</div>
		<GPDialog
			v-model:visible="tokenDetailsDialog"
			:header="tokenDetails ? 'Edit token' : 'Generate new token'"
			content-class="!p-0"
		>
			<TokenDetails
				:token="tokenDetails"
				@cancel="tokenDetailsDialog = false"
				@generate="handleGenerate"
				@save="handleSave"
				@regenerate="handleRegenerate"
			/>
		</GPDialog>
		<GPDialog
			v-model:visible="deleteDialog"
			header="Delete token"
		>
			<div class="flex items-center gap-4">
				<div>
					<i class="pi pi-exclamation-triangle text-xl text-red-500 dark:text-red-400"/>
				</div>
				<div>
					<p>You are about to delete token <span class="font-bold">{{ tokenToDelete!.name }}</span>.</p>
					<p>Are you sure you want to delete this token? You will not be able to undo this action.</p>
				</div>
			</div>
			<div class="mt-6 text-right">
				<Button class="mr-2" label="Cancel" severity="secondary" text @click="deleteDialog = false"/>
				<Button label="Delete token" severity="danger" @click="deleteToken"/>
			</div>
		</GPDialog>
		<GPDialog
			v-model:visible="regenerateDialog"
			header="Regenerate token"
		>
			<div class="flex items-center gap-4">
				<div>
					<i class="pi pi-exclamation-triangle text-xl text-primary"/>
				</div>
				<div>
					<p>You are about to regenerate token <span class="font-bold">{{ tokenToRegenerate!.name }}</span>.</p>
					<p>Are you sure you want to regenerate this token? The previous value will stop working immediately.</p>
				</div>
			</div>
			<div class="mt-6 text-right">
				<Button class="mr-2" label="Cancel" severity="secondary" text @click="regenerateDialog = false"/>
				<Button label="Regenerate" @click="regenerateToken"/>
			</div>
		</GPDialog>
		<GPDialog
			v-model:visible="revokeDialog"
			header="Revoke access"
		>
			<div class="flex items-center gap-4">
				<div>
					<i class="pi pi-exclamation-triangle text-xl text-red-500 dark:text-red-400"/>
				</div>
				<div>
					<p>You are about to revoke access for the app <span class="font-bold">{{ appToRevoke!.name }}</span>.</p>
					<p>Are you sure you want to proceed? You will not be able to undo this action.</p>
				</div>
			</div>
			<div class="mt-6 text-right">
				<Button class="mr-2" label="Cancel" severity="secondary" text @click="revokeDialog = false"/>
				<Button label="Revoke access" severity="danger" @click="revokeApp"/>
			</div>
		</GPDialog>
	</div>
</template>

<script setup lang="ts">
	import { aggregate, customEndpoint, deleteItem, readItems, updateItem } from '@directus/sdk';
	import { usePagination } from '~/composables/pagination';
	import { useUserFilter } from '~/composables/useUserFilter';
	import { useAuth } from '~/store/auth';
	import { formatDate, getRelativeTimeString } from '~/utils/date-formatters';
	import { requestDirectus } from '~/utils/request-directus';
	import { sendErrorToast, sendToast } from '~/utils/send-toast';

	useHead({
		title: 'Tokens -',
	});

	const config = useRuntimeConfig();
	const { getUserFilter } = useUserFilter();
	const auth = useAuth();

	const itemsPerPage = ref(Math.round(config.public.itemsPerTablePage / 2));

	// TOKENS

	const loadingTokens = ref(false);
	const tokens = ref<Token[]>([]);
	const tokensCount = ref(0);
	const { page: tokensPage, first: firstToken, pageLinkSize, template } = usePagination({ itemsPerPage, pageKey: 'tokensPage' });

	const loadTokens = async () => {
		loadingTokens.value = true;

		try {
			const [ gpTokens, [{ count }] ] = await Promise.all([
				requestDirectus(readItems('gp_tokens', {
					filter: {
						...getUserFilter('user_created'),
						app_id: { _null: true },
					},
					offset: firstToken.value,
					limit: itemsPerPage.value,
					sort: '-date_created',
				})),
				requestDirectus<[{ count: number }]>(aggregate('gp_tokens', {
					query: {
						filter: {
							...getUserFilter('user_created'),
							app_id: { _null: true },
						},
					},
					aggregate: { count: '*' },
				})),
			]);

			tokens.value = gpTokens;
			tokensCount.value = count;
		} catch (e) {
			sendErrorToast(e);
		}

		loadingTokens.value = false;
	};

	onMounted(async () => {
		await loadTokens();
	});

	watch([ tokensPage ], async () => {
		resetState();
		await loadTokens();
	});

	// TOKEN DETAILS

	const tokenDetails = ref<Token | null>(null);

	const openTokenDetails = (mode: 'generate' | 'edit', id?: number) => {
		resetState();

		if (mode === 'generate') {
			tokenDetailsDialog.value = true;
		} else if (mode === 'edit') {
			const token = tokens.value.find(token => token.id === id);
			tokenDetails.value = token ? { ...token } : null;
			tokenDetailsDialog.value = true;
		}
	};

	// GENERATE NEW TOKEN

	const tokenDetailsDialog = ref(false);

	const expandedTokens = ref({});
	const generatedToken = ref<{ id: number; value: string } | null>(null);

	const handleGenerate = async (id: number, tokenValue: string) => {
		await navigateTo('/tokens');
		await loadTokens();
		generatedToken.value = { id, value: tokenValue };
		expandedTokens.value = { [id]: true };
		tokenDetailsDialog.value = false;
	};

	// EDIT TOKEN

	const handleSave = async () => {
		await loadTokens();
		tokenDetailsDialog.value = false;
	};

	const handleRegenerate = async (id: number, tokenValue: string) => {
		await loadTokens();
		generatedToken.value = { id, value: tokenValue };
		expandedTokens.value = { [id]: true };
		tokenDetailsDialog.value = false;
	};

	const resetState = () => {
		generatedToken.value = null;
		expandedTokens.value = {};
		tokenDetails.value = null;
	};

	// REGENERATE TOKEN

	const regenerateDialog = ref(false);
	const tokenToRegenerate = ref<Token | null>(null);

	const openRegenerateDialog = (id: number) => {
		const token = tokens.value.find(token => token.id === id);
		tokenToRegenerate.value = token!;
		regenerateDialog.value = true;
	};

	const regenerateToken = async () => {
		try {
			const token = await requestDirectus(customEndpoint<string>({ method: 'POST', path: '/bytes' }));
			const id = tokenToRegenerate.value!.id;

			await requestDirectus(updateItem('gp_tokens', id, {
				value: token,
			}));

			generatedToken.value = { id, value: token };
			expandedTokens.value = { [id]: true };
			tokenToRegenerate.value = null;
			regenerateDialog.value = false;

			sendToast('success', 'Done', 'The token has been successfully regenerated');
		} catch (e) {
			sendErrorToast(e);
		}
	};

	// DELETE TOKEN

	const deleteDialog = ref(false);
	const tokenToDelete = ref<Token | null>(null);

	const openDeleteDialog = (id: number) => {
		const token = tokens.value.find(token => token.id === id);
		tokenToDelete.value = token!;
		deleteDialog.value = true;
	};

	const deleteToken = async () => {
		try {
			await requestDirectus(deleteItem('gp_tokens', tokenToDelete.value!.id));

			// Go to prev page if that is last item.
			if (tokens.value.length === 1 && tokensPage.value) {
				tokensPage.value--;
			}

			await loadTokens();
			tokenToDelete.value = null;
			deleteDialog.value = false;

			sendToast('success', 'Done', 'The token has been deleted');
		} catch (e) {
			sendErrorToast(e);
		}
	};

	// APPLICATIONS

	const loadingApplications = ref(false);
	const apps = ref<Application[]>([]);
	const appsCount = ref(0);
	const { page: appsPage, first: firstApp } = usePagination({ itemsPerPage, pageKey: 'appsPage' });

	const loadApplications = async () => {
		loadingApplications.value = true;

		try {
			const { applications, total } = await requestDirectus<{ applications: Application[]; total: number }>(customEndpoint({
				method: 'GET',
				path: '/applications',
				params: {
					userId: getUserFilter('user_id').user_id?._eq || 'all',
					offset: firstApp.value,
					limit: itemsPerPage.value,
				},
			}));

			apps.value = applications;
			appsCount.value = total;
		} catch (e) {
			sendErrorToast(e);
		}

		loadingApplications.value = false;
	};

	onMounted(async () => {
		await loadApplications();
	});

	watch(appsPage, async () => {
		resetState();
		await loadApplications();
	});

	// REVOKE APP ACCESS

	const revokeDialog = ref(false);
	const appToRevoke = ref<Application | null>(null);

	const openRevokeDialog = (id: string) => {
		const app = apps.value.find(app => app.id === id);
		appToRevoke.value = app!;
		revokeDialog.value = true;
	};

	const revokeApp = async () => {
		try {
			if (appToRevoke.value && appToRevoke.value.id) {
				await requestDirectus<{ applications: Application[] }>(customEndpoint({
					method: 'POST',
					path: '/applications/revoke',
					body: JSON.stringify({
						userId: appToRevoke.value.user_id,
						id: appToRevoke.value.id,
					}),
				}));

				// Go to prev page if that is last item.
				if (apps.value.length === 1 && appsPage.value) {
					appsPage.value--;
				}
			}

			await loadApplications();
			appToRevoke.value = null;
			revokeDialog.value = false;
			sendToast('success', 'Done', 'The application access has been revoked');
		} catch (e) {
			sendErrorToast(e);
		}
	};
</script>
