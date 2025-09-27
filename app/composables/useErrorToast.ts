import type { NuxtError } from '#app';
import isEqual from 'lodash/isEqual';
import { watch, toValue, type MaybeRefOrGetter } from 'vue';
import { sendErrorToast } from '~/utils/send-toast';

export function useErrorToast (...sources: MaybeRefOrGetter<NuxtError | null | undefined>[]) {
	return watch(
		() => sources.map(s => toValue(s)),
		(newVals, oldVals) => {
			newVals.forEach((val, i) => {
				const prev = oldVals[i];

				if (val?.cause && !isEqual(val.cause, prev?.cause)) {
					sendErrorToast(val.cause);
				}
			});
		},
		{ deep: true },
	);
}
