import capitalize from 'lodash/capitalize';

type DateFormat = 'year-month' | 'long' | 'short';
type FormatOptions = { format?: DateFormat; timeZone?: string };

const formatDateInternal = (date: string | Date | null, { format = 'long', timeZone }: FormatOptions) => {
	if (!date) {
		return '';
	}

	if (typeof date === 'string') {
		date = new Date(date);
	}

	if (format === 'year-month') {
		return date.toLocaleDateString('en-US', { timeZone, month: 'short', year: 'numeric' });
	}

	if (format === 'short') {
		return date.toLocaleDateString('en-US', { timeZone, day: 'numeric', month: 'short' });
	}

	return date.toLocaleDateString('en-US', { timeZone, day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDate = (date: string | Date | null, format: DateFormat = 'long') => {
	return formatDateInternal(date, { format });
};

export const formatUtcDate = (date: string | Date | null, format: DateFormat = 'long') => {
	return formatDateInternal(date, { format, timeZone: 'UTC' });
};

export const formatUtcDateForTable = (date: string | Date | null): string => {
	if (!date) {
		return '';
	}

	if (typeof date === 'string') {
		date = new Date(date);
	}

	return date.toISOString().split('T')[0]!;
};

/**
 * Convert a date to a relative time string, such as
 * "a minute ago", "in 2 hours", "yesterday", "3 months ago", etc.
 * using Intl.RelativeTimeFormat
 */
export function getRelativeTimeString (date: Date | string | null, noTime: boolean = false) {
	if (!date) {
		return '';
	}

	if (typeof date === 'string') {
		date = new Date(date);
	}

	const timeMs = date.getTime();

	// Get the amount of seconds between the given date and now
	const deltaSeconds = Math.round((timeMs - Date.now()) / 1000);

	// Array representing one minute, hour, day, week, month, etc. in seconds
	const cutoffs = [ 60, 3600, 86400, 86400 * 7, 86400 * 30, 86400 * 365, Infinity ];

	// Array equivalent to the above but in the string representation of the units
	const units: Intl.RelativeTimeFormatUnit[] = [ 'second', 'minute', 'hour', 'day', 'week', 'month', 'year' ];

	// Grab the ideal cutoff unit
	let unitIndex = cutoffs.findIndex(cutoff => cutoff > Math.abs(deltaSeconds));
	const dayIndex = units.findIndex(unit => unit === 'day');

	// If `noTime` argument is passed, time is ignored. E.g. for all deltas <1 day ago 'Today' is returned.
	if (noTime && unitIndex < dayIndex) {
		unitIndex = dayIndex;
	}

	// Get the divisor to divide from the seconds. E.g. if our unit is "day" our divisor
	// is one day in seconds, so we can divide our seconds by this to get the # of days
	const divisor = unitIndex ? cutoffs[unitIndex - 1]! : 1;

	// Intl.RelativeTimeFormat do its magic
	const rtf = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });
	return capitalize(rtf.format(Math.ceil(deltaSeconds / divisor), units[unitIndex]!));
}

/**
 * Convert a timestamp to a full time string, such as Jan 24, 2025, 2:00 AM
*/
export const formatDateTime = (dateTime: string | Date | null) => {
	if (!dateTime) {
		return '';
	}

	if (typeof dateTime === 'string') {
		dateTime = new Date(dateTime);
	}

	return dateTime.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: 'numeric' });
};

/**
 * Convert a timestamp to a full time string, such as 2025-01-24 02:00:00 +02:00
*/
export const formatTechnicalDateTime = (dateTime: string | Date | null) => {
	if (!dateTime) {
		return '';
	}

	if (typeof dateTime === 'string') {
		dateTime = new Date(dateTime);
	}

	const lpad = (num: number, len: number = 2) => String(num).padStart(len, '0');
	const formatTz = (minutes: number) => `${minutes > 0 ? '-' : '+'}${lpad(Math.floor(Math.abs(minutes) / 60))}:${lpad(Math.abs(minutes) % 60)}`;

	return `${dateTime.getFullYear()}-${lpad(dateTime.getMonth() + 1)}-${lpad(dateTime.getDate())} ${lpad(dateTime.getHours())}:${lpad(dateTime.getMinutes())}:${lpad(dateTime.getSeconds())} ${formatTz(dateTime.getTimezoneOffset())}`;
};
