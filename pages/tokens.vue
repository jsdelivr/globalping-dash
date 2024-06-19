<template>
	<div class="bg-surface-50 flex h-full flex-col p-6">
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
				:row-class="() => '!bg-surface-0 align-middle'"
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
				<Column :row-editor="true" header-class="pl-1 pt-3">
					<template #body="slotProps">
						<TokenOptions
							@edit="openTokenDetails('edit', slotProps.data.id)"
							@regenerate="regenerateToken(slotProps.data.id)"
							@delete="deleteToken(slotProps.data.id)"
						/>
					</template>
				</Column>
				<template #expansion="slotProps">
					<div class="bg-surface-50 rounded-xl flex p-4">
						<div><i class="pi pi-info-circle text-xl mr-3"/></div>
						<div>
							<p class="font-bold">Don't forget to copy your new personal access token.</p>
							<p class="mt-2">This secret won't be shown again for your security.</p>
							<CodeBlock class="mt-2" :commands="[[generatedToken!.value]]" />
						</div>
						<div class="ml-auto">
							<Button icon="pi pi-times" severity="secondary" text rounded aria-label="Close" @click="resetState" />
						</div>
					</div>
				</template>
			</DataTable>
			<Paginator
				class="mt-9"
				:first="first"
				:rows="5"
				:total-records="tokensCount"
				template="PrevPageLink PageLinks NextPageLink"
				@page="onPage($event)"
			/>
		</div>
		<div v-else-if="!loading" class="bg-surface-0 mt-6 rounded-xl border px-4 py-3">
			<div class="bg-surface-50 rounded-xl py-6 text-center">
				<p class="font-semibold">No data to show</p>
				<p class="mt-4">Adopt a probe or become a sponsor to track your credit usage</p>
			</div>
		</div>
		<Dialog
			v-model:visible="tokenDetailsDialog"
			class="min-w-[700px]"
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
	</div>
</template>

<script setup lang="ts">
	import { aggregate, customEndpoint, deleteItem, readItems, updateItem } from '@directus/sdk';
	import type { PageState } from 'primevue/paginator';

	const { $directus } = useNuxtApp();
	const toast = useToast();

	const loading = ref(false);
	const tokensCount = ref(0);
	const tokens = ref<Token[]>([]);
	const first = ref(0);

	const loadLazyData = async () => {
		loading.value = true;

		const [ gpTokens, [{ count }] ] = await Promise.all([
			$directus.request(readItems('gp_tokens', {
				offset: first.value,
				limit: 5,
				sort: '-date_created',
			})),
			$directus.request<[{count: number}]>(aggregate('gp_tokens', { aggregate: { count: '*' } })),
		]);

		tokens.value = gpTokens;
		tokensCount.value = count;
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
	}

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

	// ACTIONS

	const regenerateToken = async (id: number) => {
		try {
			const token = await $directus.request(customEndpoint<string>({ method: 'POST', path: '/token-generator' }));

			await $directus.request(updateItem('gp_tokens', id, {
				value: token,
			}));

			generatedToken.value = { id, value: token };
			expandedRows.value = { [id]: true };
		} catch (e: any) {
			const detail = e.errors ?? 'Request failed';
			toast.add({ severity: 'error', summary: 'Regeneration failed', detail, life: 20000 });
		}
	};

	const deleteToken = async (id: number) => {
		try {
			await $directus.request(deleteItem('gp_tokens', id));
			await loadLazyData(); // here may be the empty list

		} catch (e: any) {
			const detail = e.errors ?? 'Request failed';
			toast.add({ severity: 'error', summary: 'Deletion failed', detail, life: 20000 });
		}
	}
</script>
