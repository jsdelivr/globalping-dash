export const usePublicIp = () => {
	const config = useRuntimeConfig();

	const { data, error } = useFetch<string | null>(
		`${config.public.serverUrl}/api/client-ip`,
		{
			default: () => null,
		},
	);

	watch(error, () => {
		if (error.value) {
			console.error('Error fetching client ip', error.value);
		}
	});

	return data;
};
