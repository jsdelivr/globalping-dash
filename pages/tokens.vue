<template>
	<div class="bg-surface-50 flex h-full flex-col p-6">
		<div class="mb-4 flex">
			<h1 class="col-span-2 text-2xl font-bold">Tokens</h1>
			<Button class="ml-auto" label="Generate new token" @click="generateTokenDialog = true"/>
		</div>
		<p class="xl:w-1/2">Generate a token and add it to your Globalping requests to upper your hourly measurements limit. After the limit is exhausted, you can proceed with measurements by spending the earned credits.</p>
		<div v-if="tokens.length || loading" class="mt-6">
			<DataTable
				:value="tokens"
				lazy
				:first="first"
				:rows="5"
				data-key="id"
				:total-records="tokensCount"
				:loading="loading"
			>
				<Column header="Name" field="name" header-class="pl-1 pt-3 border-none" body-class="border-b-0 border-t"/>
				<Column header="Origins" header-class="pl-1 pt-3 border-none" body-class="border-b-0 border-t">
					<template #body="slotProps">
						<Tag v-for="(origin, index) in slotProps.data.origins" :key="index" class="my-0.5 mr-1 flex py-0.5 font-normal" severity="secondary" :value="origin"/>
					</template>
				</Column>
				<Column header="Created" header-class="pl-1 pt-3 border-none" body-class="border-b-0 border-t">
					<template #body="slotProps">
						{{ getRelativeTimeString(slotProps.data.date_created) || 'Never' }}
					</template>
				</Column>
				<Column header="Last used" header-class="pl-1 pt-3 border-none" body-class="border-b-0 border-t">
					<template #body="slotProps">
						{{ getRelativeTimeString(slotProps.data.date_last_used) || 'Never' }}
					</template>
				</Column>
				<Column header="Expires" header-class="pl-1 pt-3 border-none" body-class="border-b-0 border-t">
					<template #body="slotProps">
						{{ formatDate(slotProps.data.expire) || 'Never' }}
					</template>
				</Column>
				<Column :row-editor="true" header-class="pl-1 pt-3 border-none" body-class="border-b-0 border-t">
					<template #body="slotProps">
						<TokenOptions
							@edit="editToken(slotProps.data.id)"
							@regenerate="regenerateToken(slotProps.data.id)"
							@delete="deleteToken(slotProps.data.id)"
						/>
					</template>
				</Column>
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
			v-model:visible="generateTokenDialog"
			class="min-w-[700px]"
			modal
			dismissable-mask
			:draggable="false"
			header="Generate new token"
			content-class="!p-0"
		>
			<GenerateToken @cancel="generateTokenDialog = false" @generate="loadLazyData"/>
		</Dialog>
	</div>
</template>

<script setup lang="ts">
	import { aggregate, readItems } from '@directus/sdk';
	import type { DataTablePageEvent } from 'primevue/datatable';
	import type { PageState } from 'primevue/paginator';

	const { $directus } = useNuxtApp();


	const loading = ref(false);
	const tokensCount = ref(0);
	const tokens = ref<Token[]>([]);
	const first = ref(0);
	const lazyParams = ref<Partial<DataTablePageEvent>>({});

	const loadLazyData = async (event?: PageState) => {
		loading.value = true;
		lazyParams.value = { ...lazyParams.value, first: event?.first || first.value };

		const [ gpTokens, [{ count }] ] = await Promise.all([
			$directus.request(readItems('gp_tokens', {
				offset: lazyParams.value.first,
				limit: 5,
			})),
			$directus.request<[{count: number}]>(aggregate('gp_tokens', { aggregate: { count: '*' } })),
		]);

		tokens.value = gpTokens;
		tokensCount.value = count;
		loading.value = false;
	};

	onMounted(() => {
		loading.value = true;

		lazyParams.value = {
			first: 0,
			rows: 5,
		};

		loadLazyData();
	});

	const onPage = (event: PageState) => {
		lazyParams.value = event;
		loadLazyData(event);
	};

	const editToken = (...args) => {
		console.log(args);
	};

	const regenerateToken = (...args) => {
		console.log(args);
	};

	const deleteToken = (...args) => {
		console.log(args);
	};

	// GENERATE NEW TOKEN

	const generateTokenDialog = ref(false);
</script>
