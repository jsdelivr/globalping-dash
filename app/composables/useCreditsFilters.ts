import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { MONTH_NAMES } from '~/constants/months';

type CreditsChangeType = 'additions' | 'deductions';
type CreditsChangeReason = 'adopted-probes' | 'sponsorship';

type Filter = {
	type: CreditsChangeType[];
	reason: CreditsChangeReason[];
	year: number | undefined | 'last';
	month: number | undefined | 'last';
};

const FIRST_YEAR = 2023;
const CURRENT_YEAR = new Date().getUTCFullYear();
const CURRENT_MONTH = new Date().getUTCMonth();
const AVAILABLE_YEARS = Array.from(
	{ length: CURRENT_YEAR - FIRST_YEAR + 1 },
	(_, i) => FIRST_YEAR + i,
);

export interface PeriodOption {
	label: string;
	value: {
		year: number | 'last' | undefined;
		month?: number | 'last' | undefined;
	};
	withSeparator?: boolean;
}

export const PERIOD_OPTIONS: PeriodOption[] = [
	{
		label: 'Last year',
		value: {
			year: 'last',
			month: undefined,
		},
	},
	{
		label: 'Last month',
		value: {
			year: undefined,
			month: 'last',
		},
		withSeparator: true,
	},
	...AVAILABLE_YEARS.map(year => [
		...MONTH_NAMES.map((month, i) => ({
			label: `${month} ${year}`,
			value: { year, month: i },
			withSeparator: i === 0,
		})),
		{
			label: year.toString(),
			value: { year, month: undefined },
		},
	]).flat()
		.filter(opt => opt.value.year !== CURRENT_YEAR
			|| (typeof opt.value.month !== 'undefined' && opt.value.month < CURRENT_MONTH))
		.reverse(),
] as const;

const PERMITTED_VALUES = {
	type: [ 'additions', 'deductions' ],
	reason: [ 'adopted-probes', 'sponsorship' ],
	month: [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, undefined, 'last' ],
	year: [ ...AVAILABLE_YEARS, undefined, 'last' ],
	period: [ 'month', 'year' ],
};

const DEFAULT_FILTER = {
	type: PERMITTED_VALUES.type,
	reason: PERMITTED_VALUES.reason,
	month: 'last',
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

	const creditsTableFilterKey = computed(() => JSON.stringify({
		type: filter.value.type,
		reason: filter.value.reason,
	}));

	const directusDateQuery = computed<{ _gte: string } | { _between: [ string, string ] }>(() => {
		const { year, month } = filter.value;

		if (year === 'last') {
			return { _gte: '$NOW(-365 day)' };
		} else if (month === 'last') {
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

			if (month && PERMITTED_VALUES.month.includes(Number(month) - 1)) {
				filter.value.month = Number(month) - 1;
			} else if (year) {
				filter.value.month = undefined;
			} else {
				filter.value.month = DEFAULT_FILTER.month;
			}

			if (year) {
				if (PERMITTED_VALUES.year.includes(Number(year))) {
					filter.value.year = Number(year);
				} else if (year === 'last') {
					filter.value.year = 'last';
				}
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
		// handlers
		onParamChange,
		// builders
		constructQuery,
		getTableFilter,
		// helpers
		isDefault,
	};
};
