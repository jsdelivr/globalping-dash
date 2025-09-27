import { defineStore } from 'pinia';

export const useMetadata = defineStore('metadata', {
	state: (): Metadata => ({
		targetNodeVersion: '',
		targetHardwareDeviceFirmware: '',
		creditsPerDollar: 0,
		creditsPerAdoptedProbe: 0,
	}),
	actions: {
		setMetadata (metadata: Metadata) {
			this.targetNodeVersion = String(metadata.targetNodeVersion);
			this.targetHardwareDeviceFirmware = String(metadata.targetHardwareDeviceFirmware);
			this.creditsPerDollar = Number(metadata.creditsPerDollar);
			this.creditsPerAdoptedProbe = Number(metadata.creditsPerAdoptedProbe);
		},
	},
});
