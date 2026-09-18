<template>
	<div class="flex w-full min-w-0 flex-col gap-2 border-b bg-surface-0 px-3 py-2 text-gray-700 sm:flex-row sm:flex-wrap sm:items-start dark:bg-dark-800 dark:text-gray-300">
		<div v-if="renderedCount" class="flex min-h-9 min-w-0 items-center break-words sm:mr-auto">
			<span v-if="filterReplacementPending && requestPending && enabled && !initialLoadPending" class="flex" role="status" aria-live="polite">
				<ProbeDotLoader/>
				<span class="sr-only">Loading filtered logs</span>
			</span>
			<span v-else-if="filterReplacementPending && loadFailed && enabled" role="status" aria-live="polite">
				Unable to load filtered logs. Retrying…
			</span>
			<span v-else-if="filterReplacementPending && !enabled" role="status" aria-live="polite">
				{{ emptyStateText }}
			</span>
			<span v-else-if="!filterReplacementPending" class="font-bold">
				<template v-if="renderedCount !== loadedCount">
					Showing {{ formatNumber(renderedCount) }} of {{ formatNumber(loadedCount) }} loaded {{ filtersActive ? 'matching logs' : 'logs' }}.
				</template>
				<template v-else-if="filtersActive">
					Showing {{ formatNumber(renderedCount) }} matching {{ pluralize('log', renderedCount) }}.
				</template>
				<template v-else>
					Showing {{ formatNumber(renderedCount) }} <span class="hidden sm:inline">most recent</span> {{ pluralize('log', renderedCount) }}.
				</template>
			</span>
		</div>

		<div class="flex w-full min-w-0 flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:flex-wrap sm:items-start sm:justify-end">
			<div class="w-full min-w-0 sm:w-56">
				<label for="probe-log-search" class="sr-only">Search log messages</label>
				<IconField class="h-9 w-full">
					<InputIcon class="pi pi-search !mt-0 -translate-y-1/2 text-sm"/>
					<InputText
						id="probe-log-search"
						v-model="searchInput"
						autocomplete="off"
						class="size-full !pb-[8.5px] text-sm"
						placeholder="Search logs"
						:maxlength="SEARCH_MAX_LENGTH"
						@input="emit('search-input')"
					/>
				</IconField>
			</div>

			<div class="w-full min-w-0 sm:w-64">
				<label for="probe-log-scopes" class="sr-only">Filter logs by scope</label>
				<MultiSelect
					v-model="scopeInput"
					input-id="probe-log-scopes"
					class="w-full"
					placeholder="Scopes"
					filter-placeholder="Find a scope"
					filter
					reset-filter-on-hide
					:options="scopeOptions"
					:option-disabled="isScopeOptionDisabled"
					:show-toggle-all="false"
					scroll-height="15rem"
					overlay-class="w-[calc(100vw-2rem)] !min-w-0 max-sm:!start-[1rem] sm:w-80"
					:pt="{
						root: { class: 'h-9 text-sm' },
						label: { class: '!flex min-w-0 flex-1 items-center !py-0 !pl-2 !pr-0 !text-sm !leading-none' },
						dropdown: { class: 'h-full !w-9' },
					}"
					:pt-options="{ mergeProps: true }"
					@update:model-value="onScopesUpdated"
				>
					<template #value>
						<div class="flex min-w-0 flex-1 items-center gap-2 pl-1 text-bluegray-900 dark:text-surface-0">
							<i class="pi pi-filter shrink-0 text-xs text-bluegray-400" aria-hidden="true"/>
							<span>Scopes</span>
							<span v-if="scopeInput.length" class="flex h-[22px] min-w-[22px] shrink-0 items-center justify-center rounded border border-surface-200 bg-surface-50 px-1 text-center text-[11px] font-bold dark:border-dark-500 dark:bg-dark-700">
								{{ scopeInput.length }}
							</span>
							<span v-else class="text-bluegray-400">All</span>
						</div>
					</template>

					<template #header>
						<div class="flex shrink-0 flex-wrap items-center justify-between gap-x-2 gap-y-1 px-4 pt-3.5">
							<span class="text-sm font-bold text-bluegray-900 dark:text-surface-0">Filter by scope</span>
							<span class="text-[11px] text-bluegray-400">{{ scopeOptions.length }} {{ pluralize('scope', scopeOptions.length) }}</span>
						</div>
					</template>

					<template #option="{ option }">
						<span class="min-w-0 flex-1 truncate text-xs" :title="option">{{ option }}</span>
					</template>

					<template #footer>
						<div class="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-surface-200 px-4 py-2.5 text-xs text-bluegray-400 dark:border-dark-500">
							<span>{{ scopeInput.length ? `${scopeInput.length} selected` : 'All scopes included' }}</span>
							<button
								v-if="scopeInput.length"
								type="button"
								class="font-medium text-bluegray-800 underline decoration-bluegray-400 underline-offset-2 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary dark:text-surface-100"
								@click.stop="clearScopes"
							>
								Clear all
							</button>
						</div>
					</template>
				</MultiSelect>
			</div>

			<label
				class="flex h-9 cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-md border border-gray-500 px-2 duration-200 focus-within:outline-none focus-within:ring-1 focus-within:ring-primary focus-within:ring-offset-2 sm:justify-end dark:border-gray-400 dark:ring-offset-dark-800"
				:class="{
					'border-primary text-primary dark:border-primary': enabled,
				}"
			>
				<input v-model="enabled" type="checkbox" class="sr-only">
				<i v-if="enabled" class="pi pi-pause-circle text-[16px]" aria-hidden="true"/>
				<i v-else class="pi pi-play-circle text-[16px]" aria-hidden="true"/>
				Live tail
			</label>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { canAppendProbeLogScope, SEARCH_MAX_LENGTH } from '~/composables/useProbeLogFilters';
	import { formatNumber } from '~/utils/format-number';
	import { pluralize } from '~/utils/pluralize';

	defineProps<{
		renderedCount: number;
		loadedCount: number;
		filtersActive: boolean;
		filterReplacementPending: boolean;
		requestPending: boolean;
		initialLoadPending: boolean;
		loadFailed: boolean;
		emptyStateText: string;
		scopeOptions: string[];
	}>();

	const emit = defineEmits<{
		'search-input': [];
		'scopes-updated': [ scopes: string[] ];
	}>();

	const searchInput = defineModel<string>('searchInput', { required: true });
	const scopeInput = defineModel<string[]>('scopeInput', { required: true });
	const enabled = defineModel<boolean>('enabled', { required: true });

	const isScopeOptionDisabled = (scope: string) => !scopeInput.value.includes(scope) && !canAppendProbeLogScope(scopeInput.value, scope);

	const onScopesUpdated = (scopes: string[]) => {
		emit('scopes-updated', scopes);
	};

	const clearScopes = () => {
		scopeInput.value = [];
		onScopesUpdated([]);
	};
</script>
