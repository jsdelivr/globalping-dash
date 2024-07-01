<template>
	<div class="flex min-h-full flex-col p-6" :class="{'min-w-[640px]': tokens.length}">
		<div class="mb-4 flex">
			<h1 class="col-span-2 text-2xl font-bold">Tokens</h1>
			<Button class="ml-auto" label="Generate new token" @click="openTokenDetails('generate')"/>
		</div>
		<p class="xl:w-1/2">Generate a token and add it to your Globalping requests to upper your hourly measurements limit. After the limit is exhausted, you can proceed with measurements by spending the earned credits.</p>
		<div v-if="tokens.length || loading" class="mt-6">
			<DataTable
				v-model:expandedRows="expandedRows"
				:value="tokens"
				lazy
				:first="first"
				:rows="5"
				data-key="id"
				:total-records="tokensCount"
				:loading="loading"
				:row-class="() => '!bg-surface-0 dark:!bg-dark-800 align-middle'"
				class="pb-3"
			>
				<Column header="Name" field="name" header-class="pl-1 pt-3"/>
				<Column header="Origins" header-class="pl-1 pt-3">
					<template #body="slotProps">
						<Tag v-for="(origin, index) in slotProps.data.origins" :key="index" class="my-0.5 mr-1 flex py-0.5 font-normal" severity="secondary" :value="origin"/>
					</template>
				</Column>
				<Column header="Created" header-class="pl-1 pt-3">
					<template #body="slotProps">
						{{ getRelativeTimeString(slotProps.data.date_created) || 'Never' }}
					</template>
				</Column>
				<Column header="Last used" header-class="pl-1 pt-3">
					<template #body="slotProps">
						{{ getRelativeTimeString(slotProps.data.date_last_used) || 'Never' }}
					</template>
				</Column>
				<Column header="Expires" header-class="pl-1 pt-3">
					<template #body="slotProps">
						{{ formatDate(slotProps.data.expire) || 'Never' }}
					</template>
				</Column>
				<Column :row-editor="true" header-class="pl-1 pt-3" body-class="!py-2">
					<template #body="slotProps">
						<TokenOptions
							@edit="openTokenDetails('edit', slotProps.data.id)"
							@regenerate="openRegenerateDialog(slotProps.data.id)"
							@delete="openDeleteDialog(slotProps.data.id)"
						/>
					</template>
				</Column>
				<template #expansion="">
					<div class="bg-surface-50 dark:bg-dark-600 flex rounded-xl p-4">
						<div><i class="pi pi-info-circle mr-3 text-xl"/></div>
						<div>
							<p class="font-bold">Don't forget to copy your new personal access token.</p>
							<p class="mt-2">This secret won't be shown again for your security.</p>
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
				:rows="5"
				:total-records="tokensCount"
				template="PrevPageLink PageLinks NextPageLink"
				@page="onPage($event)"
			/>
		</div>
		<div v-else class="bg-surface-0 dark:bg-dark-800 mt-6 rounded-xl border px-4 py-3">
			<div class="bg-surface-50 dark:bg-dark-600 rounded-xl p-6 text-center">
				<p class="font-semibold">No data to show</p>
				<p class="mt-4">Adopt a probe or become a sponsor to track your credit usage</p>
			</div>
		</div>
		<Dialog
			v-model:visible="tokenDetailsDialog"
			class="min-w-[700px] max-md:min-w-[95%]"
			modal
			dismissable-mask
			:draggable="false"
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
		</Dialog>
		<Dialog
			v-model:visible="deleteDialog"
			class="min-w-[700px] max-md:min-w-[95%]"
			modal
			dismissable-mask
			:draggable="false"
			header="Delete token"
		>
			<div class="flex items-center">
				<div>
					<i class="pi pi-exclamation-triangle text-primary text-xl"/>
				</div>
				<div class="ml-3">
					<p>You're about to delete token <span class="font-bold">{{ tokenToDelete!.name }}</span>.</p>
					<p>Are you sure you want to delete this token? You will not be able to undo this action.</p>
				</div>
			</div>
			<div class="mt-7 text-right">
				<Button class="mr-2" label="Cancel" severity="secondary" text @click="deleteDialog = false"/>
				<Button label="Delete token" severity="danger" @click="deleteToken"/>
			</div>
		</Dialog>
		<Dialog
			v-model:visible="regenerateDialog"
			class="min-w-[700px] max-md:min-w-[95%]"
			modal
			dismissable-mask
			:draggable="false"
			header="Regenerate token"
		>
			<div class="flex items-center">
				<div>
					<i class="pi pi-exclamation-triangle text-primary text-xl"/>
				</div>
				<div class="ml-3">
					<p>You're about to regenerate token <span class="font-bold">{{ tokenToRegenerate!.name }}</span>.</p>
					<p>Are you sure you want to regenerate this token? The previous value will stop working immediately.</p>
				</div>
			</div>
			<div class="mt-7 text-right">
				<Button class="mr-2" label="Cancel" severity="secondary" text @click="regenerateDialog = false"/>
				<Button label="Regenerate" @click="regenerateToken"/>
			</div>
		</Dialog>
	</div>
</template>

<script setup lang="ts">
	import { aggregate, customEndpoint, deleteItem, readItems, updateItem } from '@directus/sdk';
	import type { PageState } from 'primevue/paginator';
	import { useAuth } from '~/store/auth';

	const { $directus } = useNuxtApp();
	const toast = useToast();
	const auth = useAuth();
	const user = auth.getUser as User;

	const loading = ref(false);
	const tokensCount = ref(0);
	const tokens = ref<Token[]>([]);
	const first = ref(0);

	const loadLazyData = async () => {
		loading.value = true;

		try {
			const [ gpTokens, [{ count }] ] = await Promise.all([
				$directus.request(readItems('gp_tokens', {
					filter: { user_created: { _eq: user.id } },
					offset: first.value,
					limit: 5,
					sort: '-date_created',
				})),
				$directus.request<[{count: number}]>(aggregate('gp_tokens', { aggregate: { count: '*' } })),
			]);

			tokens.value = gpTokens;
			tokensCount.value = count;
		} catch (e: any) {
			errorHandler(e);
		}

		loading.value = false;
	};

	onMounted(() => {
		loading.value = true;
		loadLazyData();
	});

	const onPage = (event: PageState) => {
		first.value = event.first;
		loadLazyData();
	};

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
		first.value = 0;
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
		} catch (e: any) {
			const detail = e.errors ?? 'Request failed';
			toast.add({ severity: 'error', summary: 'Regeneration failed', detail, life: 20000 });
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
			if (tokens.value.length === 1) {
				const newFirst = first.value - 5;
				first.value = newFirst >= 0 ? newFirst : 0;
			}

			await loadLazyData();
			tokenToDelete.value = null;
			deleteDialog.value = false;
		} catch (e: any) {
			const detail = e.errors ?? 'Request failed';
			toast.add({ severity: 'error', summary: 'Deletion failed', detail, life: 20000 });
		}
	};
</script>
