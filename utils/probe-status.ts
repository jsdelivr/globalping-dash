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

const isFirmwareOutdated = (probeFirmware: string | null, metadataFirmware: string) => {
	if (!probeFirmware || !metadataFirmware) {
		return false;
	}

	const result = compareSemver(probeFirmware.replaceAll('v', ''), metadataFirmware.replaceAll('v', ''));
	return result === -1;
};

export const getProbeStatus = (probe: Probe) => {
	const metadata = useMetadata();

	if (probe.status === 'ready' && isFirmwareOutdated(probe.hardwareDeviceFirmware, metadata.targetHardwareDeviceFirmware)) {
		return 'Ready (outdated)';
	}

	return probe.status;
};
