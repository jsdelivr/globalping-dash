<template>
	<div class="flex items-center justify-end gap-4">
		Type:
		<TreeSelect
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
			@hide="onHide"
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
	import isEqual from 'lodash/isEqual';
	import { FIELD_LABELS, TYPE_REASONS, useCreditsFilters } from '~/composables/useCreditsFilters';
	import { buildNodesByKey, renderTreeSelectValue } from '~/utils/tree-select.ts';

	const { filter, onParamChange, key: creditsFilterKey } = useCreditsFilters();

	// TREE SELECT STRUCTURE DEFINITIONS

	// e.g., 0-0 -> { field: 'reason', value: 'adopted-probes' }
	const keyValueMap = Object.entries(TYPE_REASONS).reduce((map, [ key, reasons ], index) => {
		map[index] = { field: 'type', value: key };

		reasons.forEach((reason, reasonIndex) => {
			map[`${index}-${reasonIndex}`] = { field: 'reason', value: reason };
		});

		return map;
	}, {});

	const getNodeLabelForKey = (key) => {
		const { field, value } = keyValueMap[key];
		return FIELD_LABELS[field][value];
	};

	const nodes = ref(buildNodesByKey(keyValueMap, getNodeLabelForKey));

	// expand all nodes that have children
	const expandedKeys = computed(() => nodes.value.reduce((expanded, node) => {
		if (node.children?.length) {
			expanded[node.key] = true;
		}

		return expanded;
	}, {}));

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

	watch(creditsFilterKey, applyFilter, { immediate: true });

	// HANDLERS

	const onChange = () => {
		if (selectedCount.value === 0) {
			return;
		}

		const suggestedFilter = Object.entries(selectedValues.value).reduce((selected, [ key, { checked, partialChecked }]) => {
			if (checked || partialChecked) {
				const { field, value } = keyValueMap[key];
				selected[field].push(value);
			}

			return selected;
		}, {
			type: [],
			reason: [],
		});

		// do not reset page (via onParamChange) if there is no filter change
		if (!isEqual(suggestedFilter, filter.value)) {
			filter.value = suggestedFilter;
			onParamChange();
		}
	};

	const onChangeDebounced = debounce(onChange, 350);

	const onHide = () => {
		onChangeDebounced.flush();
		applyFilter();
	};

	onBeforeUnmount(() => {
		onChangeDebounced.cancel();
	});
</script>
