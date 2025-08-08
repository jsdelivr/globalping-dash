import type { AsyncData, AsyncDataOptions } from '#app';
import type { RestCommand } from '@directus/sdk';
import { sendErrorToast } from '~/utils/send-toast';

export type DirectusCommand<RetT> = MaybeRefOrGetter<RestCommand<RetT, DirectusSchema>>;

type BaseOpts<RetT> = Omit<AsyncDataOptions<RetT>, 'default'> & { key?: MaybeRefOrGetter<string>; displayErrors?: boolean };
type OptsWithDefault<RetT> = BaseOpts<RetT> & { default: MaybeRefOrGetter<RetT> };
type OptsWithoutDefault<RetT> = BaseOpts<RetT> & { default?: undefined };


function isRestCommand<RetT> (command: DirectusCommand<RetT>): command is RestCommand<RetT, unknown> {
	return typeof toValue(command) === 'object';
}

export function getRestCommandValue<RetT> (command: DirectusCommand<RetT>): RestCommand<RetT, unknown> {
	return isRestCommand(command) ? command : toValue(command);
}

function generateFetchKey<RetT> (command: RestCommand<RetT, unknown>): string {
	const { path, params = {} } = command();
	const paramString = Object.keys(params).sort().map((key) => {
		return `${key}=${params[key]}`;
	});

	return [ path, ...paramString ].join('&');
}

export function useDirectusFetch<RetT> (
	command: DirectusCommand<RetT>,
	options: OptsWithDefault<RetT>
): Omit<AsyncData<RetT, unknown>, 'data'> & { data: Ref<RetT> };

export function useDirectusFetch<RetT> (
	command: DirectusCommand<RetT>,
	options?: OptsWithoutDefault<RetT>
): AsyncData<RetT | null, unknown>;

export function useDirectusFetch<RetT> (command: DirectusCommand<RetT>, options?: OptsWithDefault<RetT> | OptsWithoutDefault<RetT>) {
	const { $directus } = useNuxtApp();

	const fetcher = computed(() => () => $directus.request<RetT>(getRestCommandValue(command)));
	const fetchKey = computed(() => options?.key ?? generateFetchKey(getRestCommandValue(command)));

	const { default: defaultData, displayErrors = true, ...opts } = options ?? {};

	const { data, error, ...remainder } = useAsyncData<RetT>(fetchKey.value, fetcher.value, opts);
	const passedData = computed(() => defaultData && !data.value ? toValue(defaultData) : data.value);

	watch(error, (newError) => {
		if (displayErrors && newError) {
			sendErrorToast(newError);
		}
	});

	if (('default' in (options ?? {})) && defaultData) {
		return { data: passedData as Ref<RetT>, error, ...remainder };
	}

	return { data: passedData as Ref<RetT | null>, error, ...remainder };
}
