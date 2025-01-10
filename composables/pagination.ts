const route = useRoute();

export interface PaginationOptions {
	active?: () => boolean;
	itemsPerPage: number;
	paramKey?: string;
}

export const usePagination = ({ active = () => true, itemsPerPage, paramKey = 'page' }: PaginationOptions) => {
	const page = ref(0);

	watch(() => route.query[paramKey], () => {
		if (active()) {
			page.value = route.query[paramKey] ? Number(route.query[paramKey]) - 1 : 0;
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
						[paramKey]: newPage ? newPage + 1 : undefined,
					},
				});
			},
		}),
		first: computed(() => page.value * itemsPerPage),
	};
};
