import isEqual from 'lodash/isEqual';
import { watch, toValue, type MaybeRefOrGetter } from 'vue';
import { sendErrorToast } from '~/utils/send-toast';

export function useErrorToast (...sources: MaybeRefOrGetter<unknown>[]) {
	return watch(
		() => sources.map(s => toValue(s)),
		(newVals, oldVals) => {
			newVals.forEach((val, i) => {
				const prev = oldVals[i];

				if (val && !isEqual(val, prev)) {
					sendErrorToast(val);
				}
			});
		},
		{ deep: true },
	);
}
