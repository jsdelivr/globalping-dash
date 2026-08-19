type SponsorsPeriodOption = {
	label: string;
	value: SponsorsPeriod;
};

const isValidPeriod = (value: unknown): value is SponsorsPeriod => {
	if (value === 'past-year') {
		return true;
	}

	if (typeof value !== 'string' || !/^\d{4}$/.test(value)) {
		return false;
	}

	const year = Number(value);
	return year >= 2024 && year <= new Date().getUTCFullYear();
};

export const useSponsorsPeriod = () => {
	const route = useRoute();
	const period = computed<SponsorsPeriod>(() => isValidPeriod(route.query.period) ? route.query.period : 'past-year');
	const periodOptions = computed<SponsorsPeriodOption[]>(() => {
		const options: SponsorsPeriodOption[] = [{ label: 'Past year', value: 'past-year' }];

		for (let year = new Date().getUTCFullYear(); year >= 2024; year--) {
			options.push({ label: String(year), value: String(year) as SponsorsPeriod });
		}

		return options;
	});

	const setPeriod = (value: SponsorsPeriod) => navigateTo({
		path: route.path,
		query: {
			...route.query,
			period: value === 'past-year' ? undefined : value,
			sponsorEventsPage: undefined,
			sponsorAccountsPage: undefined,
		},
	});

	return { period, periodOptions, setPeriod };
};
