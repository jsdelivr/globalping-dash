<template>
	<div class="min-h-full p-6" :class="{'min-w-[640px]': tokens.length}">
		<div class="mb-4 flex">
			<h1 class="page-title">Tokens</h1>
			<Button class="ml-auto" label="Generate new token" @click="openTokenDetails('generate')"/>
		</div>
		<p class="xl:w-1/2">
			Generate a token and use it in your API requests to get a higher hourly measurements limit.
			After reaching the hourly limit, you can keep running measurements by spending the earned credits.
		</p>
		<div v-if="tokens.length || loading" class="mt-6">
			<DataTable
				v-model:expandedRows="expandedRows"
				:value="tokens"
				lazy
				:first="first"
				:rows="itemsPerPage"
				data-key="id"
				:total-records="tokensCount"
				:loading="loading"
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
						{{ getRelativeTimeString(slotProps.data.date_last_used) || 'Never' }}
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
							<CodeBlock class="mt-2" :commands="[[generatedToken!.value]]"/>
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
				class="mt-9"
				:first="first"
				:rows="itemsPerPage"
				:total-records="tokensCount"
				template="PrevPageLink PageLinks NextPageLink"
				@page="onPage($event)"
			/>
		</div>
		<div v-else class="mt-6 rounded-xl border bg-surface-0 px-4 py-3 dark:bg-dark-800">
			<div class="rounded-xl bg-surface-50 p-6 text-center dark:bg-dark-600">
				<p class="font-semibold">No data to show</p>
				<p class="mt-4">Adopt a probe or become a sponsor to track your credit usage</p>
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
			<div class="flex items-center">
				<div>
					<i class="pi pi-exclamation-triangle text-xl text-primary"/>
				</div>
				<div class="ml-3">
					<p>You are about to delete token <span class="font-bold">{{ tokenToDelete!.name }}</span>.</p>
					<p>Are you sure you want to delete this token? You will not be able to undo this action.</p>
				</div>
			</div>
			<div class="mt-7 text-right">
				<Button class="mr-2" label="Cancel" severity="secondary" text @click="deleteDialog = false"/>
				<Button label="Delete token" severity="danger" @click="deleteToken"/>
			</div>
		</GPDialog>
		<GPDialog
			v-model:visible="regenerateDialog"
			header="Regenerate token"
		>
			<div class="flex items-center">
				<div>
					<i class="pi pi-exclamation-triangle text-xl text-primary"/>
				</div>
				<div class="ml-3">
					<p>You are about to regenerate token <span class="font-bold">{{ tokenToRegenerate!.name }}</span>.</p>
					<p>Are you sure you want to regenerate this token? The previous value will stop working immediately.</p>
				</div>
			</div>
			<div class="mt-7 text-right">
				<Button class="mr-2" label="Cancel" severity="secondary" text @click="regenerateDialog = false"/>
				<Button label="Regenerate" @click="regenerateToken"/>
			</div>
		</GPDialog>
	</div>
</template>

<script setup lang="ts">
	import { aggregate, customEndpoint, deleteItem, readItems, updateItem } from '@directus/sdk';
	import type { PageState } from 'primevue/paginator';
	import { useAuth } from '~/store/auth';
	import { formatDate, getRelativeTimeString } from '~/utils/date-formatters';
	import { sendErrorToast, sendToast } from '~/utils/send-toast';

	useHead({
		title: 'Tokens -',
	});

	const config = useRuntimeConfig();
	const { $directus } = useNuxtApp();
	const auth = useAuth();
	const route = useRoute();

	const user = auth.getUser as User;
	const itemsPerPage = config.public.itemsPerTablePage;
	const loading = ref(false);
	const tokensCount = ref(0);
	const tokens = ref<Token[]>([]);
	const first = ref(0);

	const loadLazyData = async () => {
		loading.value = true;

		if (route.query.page) {
			first.value = (Number(route.query.page) - 1) * itemsPerPage;
		} else {
			first.value = 0;
		}

		try {
			const [ gpTokens, [{ count }] ] = await Promise.all([
				$directus.request(readItems('gp_tokens', {
					filter: { user_created: { _eq: user.id } },
					offset: first.value,
					limit: itemsPerPage,
					sort: '-date_created',
				})),
				$directus.request<[{count: number}]>(aggregate('gp_tokens', { aggregate: { count: '*' } })),
			]);

			tokens.value = gpTokens;
			tokensCount.value = count;
		} catch (e) {
			sendErrorToast(e);
		}

		loading.value = false;
	};

	onMounted(async () => {
		await loadLazyData();
	});

	// NAVIGATION

	const onPage = async (event: PageState) => {
		await navigateTo({
			path: '/tokens',
			query: {
				page: event.page + 1,
			},
		});
	};

	watch(() => route.query.page, async () => {
		resetState();
		loadLazyData();
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

	const expandedRows = ref({});
	const generatedToken = ref<{id: number, value: string} | null>(null);

	const handleGenerate = async (id: number, tokenValue: string) => {
		await navigateTo('/tokens');
		await loadLazyData();
		generatedToken.value = { id, value: tokenValue };
		expandedRows.value = { [id]: true };
		tokenDetailsDialog.value = false;
	};

	// EDIT TOKEN

	const handleSave = async () => {
		await loadLazyData();
		tokenDetailsDialog.value = false;
	};

	const handleRegenerate = async (id: number, tokenValue: string) => {
		await loadLazyData();
		generatedToken.value = { id, value: tokenValue };
		expandedRows.value = { [id]: true };
		tokenDetailsDialog.value = false;
	};

	const resetState = () => {
		generatedToken.value = null;
		expandedRows.value = {};
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
			const token = await $directus.request(customEndpoint<string>({ method: 'POST', path: '/token-generator' }));
			const id = tokenToRegenerate.value!.id;

			await $directus.request(updateItem('gp_tokens', id, {
				value: token,
			}));

			generatedToken.value = { id, value: token };
			expandedRows.value = { [id]: true };
			tokenToRegenerate.value = null;
			regenerateDialog.value = false;

			sendToast('success', 'Done', 'Token was successfully regenerated');
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
			await $directus.request(deleteItem('gp_tokens', tokenToDelete.value!.id));

			// Go to prev page if that is last item.
			if (tokens.value.length === 1 && route.query.page) {
				await navigateTo({
					path: '/tokens',
					query: {
						page: Number(route.query.page) - 1,
					},
				});
			}

			await loadLazyData();
			tokenToDelete.value = null;
			deleteDialog.value = false;

			sendToast('success', 'Done', 'Token was deleted');
		} catch (e) {
			sendErrorToast(e);
		}
	};
</script>
