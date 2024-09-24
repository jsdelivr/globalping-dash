import { defineStore } from 'pinia';

interface AppearanceState {
	theme: 'light' | 'dark',
}

export const useAppearance = defineStore('appearance', {
	state: (): AppearanceState => ({
		theme: 'light',
	}),
	actions: {
		setTheme (theme: AppearanceState['theme']) {
			this.theme = theme;
		},
	},
});
