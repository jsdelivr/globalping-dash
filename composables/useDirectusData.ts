import type { AsyncDataOptions } from '#app';
import type { RestCommand } from '@directus/sdk';
import { useDirectusFetch } from '~/composables/useDirectusFetch';

export const useDirectusData = async <ReturnType, DefaultType = ReturnType | null>(
	command: MaybeRefOrGetter<RestCommand<ReturnType, never>>,
	options?: Omit<AsyncDataOptions<ReturnType>, 'default'> & { default?: MaybeRefOrGetter<DefaultType> },
	key?: MaybeRefOrGetter<string>) => {
	const { data, error } = await useDirectusFetch<ReturnType, DefaultType>(command, options, key);

	if (error.value) {
		throw error.value;
	}

	if (data.value == null) {
		throw new Error('Directus fetch returned no data');
	}

	return data.value;
};
