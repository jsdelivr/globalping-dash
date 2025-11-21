export const formatCreditComment = (change: CreditsChange) => {
	if (change.type === 'deduction') {
		return 'Measurements ran on this day.';
	}

	switch (change.reason) {
		case 'one_time_sponsorship':
			return `One-time $${change.meta.amountInDollars} sponsorship.`;
		case 'recurring_sponsorship':
			return `Recurring $${change.meta.amountInDollars} sponsorship${change.meta.monthsCovered ? ` (${change.meta.monthsCovered} months)` : ''}.`;
		case 'tier_changed':
			return `Sponsorship tier changed. Adding a diff of $${change.meta.amountInDollars}.`;
		case 'adopted_probe':
			return `Adopted probes.`;
		default:
			return change.meta?.comment || 'Other';
	}
};
