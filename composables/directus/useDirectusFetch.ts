import type { AsyncData, AsyncDataOptions } from '#app';
import type { RestCommand } from '@directus/sdk';

export type UseDirectusCommand<RetT> = MaybeRefOrGetter<RestCommand<RetT, DirectusSchema>>;

export type UseDirectusResponse<RetT, DefT = RetT | null> = DefT extends null ? AsyncData<RetT, unknown> : Omit<AsyncData<RetT, unknown>, 'data'> & { data: Ref<RetT> };

export type UseDirectusOptions<RetT, DefT = RetT | null> = Omit<AsyncDataOptions<RetT>, 'default'> & { default?: MaybeRefOrGetter<DefT>; key?: MaybeRefOrGetter<string> };


function isRestCommand<RetT> (command: UseDirectusCommand<RetT>): command is RestCommand<RetT, unknown> {
	return typeof toValue(command) === 'object';
}

export function getRestCommandValue<RetT> (command: UseDirectusCommand<RetT>): RestCommand<RetT, unknown> {
	return isRestCommand(command) ? command : toValue(command);
}

function generateFetchKey<RetT> (command: RestCommand<RetT, unknown>): string {
	const { path, params = {} } = command();
	const paramString = Object.keys(params).sort().map((key) => {
		return `${key}=${params[key]}`;
	});

	return [ path, ...paramString ].join('&');
}

export const useDirectusFetch = <RetT, DefT = RetT | null>(command: UseDirectusCommand<RetT>, options?: UseDirectusOptions<RetT, DefT>): UseDirectusResponse<RetT, DefT> => {
	const { $directus } = useNuxtApp();

	const fetcher = computed(() => () => $directus.request<RetT>(getRestCommandValue(command)));
	const fetchKey = computed(() => options?.key ?? generateFetchKey(getRestCommandValue(command)));

	const { default: defaultData, ...opts } = options ?? {};

	if (defaultData) {
		const { data, ...remainder } = useAsyncData<RetT>(fetchKey.value, fetcher.value, opts);
		return { data: data ?? toRef(defaultData), ...remainder } as UseDirectusResponse<RetT, DefT>;
	}

	return useAsyncData<RetT>(fetchKey.value, fetcher.value, opts) as UseDirectusResponse<RetT, DefT>;
};
