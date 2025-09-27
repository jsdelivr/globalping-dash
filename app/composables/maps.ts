export const useGoogleMaps = (callback: () => void) => {
	window.googleMapsLoadCallback = callback;

	if (window.google?.maps) {
		setTimeout(callback);
		return;
	}

	const script = document.createElement('script');
	script.async = true;
	script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBTICLY5LgWNJ0Uly61Q1sNXz_1KZIECwg&loading=async&callback=googleMapsLoadCallback&language=en`;
	document.head.appendChild(script);
};
