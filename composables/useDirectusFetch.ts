import type { AsyncDataOptions, AsyncData } from '#app';
import type { RestCommand } from '@directus/sdk';

function generateFetchKey<ReturnType> (command: RestCommand<ReturnType, never>): string {
	const { path, params = {} } = command();
	const paramString = Object.keys(params).sort().map((key) => {
		return `${key}=${params[key]}`;
	});

	return [ path, ...paramString ].join('&');
}

type ExportType<ReturnType, DefaultType = ReturnType | null> = DefaultType extends null ? AsyncData<ReturnType, any> : Omit<AsyncData<ReturnType, any>, 'data'> & { data: Ref<ReturnType> };

export const useDirectusFetch = <ReturnType, DefaultType = ReturnType | null>(
	command: MaybeRefOrGetter<RestCommand<ReturnType, never>>,
	options?: Omit<AsyncDataOptions<ReturnType>, 'default'> & { default?: MaybeRefOrGetter<DefaultType> },
	key?: MaybeRefOrGetter<string>): ExportType<ReturnType, DefaultType> => {
	const { $directus } = useNuxtApp();
	const fetcher = () => $directus.request<ReturnType>(toValue(command));
	const fetchKey = key ?? generateFetchKey(toValue(command));

	const { default: defaultData, ...opts } = options ?? {};

	if (defaultData) {
		const { data, ...remainder } = useAsyncData<ReturnType>(fetchKey, fetcher, opts);
		return { data: data ?? toRef(defaultData), ...remainder } as ExportType<ReturnType, DefaultType>;
	}

	return useAsyncData<ReturnType>(fetchKey, fetcher, opts) as ExportType<ReturnType, DefaultType>;
};
