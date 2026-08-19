type UrlSortOptions<T extends string> = {
	defaultField: T;
	defaultOrder: 1 | -1;
	directionKey: string;
	fieldKey: string;
	fields: readonly T[];
	pageKey: string;
};

export const useUrlSort = <T extends string>({ defaultField, defaultOrder, directionKey, fieldKey, fields, pageKey }: UrlSortOptions<T>) => {
	const route = useRoute();
	const sortField = computed<T>(() => typeof route.query[fieldKey] === 'string' && fields.includes(route.query[fieldKey] as T)
		? route.query[fieldKey] as T
		: defaultField);
	const sortOrder = computed<1 | -1>(() => {
		const direction = route.query[directionKey];

		if (direction === 'asc') { return 1; }

		if (direction === 'desc') { return -1; }

		return defaultOrder;
	});
	const setSort = (field: T, order: 1 | -1) => navigateTo({
		path: route.path,
		query: {
			...route.query,
			[fieldKey]: field,
			[directionKey]: order === -1 ? 'desc' : 'asc',
			[pageKey]: undefined,
		},
	});

	return { sortField, sortOrder, setSort };
};
