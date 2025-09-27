import { useAppearance } from '~/store/appearance';
import { useAuth } from '~/store/auth';

export default defineNuxtPlugin(() => {
	const auth = useAuth();
	const appearance = useAppearance();
	const userTheme = computed(() => auth.user.appearance);

	const updateTheme = () => {
		const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
		const prevUserTheme = localStorage.getItem('theme:prevUserTheme') as 'dark' | 'light' | null;

		let theme: 'light' | 'dark' = systemTheme;

		if (auth.isLoggedIn && userTheme.value) {
			theme = userTheme.value;
		} else if (!auth.isLoggedIn && prevUserTheme) {
			theme = prevUserTheme;
		}

		document.documentElement.className = theme;
		appearance.setTheme(theme);

		if (auth.isLoggedIn && userTheme.value) {
			localStorage.setItem('theme:prevUserTheme', userTheme.value);
		} else if (auth.isLoggedIn && userTheme.value === null) {
			localStorage.removeItem('theme:prevUserTheme');
		}
	};

	updateTheme();
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateTheme);
	watch(userTheme, updateTheme);
});
