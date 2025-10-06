import capitalize from 'lodash/capitalize';
import { pluralize } from '~/utils/pluralize';

export const getExtendedProbeStatus = (probe: Probe) => {
	if (probe.status === 'ready' && probe.isOutdated && probe.hardwareDevice) {
		return 'ready (outdated firmware)';
	} else if (probe.status === 'ready' && probe.isOutdated) {
		return 'ready (outdated container)';
	}

	return probe.status;
};

export const getProbeStatusColor = (probe: Probe) => {
	switch (getExtendedProbeStatus(probe)) {
		case 'ready':
			return 'text-green-500';

		case 'offline':
			return 'text-bluegray-500';

		case 'ping-test-failed':
			return 'text-red-500';

		default:
			return 'text-yellow-600';
	}
};

export const getOfflineDurationText = (probe: Probe) => {
	if (probe.status !== 'offline' || !Date.parse(probe.lastSyncDate)) {
		return undefined;
	}

	const syncDate = new Date(probe.lastSyncDate);
	const dayDiff = Math.floor((Date.now() - syncDate.getTime()) / (1000 * 60 * 60 * 24));

	if (dayDiff < 1) {
		return 'Offline for less than a day';
	}

	return `Offline for ${dayDiff} ${pluralize('day', dayDiff)}`;
};

export const getProbeStatusText = (probe: Probe, showOfflineDuration = false) => {
	if (showOfflineDuration && probe.status === 'offline') {
		return getOfflineDurationText(probe) ?? 'Offline';
	}

	return capitalize(getExtendedProbeStatus(probe).replaceAll('-', ' '));
};
