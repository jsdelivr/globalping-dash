type TreeNode = {
	key: string;
	label: string;
	data?: unknown;
	children?: TreeNode[];
} & Record<string, unknown>;

export const renderTreeSelectValue = (selected: Array<TreeNode>, treeNodes: Array<TreeNode>) => {
	if (!selected?.length) {
		return 'Select Items';
	}

	const nodeCount = treeNodes.reduce((acc, node) => acc + (node.children?.length || 0) + 1, 0);

	if (selected.length === nodeCount) {
		return 'All';
	}

	const getNodeLabels = (node: TreeNode): string[] => {
		if (node.children?.length) {
			const allChildrenSelected = node.children.every(child => selected.includes(child));

			if (allChildrenSelected) {
				return [ node.label ];
			}

			return node.children.map(child => getNodeLabels(child)).flat();
		}

		return selected.includes(node) ? [ node.label ] : [];
	};

	return treeNodes.reduce<string[]>((acc, node) => [ ...acc, ...getNodeLabels(node) ], []).join(', ');
};

/**
 * Build a node-tree forest used by PrimeVue's Tree and TreeSelect components.
 * @param keyToData - A map of keys to data objects. Keys are expected in the format "(parent key)-(child suffix)" -- as in PrimeVue's TreeSelect example.
 * @param getLabel - A mapping function from a node key to its label.
 * @returns An array of root tree nodes.
 */
export const buildNodesByKey = (keyToData: Record<string, never>, getLabel: (key: string) => string): TreeNode[] => {
	const nodeMap: Record<string, TreeNode> = {};

	// create all tree nodes
	for (const [ key, data ] of Object.entries(keyToData)) {
		nodeMap[key] = {
			key,
			label: getLabel(key),
			data,
			children: [],
		};
	}

	// link by children to parents via prefix, e.g.; key "1-2" means parent "1" has child "1-2"
	const roots = [];

	for (const key of Object.keys(nodeMap)) {
		const node = nodeMap[key]!;
		const parentKey = key.includes('-') ? key.slice(0, key.lastIndexOf('-')) : null;
		const parentNode = parentKey ? nodeMap[parentKey] : null;

		if (parentNode) {
			parentNode.children!.push(node);
		} else {
			roots.push(node);
		}
	}

	return roots;
};
