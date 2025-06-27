import capitalize from 'lodash/capitalize';
import { useMetadata } from '~/store/metadata.js';

const compareSemver = (a: string, b: string) => {
	const pa = a.split('.');
	const pb = b.split('.');

	for (let i = 0; i < 3; i++) {
		const na = Number(pa[i]) || 0;
		const nb = Number(pb[i]) || 0;

		if (na > nb) { return 1; }

		if (nb > na) { return -1; }
	}

	return 0;
};

const isOutdated = (probeValue: string | null, metadataValue: string) => {
	if (!probeValue || !metadataValue) {
		return false;
	}

	const result = compareSemver(probeValue.replaceAll('v', ''), metadataValue.replaceAll('v', ''));
	return result === -1;
};

export const getExtendedProbeStatus = (probe: Probe) => {
	const metadata = useMetadata();

	if (probe.status === 'ready' && isOutdated(probe.hardwareDeviceFirmware, metadata.targetHardwareDeviceFirmware)) {
		return 'ready (outdated firmware)';
	} else if (probe.status === 'ready' && isOutdated(probe.nodeVersion, metadata.targetNodeVersion)) {
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
