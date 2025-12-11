import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { MONTH_NAMES } from '~/constants/months';
import { useAuth } from '~/store/auth';

type CreditsChangeType = 'additions' | 'deductions';
type CreditsChangeReason = 'adopted-probes' | 'sponsorship';
type CreditsTimeFrame = number | 'past' | undefined;

type Filter = {
	type: CreditsChangeType[];
	reason: CreditsChangeReason[];
	year: CreditsTimeFrame;
	month: CreditsTimeFrame;
};
export interface PeriodOption {
	label: string;
	value: {
		year: CreditsTimeFrame;
		month?: CreditsTimeFrame;
	};
	withSeparator?: boolean;
}

const PERMITTED_VALUES = {
	type: [ 'additions', 'deductions' ],
	reason: [ 'adopted-probes', 'sponsorship' ],
	month: [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, undefined, 'past' ],
};

const DEFAULT_FILTER = {
	type: PERMITTED_VALUES.type,
	reason: PERMITTED_VALUES.reason,
	month: 'past',
	year: undefined,
} as Filter;

export const FIELD_LABELS = {
	type: {
		additions: 'Additions',
		deductions: 'Deductions',
	},
	reason: {
		'adopted-probes': 'Adopted probes',
		'sponsorship': 'Sponsorship',
	},
};

export const TYPE_REASONS = {
	additions: [ 'adopted-probes', 'sponsorship' ],
	deductions: [],
};

export const useCreditsFilters = () => {
	const route = useRoute();
	const active = ref(true);
	const filter = ref<Filter>(cloneDeep(DEFAULT_FILTER));
	const anyFilterApplied = computed(() => (Object.keys(DEFAULT_FILTER) as Array<keyof Filter>).some(key => !isDefault(key)));

	const { user } = useAuth();
	const userCreated = Date.parse(user.date_created) ? new Date(user.date_created) : new Date('2023-01-01');

	const FIRST_YEAR = userCreated.getUTCFullYear();
	const FIRST_MONTH = userCreated.getUTCMonth();
	const CURRENT_YEAR = new Date().getUTCFullYear();
	const CURRENT_MONTH = new Date().getUTCMonth();

	const periodOptions = computed<PeriodOption[]>(() => {
		const options: PeriodOption[] = [
			{ label: 'Past month', value: { year: undefined, month: 'past' } },
			{ label: 'Past year', value: { year: 'past', month: undefined }, withSeparator: true },
		];

		// add valid months for all years, also add the whole year option if the final month is December
		for (let year = CURRENT_YEAR; year >= FIRST_YEAR; year--) {
			const isCurrentYear = year === CURRENT_YEAR;
			const isFirstYear = year === FIRST_YEAR;

			const minMonth = isFirstYear ? FIRST_MONTH : 0;
			const maxMonth = isCurrentYear ? CURRENT_MONTH - 1 : 11;

			if (maxMonth === 11) {
				options.push({
					label: year.toString(),
					value: { year, month: undefined },
				});
			}

			for (let month = maxMonth; month >= minMonth; month--) {
				options.push({
					label: `${MONTH_NAMES[month]} ${year}`,
					value: { year, month },
					withSeparator: month === 0,
				});
			}
		}

		return options;
	});

	const creditsTableFilterKey = computed(() => JSON.stringify({
		type: filter.value.type,
		reason: filter.value.reason,
	}));

	const directusDateQuery = computed<{ _gte: string } | { _between: [ string, string ] }>(() => {
		const { year, month } = filter.value;

		if (year === 'past') {
			return { _gte: '$NOW(-365 day)' };
		} else if (month === 'past') {
			return { _gte: '$NOW(-30 day)' };
		}

		const yearOnly = typeof month === 'undefined';
		const targetMonth = month ?? 0;
		const endMonth = yearOnly ? 12 : targetMonth + 1;

		const start = new Date(Date.UTC(year as number, yearOnly ? 0 : targetMonth, 1, 0, 0, 0));
		const end = new Date(Date.UTC(year as number, endMonth, 0, 23, 59, 59));

		return {
			_between: [ start.toISOString(), end.toISOString() ],
		};
	});

	const shouldAddToQuery = (key: keyof Filter, routeKeys: string[]) => !isDefault(key) && routeKeys.includes(key);

	const constructQuery = (keysToUpdate: string[], resetQuery = true) => ({
		...!resetQuery
			? Object.fromEntries(Object.entries(route.query).filter(([ key ]) => !keysToUpdate.includes(key)))
			: {},
		...shouldAddToQuery('type', keysToUpdate) && filter.value.type.length && { type: filter.value.type },
		...shouldAddToQuery('reason', keysToUpdate) && filter.value.reason.length && { reason: filter.value.reason },
		...shouldAddToQuery('year', keysToUpdate) && { year: filter.value.year },
		...shouldAddToQuery('month', keysToUpdate) && { month: (filter.value.month as number) + 1 },
	});

	const onParamChange = (keysToUpdate = Object.keys(filter.value), resetQuery = true) => {
		navigateTo({
			query: constructQuery(keysToUpdate, resetQuery),
		});
	};

	const isDefault = (field: keyof Filter, filterObj: MaybeRefOrGetter<Filter> = filter) => {
		return typeof toValue(filterObj)[field] === 'undefined' || isEqual(toValue(filterObj)[field], DEFAULT_FILTER[field]);
	};

	const getTableFilter = () => {
		const { type, reason } = filter.value;
		const allReasons = new Set(PERMITTED_VALUES.reason);
		const filterReasons = new Set(reason);

		return {
			type,
			reason: isEqual(filterReasons, allReasons) ? [ ...reason, 'other' ] : reason,
		};
	};

	watch(
		[
			() => route.query.type,
			() => route.query.reason,
			() => route.query.year,
			() => route.query.month,
		],
		async ([ type, reason, year, month ]) => {
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

			if (PERMITTED_VALUES.month.includes(Number(month) - 1)) {
				filter.value.month = Number(month) - 1;
			} else if (year) {
				filter.value.month = undefined;
			} else {
				filter.value.month = DEFAULT_FILTER.month;
			}

			if (Number(year) >= FIRST_YEAR && Number(year) <= CURRENT_YEAR) {
				filter.value.year = Number(year);
			} else if (year === 'past') {
				filter.value.year = 'past';
			} else {
				filter.value.year = DEFAULT_FILTER.year;
				filter.value.month = DEFAULT_FILTER.month;
			}
		},
		{ immediate: true },
	);

	onBeforeRouteLeave(() => {
		active.value = false;
	});

	return {
		// state
		anyFilterApplied,
		filter,
		directusDateQuery,
		creditsTableFilterKey,
		periodOptions,
		// handlers
		onParamChange,
		// builders
		constructQuery,
		getTableFilter,
		// helpers
		isDefault,
	};
};
