const route = useRoute();

export interface PaginationOptions {
	active?: () => boolean;
	itemsPerPage: number;
}

export const usePagination = ({ active = () => true, itemsPerPage }: PaginationOptions) => {
	const page = ref(0);

	watch(() => route.query.page, () => {
		if (active()) {
			page.value = route.query.page ? Number(route.query.page) - 1 : 0;
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
						page: newPage ? newPage + 1 : undefined,
					},
				});
			},
		}),
		first: computed(() => page.value * itemsPerPage),
	};
};
