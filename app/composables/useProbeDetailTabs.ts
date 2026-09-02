export const useProbeDetailTabs = () => {
	const route = useRoute();
	const router = useRouter();

	type TabName = 'details' | 'logs' | 'settings';
	const TAB_NAMES = [ 'details', 'logs', 'settings' ];
	const DEFAULT_TAB = 'details';

	const activeTab = ref<TabName>(DEFAULT_TAB);

	const setActiveTab = (value: string | number) => {
		if (typeof value !== 'string' || !TAB_NAMES.includes(value) || value === activeTab.value) {
			return;
		}

		if (value === DEFAULT_TAB) {
			const { tab, ...rest } = route.query;
			router.push({ query: { ...rest } });
			return;
		}

		router.push({ query: { ...route.query, tab: value } });
	};

	watch(() => route.query.tab, (newTab) => {
		if (typeof newTab === 'string' && TAB_NAMES.includes(newTab)) {
			activeTab.value = newTab as TabName;
			return;
		}

		const { tab, ...rest } = route.query;
		router.push({ query: { ...rest } });
		activeTab.value = DEFAULT_TAB;
	}, { immediate: true });

	return { activeTab, setActiveTab };
};
