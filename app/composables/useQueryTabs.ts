// Keeps the active tab in the `tab` query, so switching tabs is a navigation that the router guards apply to.
export const useQueryTabs = (tabNames: MaybeRefOrGetter<string[]>, defaultTab: string) => {
	const route = useRoute();
	const router = useRouter();

	const selectedTab = ref(defaultTab);

	// A tab that is no longer available, e.g. after losing the org admin role, falls back to the default one.
	const activeTab = computed(() => toValue(tabNames).includes(selectedTab.value) ? selectedTab.value : defaultTab);

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
			selectedTab.value = newTab;
			return;
		}

		const { tab, ...rest } = route.query;
		router.replace({ query: { ...rest } });
		selectedTab.value = defaultTab;
	}, { immediate: true });

	return { activeTab, setActiveTab, selectTab, selectTabWithKeyboard };
};
