import { defineStore } from 'pinia';

export const useMetadata = defineStore('metadata', {
	state: (): Metadata => ({
		targetNodeVersion: 0,
		targetHardwareDeviceFirmware: '',
		creditsPerDollar: 0,
		creditsPerAdoptedProbe: 0,
	}),
	actions: {
		setMetadata (metadata: Metadata) {
			this.targetNodeVersion = metadata.targetNodeVersion;
			this.targetHardwareDeviceFirmware = metadata.targetHardwareDeviceFirmware;
			this.creditsPerDollar = metadata.creditsPerDollar;
			this.creditsPerAdoptedProbe = metadata.creditsPerAdoptedProbe;
		},
	},
});
