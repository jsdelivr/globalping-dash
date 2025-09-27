export const useProbeDetailTabs = () => {
	const route = useRoute();
	const router = useRouter();

	type TabName = 'details' | 'logs';
	const TAB_NAMES = [ 'details', 'logs' ];
	const DEFAULT_TAB = 'details';

	const activeTab = ref<TabName>(DEFAULT_TAB);

	watch(activeTab, (val) => {
		if (val === DEFAULT_TAB) {
			const { tab, ...rest } = route.query;
			router.push({ query: { ...rest } });
			return;
		}

		router.push({ query: { ...route.query, tab: val } });
	});

	watch(() => route.query.tab, (newTab) => {
		if (typeof newTab === 'string' && TAB_NAMES.includes(newTab)) {
			activeTab.value = newTab as TabName;
			return;
		}

		const { tab, ...rest } = route.query;
		router.push({ query: { ...rest } });
		activeTab.value = DEFAULT_TAB;
	}, { immediate: true });

	return activeTab;
};
