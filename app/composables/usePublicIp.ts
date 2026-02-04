export const usePublicIp = () => {
	const { data, error } = useFetch(
		'https://api.ipify.org?format=json',
		{
			transform: (res: { ip: string }) => res?.ip || null,
			default: () => null,
		},
	);

	watch(error, () => {
		console.error('Error fetching client ip', error.value);
	});

	return data;
};
