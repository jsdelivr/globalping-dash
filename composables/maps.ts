const config = useRuntimeConfig();

export const useGoogleMaps = (callback: () => void) => {
	window.googleMapsLoadCallback = callback;

	if (window.google?.maps) {
		setTimeout(callback);
		return;
	}

	const script = document.createElement('script');
	script.async = true;
	script.src = `https://maps.googleapis.com/maps/api/js?key=${config.public.googleMapsKey}&loading=async&callback=googleMapsLoadCallback`;
	document.head.appendChild(script);
};
