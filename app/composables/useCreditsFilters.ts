import _ from 'lodash';
import { ref } from 'vue';
import { useRoute } from 'vue-router';

type CreditsChangeType = 'additions' | 'deductions';
type CreditsChangeReason = 'adopted-probes' | 'sponsorship' | 'other';

type Filter = {
	type: CreditsChangeType[];
	reason: CreditsChangeReason[];
};

const PERMITTED_VALUES = {
	type: [ 'additions', 'deductions' ],
	reason: [ 'adopted-probes', 'sponsorship', 'other' ],
};

const DEFAULT_FILTER = _.cloneDeep(PERMITTED_VALUES) as Filter;

export const FIELD_LABELS = {
	type: {
		additions: 'Additions',
		deductions: 'Deductions',
	},
	reason: {
		'adopted-probes': 'Adopted probes',
		'sponsorship': 'Sponsorship',
		'other': 'Other',
	},
};

export const TYPE_REASONS = {
	additions: [ 'adopted-probes', 'sponsorship', 'other' ],
	deductions: [],
};

export const useCreditsFilters = () => {
	const route = useRoute();
	const active = ref(true);
	const filter = ref<Filter>(_.cloneDeep(DEFAULT_FILTER));
	const key = computed(() => JSON.stringify(filter.value));
	const anyFilterApplied = computed(() => (Object.keys(DEFAULT_FILTER) as Array<keyof Filter>).some(key => !isDefault(key)));

	const constructQuery = () => ({
		...!isDefault('type') && { type: filter.value.type },
		...!isDefault('reason') && { reason: filter.value.reason },
	});

	const onParamChange = () => {
		navigateTo({
			query: constructQuery(),
		});
	};

	const isDefault = (field: keyof Filter, filterObj: MaybeRefOrGetter<Filter> = filter) => {
		return _.isEqual(toValue(filterObj)[field], DEFAULT_FILTER[field]);
	};

	watch([ () => route.query.type, () => route.query.reason ], async ([ type, reason ]) => {
		if (!toValue(active)) {
			return;
		}

		const reasonArray = Array.isArray(reason) ? reason : [ reason ];
		const typeArray = Array.isArray(type) ? type : [ type ];

		if (type && typeArray.every(type => PERMITTED_VALUES.type.includes(type!))) {
			filter.value.type = typeArray as CreditsChangeType[];
		} else {
			filter.value.type = DEFAULT_FILTER.type;
		}

		if (reason && filter.value.type.includes('additions') && reasonArray.every(reason => PERMITTED_VALUES.reason.includes(reason!))) {
			filter.value.reason = reasonArray as CreditsChangeReason[];
		} else {
			filter.value.reason = filter.value.type.includes('additions') ? DEFAULT_FILTER.reason : [];
		}
	}, { immediate: true });

	onBeforeRouteLeave(() => {
		active.value = false;
	});

	return {
		// state
		anyFilterApplied,
		filter,
		key,
		// handlers
		onParamChange,
		// builders
		constructQuery,
		// helpers
		isDefault,
	};
};
