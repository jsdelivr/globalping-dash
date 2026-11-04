// Keeps the active tab in the `tab` query, so switching tabs is a navigation that the router guards apply to.
export const useQueryTabs = (tabNames: MaybeRefOrGetter<string[]>, defaultTab: string) => {
	const route = useRoute();
	const router = useRouter();

	const activeTab = ref(defaultTab);

	const setActiveTab = (value: string) => {
		if (!toValue(tabNames).includes(value) || value === activeTab.value) {
			return;
		}

		if (value === defaultTab) {
			const { tab, ...rest } = route.query;
			router.push({ query: { ...rest } });
			return;
		}

		router.push({ query: { ...route.query, tab: value } });
	};

	// The Tab click and key handlers run in the capture phase, so PrimeVue doesn't switch the tab before the route changes.
	const selectTab = (event: Event, value: string) => {
		event.stopImmediatePropagation();
		setActiveTab(value);
	};

	const selectTabWithKeyboard = (event: KeyboardEvent, value: string) => {
		if (![ 'Enter', 'NumpadEnter', 'Space' ].includes(event.code)) {
			return;
		}

		event.preventDefault();
		selectTab(event, value);
	};

	watch(() => route.query.tab, (newTab) => {
		if (typeof newTab === 'string' && toValue(tabNames).includes(newTab)) {
			activeTab.value = newTab;
			return;
		}

		const { tab, ...rest } = route.query;
		router.push({ query: { ...rest } });
		activeTab.value = defaultTab;
	}, { immediate: true });

	return { activeTab, setActiveTab, selectTab, selectTabWithKeyboard };
};
