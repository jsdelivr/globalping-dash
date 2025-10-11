<template>
	<div class="flex items-center justify-end gap-4">
		Type:
		<TreeSelect
			ref="treeSelectRef"
			v-model="selectedValues"
			:options="nodes"
			selection-mode="checkbox"
			class="w-32 font-normal md:w-56"
			:expanded-keys="expandedKeys"
			:pt="{
				pcTree: {
					root: 'p-0',
					nodeToggleButton: 'hidden',
					node: 'focus:outline-none',
				}
			}"
			@change="onChangeDebounced"
			@hide="applyFilter"
		>
			<template #value="slotProps">
				{{ renderTreeSelectValue(slotProps.value, nodes) }}
			</template>
			<template #option="slotProps">
				<span :class="{'font-bold': slotProps.node.data.field === 'type'}">{{slotProps.node.label}}</span>
			</template>
		</TreeSelect>
	</div>
</template>

<script setup>
	import debounce from 'lodash/debounce';
	import { FIELD_LABELS, TYPE_REASONS, useCreditsFilters } from '~/composables/useCreditsFilters.js';
	import { buildNodesByKey, renderTreeSelectValue } from '~/utils/tree-select.ts';

	const { filter, onParamChange, key } = useCreditsFilters();

	// TREE SELECT STRUCTURE DEFINITIONS

	// e.g., 0-0 -> { field: 'reason', value: 'adopted-probes' }
	const keyValueMap = Object.entries(TYPE_REASONS).reduce((acc, [ key, reasons ], index) => {
		acc[index] = { field: 'type', value: key };

		reasons.forEach((reason, reasonIndex) => {
			acc[`${index}-${reasonIndex}`] = { field: 'reason', value: reason };
		});

		return acc;
	}, {});

	const getNodeLabelForKey = (key) => {
		const { field, value } = keyValueMap[key];
		return FIELD_LABELS[field][value];
	};

	const nodes = ref(buildNodesByKey(keyValueMap, getNodeLabelForKey));

	const expandedKeys = computed(() => nodes.value.reduce((expanded, node) => {
		if (node.children?.length) {
			expanded[node.key] = true;
		}

		return expanded;
	}, {}));

	const treeSelectRef = ref();
	const selectedValues = ref({});
	const selectedCount = computed(() => Object.values(selectedValues.value).filter(value => value.checked).length);

	// FILTER APPLICATION

	const applyFilter = () => {
		// apply selected values from the filter
		const buildSelection = (node, filter, selectedValues) => {
			if (node.children?.length) {
				node.children.forEach((child) => {
					buildSelection(child, filter, selectedValues);
				});

				const checkedChildren = node.children.filter(child => selectedValues[child.key].checked);

				selectedValues[node.key] = {
					checked: checkedChildren.length === node.children.length,
					partialChecked: checkedChildren.length !== node.children.length && checkedChildren.length > 0,
				};
			} else {
				selectedValues[node.key] = {
					checked: filter[node.data.field].includes(node.data.value),
				};
			}

			return selectedValues;
		};

		selectedValues.value = nodes.value.reduce((selected, node) => buildSelection(node, filter.value, selected), {});
	};

	watch(key, applyFilter, { immediate: true });

	// HANDLERS

	const onChange = () => {
		if (selectedCount.value === 0) {
			return;
		}

		const selectedKeys = Object.keys(selectedValues.value);

		filter.value = selectedKeys.reduce((selected, key) => {
			const { field, value } = keyValueMap[key];
			const { checked, partialChecked } = selectedValues.value[key];

			if (checked || partialChecked) {
				selected[field].push(value);
			}

			return selected;
		}, {
			type: [],
			reason: [],
		});

		onParamChange();
	};

	const onChangeDebounced = debounce(onChange, 350);
</script>
