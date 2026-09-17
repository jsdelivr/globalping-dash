<template>
	<div class="flex w-full flex-col gap-2 border-b bg-surface-0 px-3 py-2 text-gray-700 sm:flex-row sm:flex-wrap sm:items-start dark:bg-dark-800 dark:text-gray-300">
		<div v-if="renderedCount" class="flex min-h-9 items-center sm:mr-auto">
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

		<div class="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:flex-wrap sm:items-start sm:justify-end">
			<div class="w-full sm:w-56">
				<label for="probe-log-search" class="sr-only">Search log messages</label>
				<IconField class="h-9 w-full">
					<InputIcon class="pi pi-search !mt-0 -translate-y-1/2 text-sm"/>
					<InputText
						id="probe-log-search"
						v-model="searchInput"
						autocomplete="off"
						class="size-full text-sm"
						placeholder="Search logs"
						:maxlength="SEARCH_MAX_LENGTH"
						@input="emit('search-input')"
					/>
				</IconField>
			</div>

			<div ref="scopeControl" class="w-full sm:w-64">
				<label for="probe-log-scopes" class="sr-only">Filter logs by scope</label>
				<MultiSelect
					v-model="scopeInput"
					input-id="probe-log-scopes"
					class="w-full"
					placeholder="Filter by scopes"
					filter-placeholder="Find a scope"
					chip-icon="pi pi-times"
					display="chip"
					filter
					reset-filter-on-hide
					:options="scopeOptions"
					:option-disabled="isScopeOptionDisabled"
					:show-toggle-all="false"
					:pt="{
						root: { class: 'h-9 text-sm' },
						labelContainer: {
							class: [
								'relative',
								scopeValuesOverflowing && 'after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:z-10 after:w-8 after:bg-gradient-to-r after:from-transparent after:to-surface-0 dark:after:to-dark-900',
							],
						},
						label: {
							'scope-label': '',
							class: [
								'!py-0 !pr-2 !text-sm !leading-none',
								scopeInput.length
									? '!pl-1 !text-bluegray-900 dark:!text-surface-0'
									: '!pl-2 !text-bluegray-400 dark:!text-bluegray-400',
							],
						},
						chipItem: { class: 'max-w-44' },
						pcChip: {
							root: { class: 'min-w-0 max-w-full w-full justify-between !h-7 !gap-1 !py-0 !text-sm' },
							label: { class: 'min-w-0 flex-1 truncate pb-px pr-0.5 !leading-5' },
							removeIcon: { class: 'order-first !flex !size-4 shrink-0 items-center justify-center !leading-none' },
						},
						dropdown: { class: 'h-full !w-9' },
					}"
					:pt-options="{ mergeProps: true }"
					@update:model-value="onScopesUpdated"
				>
					<template #option="{ option }">
						<span class="min-w-0 flex-1 truncate font-mono text-xs" :title="option">{{ option }}</span>
					</template>
				</MultiSelect>
			</div>

			<label
				class="flex h-9 cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-md border border-gray-500 px-2 duration-200 focus-within:outline-none focus-within:ring-1 focus-within:ring-primary focus-within:ring-offset-2 sm:justify-end dark:border-gray-400"
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
	import { useResizeObserver } from '@vueuse/core';
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

	const scopeControl = ref<HTMLDivElement | null>(null);
	const scopeValuesOverflowing = ref(false);

	const isScopeOptionDisabled = (scope: string) => !scopeInput.value.includes(scope) && !canAppendProbeLogScope(scopeInput.value, scope);

	const onScopesUpdated = (scopes: string[]) => {
		emit('scopes-updated', scopes);
	};

	const updateScopeValuesOverflowing = () => {
		const label = scopeControl.value?.querySelector<HTMLElement>('[scope-label]');

		scopeValuesOverflowing.value = Boolean(label && label.scrollWidth > label.clientWidth);
	};

	useResizeObserver(scopeControl, updateScopeValuesOverflowing);

	watch(scopeInput, () => {
		void nextTick(updateScopeValuesOverflowing);
	});
</script>
