<template>
	<div class="flex w-full flex-col gap-4">
		<div class="flex flex-col gap-1">
			<span class="flex items-center font-bold">Status:</span>
			<Select
				v-model="draftFilter.status"
				:options="STATUS_CODES"
				:pt="{ listContainer: { class: '!max-h-64' } }"
				option-label="code"
				class="h-9 w-full"
			>
				<template #option="{option}: {option: StatusCode}">
					<span class="flex h-full items-center gap-2">
						<span
							:class="{
								'font-bold text-bluegray-900 dark:text-white': option === draftFilter.status,
								'text-bluegray-400': option !== draftFilter.status
							}">
							{{ STATUS_MAP[option].name }}
						</span>
						<Tag
							class="-my-0.5"
							:class="{
								'bg-primary text-white dark:bg-white dark:text-bluegray-900 ': option === draftFilter.status,
								'border border-surface-300 bg-surface-0 text-bluegray-900 dark:border-dark-600 dark:bg-dark-800 dark:text-surface-0': option !== draftFilter.status
							}">
							{{ statusCounts[option] }}
						</Tag>
					</span>
				</template>

				<template #value="{value}: {value: StatusCode}">
					<span class="flex h-full items-center gap-2">
						<span class="text-bluegray-400">{{ STATUS_MAP[value].name }}</span>
						<Tag class="-my-1 border ">{{ statusCounts[value] }}</Tag>
					</span>
				</template>
			</Select>
		</div>
		<InputGroup class="flex !w-full flex-col gap-1">
			<span class="flex items-center font-bold">Filter:</span>
			<IconField class="h-9 !w-full">
				<InputIcon class="pi pi-search"/>
				<InputText v-model="draftFilter.search" class="m-0 size-full" placeholder="Filter by name, location, or tags"/>
			</IconField>
		</InputGroup>

		<div class="flex flex-col gap-1">
			<span class="flex items-center font-bold">Sort by:</span>
			<div class="flex rounded-md border">
				<Select
					v-model="draftFilter.by"
					:options="SORTABLE_FIELDS"
					:pt="{ listContainer: { class: '!max-h-64' } }"
					option-label="sort-by"
					class="flex h-9 w-full items-center rounded-none rounded-l-md border-r border-none"
					unstyled
				>
					<template #option="{option}">
						<span class="flex h-full items-center gap-2 py-[3px]">
							<span
								:class="{
									'font-bold text-bluegray-900 dark:text-white': option === draftFilter.by,
									'text-bluegray-400': option!== draftFilter.by
								}">
								{{ sortNameMap[option] }}
							</span>
						</span>
					</template>

					<template #value="{value}">
						<span class="flex h-full items-center gap-2">
							<span class="text-bluegray-400">{{ sortNameMap[value] }}</span>
						</span>
					</template>
				</Select>
				<ToggleButton
					v-model="draftFilter.desc"
					on-icon="pi pi-sort-amount-down"
					off-icon="pi pi-sort-amount-up-alt"
					on-label=""
					off-label=""
					class="icon-only-toggle gap-none h-9 rounded-none rounded-r-md before:content-none"
				/>
			</div>
		</div>

		<Button
			class="ml-auto mt-4 w-32"
			label="Apply"
			@click="onApply"
		/>
	</div>
</template>

<script setup lang="ts">
	import {
		type StatusCode,
		type Filter,
		SORTABLE_FIELDS,
		STATUS_MAP,
	} from '~/composables/useProbeFilters';

	const { filter, statusCounts } = defineProps({
		filter: {
			required: true,
			type: Object as PropType<Filter>,
		},
		statusCounts: {
			required: true,
			type: Object as PropType<Record<StatusCode, number>>,
		},
	});

	const draftFilter = ref({ ...filter });

	const STATUS_CODES = Object.keys(STATUS_MAP) as StatusCode[];

	const sortNameMap: Record<string, string> = {
		name: 'Name',
		location: 'Location',
		tags: 'Tag count',
	};

	const emit = defineEmits<{
		(e: 'apply', payload: Filter): void;
	}>();

	const onApply = () => {
		emit('apply', draftFilter.value);
	};

</script>
