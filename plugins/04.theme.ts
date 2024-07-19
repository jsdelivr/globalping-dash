import { useAuth } from '~/store/auth';

export default defineNuxtPlugin(() => {
	const auth = useAuth();

	const userAppearance = computed(() => auth.user.appearance);

	const updateAppearance = () => {
		const systemAppearance = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
		const appearance = userAppearance.value ?? systemAppearance;
		document.documentElement.className = appearance;
	};

	updateAppearance();

	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateAppearance);

	watch(userAppearance, updateAppearance);
});
