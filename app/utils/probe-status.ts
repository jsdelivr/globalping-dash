import capitalize from 'lodash/capitalize';

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

export const getProbeStatusText = (probe: Probe) => {
	return capitalize(getExtendedProbeStatus(probe).replaceAll('-', ' '));
};
