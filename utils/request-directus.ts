import { useDirectusFetch, type UseDirectusCommand, type UseDirectusOptions } from '~/composables/directus/useDirectusFetch';

export const requestDirectus = async <RetT, DefT = RetT | null>(command: UseDirectusCommand<RetT>, options?: UseDirectusOptions<RetT, DefT>): Promise<RetT> => {
	const { data, error } = await useDirectusFetch<RetT, DefT>(command, options);

	if (error.value) {
		throw error.value;
	}

	if (data.value == null) {
		throw new Error('Directus fetch returned no data');
	}

	return data.value;
};
