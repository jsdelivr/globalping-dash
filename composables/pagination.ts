const route = useRoute();

export interface PaginationOptions {
	itemsPerPage: number;
}

export const usePagination = ({ itemsPerPage }: PaginationOptions) => {
	const page = ref(0);
	page.value = route.query.page ? Number(route.query.page) - 1 : 0;

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
