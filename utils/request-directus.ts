import { type UseDirectusCommand, getRestCommandValue } from '~/composables/directus/useDirectusFetch';


// TODO: Refactor and try to utilize $fetch
export const requestDirectus = async <RetT>(command: UseDirectusCommand<RetT>): Promise<RetT> => {
	const { $directus } = useNuxtApp();
	return $directus.request<RetT>(getRestCommandValue(command));
};
