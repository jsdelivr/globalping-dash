<template>
	<div class="flex w-full flex-col gap-4">
		<div class="flex flex-col gap-1">
			<span class="flex items-center font-bold">Status:</span>
			<Select
				v-model="status"
				:options="statusOptions"
				:pt="{ listContainer: { class: '!max-h-64' } }"
				option-label="code"
				class="h-9 w-full"
			>
				<template #option="{option}: {option: StatusOption}">
					<span class="flex h-full items-center gap-2">
						<span
							:class="{
								'font-bold text-bluegray-900 dark:text-white': option.code === status.code,
								'text-bluegray-400': option.code !== status.code
							}">
							{{ option.name }}
						</span>
						<Tag
							class="-my-0.5"
							:class="{
								'bg-primary text-white dark:bg-white dark:text-bluegray-900 ': option.code === status.code,
								'border border-surface-300 bg-surface-0 text-bluegray-900 dark:border-dark-600 dark:bg-dark-800 dark:text-surface-0': option.code !== status.code
							}">
							{{ statusCounts[option.code] }}
						</Tag>
					</span>
				</template>

				<template #value="{value}: {value: StatusOption}">
					<span class="flex h-full items-center gap-2">
						<span class="text-bluegray-400">{{ value.name }}</span>
						<Tag class="-my-1 border ">{{ statusCounts[value.code] }}</Tag>
					</span>
				</template>
			</Select>
		</div>
		<InputGroup class="flex !w-full flex-col gap-1">
			<span class="flex items-center font-bold">Filter:</span>
			<IconField class="h-9 !w-full">
				<InputIcon class="pi pi-search"/>
				<InputText v-model="filter" class="m-0 size-full" placeholder="Filter by name, location, or tags"/>
			</IconField>
		</InputGroup>

		<div class="flex flex-col gap-1">
			<span class="flex items-center font-bold">Sort by:</span>
			<div class="flex rounded-md border">
				<Select
					v-model="by"
					:options="[...SORTABLE_FIELDS]"
					:pt="{ listContainer: { class: '!max-h-64' } }"
					option-label="sort-by"
					class="flex h-9 w-full items-center rounded-none rounded-l-md border-r border-none"
					unstyled
				>
					<template #option="{option}">
						<span class="flex h-full items-center gap-2 py-[3px]">
							<span
								:class="{
									'font-bold text-bluegray-900 dark:text-white': option === by,
									'text-bluegray-400': option!== by
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
					v-model="desc"
					on-icon="pi pi-sort-amount-down"
					off-icon="pi pi-sort-amount-up-alt"
					on-label=""
					off-label=""
					class="icon-only-toggle gap-none h-9 rounded-none rounded-r-md before:content-none"
					unstyled
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
	import { type StatusCode, type StatusOption, SORTABLE_FIELDS } from '~/composables/useProbeFilters';

	const { defaultValues, statusOptions, statusCounts } = defineProps({
		defaultValues: {
			required: true,
			type: Object as PropType<{
				filter: string;
				by: string;
				desc: boolean;
				status: StatusOption;
			}>,
		},
		statusOptions: {
			required: true,
			type: Array as PropType<StatusOption[]>,
		},
		statusCounts: {
			required: true,
			type: Object as PropType<Record<StatusCode, number>>,
		},
	});

	const filter = ref(defaultValues.filter);
	const by = ref(defaultValues.by);
	const desc = ref(defaultValues.desc);
	const status = ref(defaultValues.status);

	const sortNameMap: Record<string, string> = {
		name: 'Name',
		location: 'Location',
		tags: 'Tag count',
	};

	type Payload = {
		filter: string;
		by: string;
		desc: boolean;
		status: StatusCode;
	};

	const emit = defineEmits<{
		(e: 'apply', payload: Payload): void;
	}>();

	const onApply = () => {
		emit('apply', {
			filter: filter.value,
			by: by.value,
			desc: desc.value,
			status: status.value.code,
		});
	};

</script>
