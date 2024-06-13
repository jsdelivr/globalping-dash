export const formatDate = (date: string | Date) => {
	if (!date) {
		return null;
	}

	if (typeof date === 'string') {
		date = new Date(date);
	}

	let day: number | string = date.getDate();
	let month: number | string = date.getMonth() + 1;
	const year = date.getFullYear();

	if (day < 10) {
		day = '0' + day;
	}

	if (month < 10) {
		month = '0' + month;
	}

	return `${day}.${month}.${year}`;
};

/**
 * Convert a date to a relative time string, such as
 * "a minute ago", "in 2 hours", "yesterday", "3 months ago", etc.
 * using Intl.RelativeTimeFormat
 */
export function getRelativeTimeString (date: Date | string) {
	if (!date) {
		return null;
	}

	if (typeof date === 'string') {
		date = new Date(date);
	}

	const timeMs = date.getTime();

	// Get the amount of seconds between the given date and now
	const deltaSeconds = Math.round((timeMs - Date.now()) / 1000);

	// Array reprsenting one minute, hour, day, week, month, etc in seconds
	const cutoffs = [ 60, 3600, 86400, 86400 * 7, 86400 * 30, 86400 * 365, Infinity ];

	// Array equivalent to the above but in the string representation of the units
	const units: Intl.RelativeTimeFormatUnit[] = [ 'second', 'minute', 'hour', 'day', 'week', 'month', 'year' ];

	// Grab the ideal cutoff unit
	const unitIndex = cutoffs.findIndex(cutoff => cutoff > Math.abs(deltaSeconds));

	// Get the divisor to divide from the seconds. E.g. if our unit is "day" our divisor
	// is one day in seconds, so we can divide our seconds by this to get the # of days
	const divisor = unitIndex ? cutoffs[unitIndex - 1] : 1;

	// Intl.RelativeTimeFormat do its magic
	const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
	return rtf.format(Math.floor(deltaSeconds / divisor), units[unitIndex]);
}
