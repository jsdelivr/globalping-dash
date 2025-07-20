export interface PaginationOptions {
	active?: MaybeRefOrGetter<boolean>;
	itemsPerPage: Ref<number>;
	limitKey?: string;
	pageKey?: string;
}

export const usePagination = ({ active = () => true, itemsPerPage, limitKey = 'limit', pageKey = 'page' }: PaginationOptions) => {
	const page = ref(0);
	const route = useRoute();
	const windowSize = useWindowSize();

	watch(() => route.query[pageKey], () => {
		if (toValue(active)) {
			page.value = route.query[pageKey] ? Number(route.query[pageKey]) - 1 : 0;

			if (route.query[limitKey]) {
				itemsPerPage.value = Number(route.query[limitKey]);
			}
		}
	}, { immediate: true });

	return {
		page: computed({
			get: () => page.value,
			set: (newPage: number) => {
				page.value = newPage;

				navigateTo({
					path: route.path,
					query: {
						...route.query,
						[pageKey]: newPage ? newPage + 1 : undefined,
						[limitKey]: newPage ? itemsPerPage.value : undefined,
					},
				});
			},
		}),
		first: computed(() => page.value * itemsPerPage.value),
		pageLinkSize: computed(() => windowSize.width.value <= 640 ? 3 : 5),
		template: 'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink',
	};
};
