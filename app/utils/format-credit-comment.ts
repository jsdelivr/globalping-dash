import { formatNumber } from '~/utils/format-number';

export const formatCreditComment = (change: CreditsChange) => {
	if (change.type === 'deduction') {
		return 'Measurements ran on this day.';
	}

	switch (change.reason) {
		case 'one_time_sponsorship':
			return `One-time $${formatNumber(change.meta.amountInDollars)} sponsorship.`;
		case 'recurring_sponsorship':
			return `Recurring $${formatNumber(change.meta.amountInDollars)} sponsorship${change.meta.monthsCovered && change.meta.monthsCovered > 1 ? ` (${formatNumber(change.meta.monthsCovered)} months)` : ''}.`;
		case 'tier_changed':
			return `Sponsorship tier changed. Adding a diff of $${formatNumber(change.meta.amountInDollars)}.`;
		case 'adopted_probe':
			return `Adopted probes.`;
		default:
			return change.meta?.comment || 'Other';
	}
};
