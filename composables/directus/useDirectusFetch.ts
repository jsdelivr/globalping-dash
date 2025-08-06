import type { AsyncData, AsyncDataOptions } from '#app';
import type { RestCommand } from '@directus/sdk';

export type UseDirectusCommand<RetT> = RestCommand<RetT, DirectusSchema> | (() => RestCommand<RetT, DirectusSchema>);
export type UseDirectusResponse<RetT, DefT = RetT | null> = DefT extends null ? AsyncData<RetT, unknown> : Omit<AsyncData<RetT, unknown>, 'data'> & { data: Ref<RetT> };
export type UseDirectusOptions<RetT, DefT = RetT | null> = Omit<AsyncDataOptions<RetT>, 'default'> & { default?: MaybeRefOrGetter<DefT>; key?: MaybeRefOrGetter<string> };


function isGetter<RetT, Schema> (command: UseDirectusCommand<RetT>): command is () => RestCommand<RetT, Schema> {
	return typeof command() === 'function';
}

function getCommandValue<RetT, Schema> (command: UseDirectusCommand<RetT>): RestCommand<RetT, Schema> {
	return isGetter(command) ? command() : command;
}

function generateFetchKey<RetT> (command: RestCommand<RetT, DirectusSchema>): string {
	const { path, params = {} } = command();
	const paramString = Object.keys(params).sort().map((key) => {
		return `${key}=${params[key]}`;
	});

	return [ path, ...paramString ].join('&');
}

export const useDirectusFetch = <RetT, DefT = RetT | null>(command: UseDirectusCommand<RetT>, options?: UseDirectusOptions<RetT, DefT>): UseDirectusResponse<RetT, DefT> => {
	const { $directus } = useNuxtApp();

	const fetcher = computed(() => () => $directus.request<RetT>(getCommandValue(command)));
	const fetchKey = computed(() => options?.key ?? generateFetchKey(getCommandValue(command)));

	const { default: defaultData, ...opts } = options ?? {};

	if (defaultData) {
		const { data, ...remainder } = useAsyncData<RetT>(fetchKey.value, fetcher.value, opts);
		return { data: data ?? toRef(defaultData), ...remainder } as UseDirectusResponse<RetT, DefT>;
	}

	return useAsyncData<RetT>(fetchKey.value, fetcher.value, opts) as UseDirectusResponse<RetT, DefT>;
};
