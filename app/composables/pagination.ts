export interface PaginationOptions {
	active?: MaybeRefOrGetter<boolean>;
	defaultItemsPerPage?: number;
	itemsPerPage: Ref<number>;
	limitKey?: string;
	pageKey?: string;
}

const getPositiveInteger = (value: unknown) => {
	if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) { return null; }

	const number = Number(value);

	return Number.isSafeInteger(number) ? number : null;
};

export const usePagination = ({ active = () => true, defaultItemsPerPage, itemsPerPage, limitKey = 'limit', pageKey = 'page' }: PaginationOptions) => {
	const page = ref(0);
	const route = useRoute();
	const windowSize = useWindowSize();

	watch(() => [ route.query[pageKey], route.query[limitKey] ], ([ pageQuery, limitQuery ]) => {
		if (toValue(active)) {
			page.value = (getPositiveInteger(pageQuery) || 1) - 1;

			const limit = getPositiveInteger(limitQuery);

			if (limit) {
				itemsPerPage.value = limit;
			} else if (defaultItemsPerPage !== undefined) {
				itemsPerPage.value = defaultItemsPerPage;
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
