import { useAppearance } from '~/store/appearance.js';

const MAP_MIN_ZOOM = 1;
const MAP_MAX_ZOOM = 22;
const MAP_ZOOM_REG = 3.74;
const DEFAULT_MARKER_COLOR = '#17d4a7';

const mapIdsByTheme = {
	light: {
		background: '#ffffff',
		initial: 'ce04bbf9d49b6f34',
		moderate: 'ce04bbf9d49b6f34',
		detailed: 'ce04bbf9d49b6f34',
	},
	dark: {
		background: '#131728',
		initial: 'ce04bbf9d49b6f34',
		moderate: 'ce04bbf9d49b6f34',
		detailed: 'ce04bbf9d49b6f34',
	},
};

let map: google.maps.Map, marker: google.maps.marker.AdvancedMarkerElement, currentMapId: string, infoWindow: google.maps.InfoWindow | null;

const createMap = async (element: HTMLElement, mapId: string, center: google.maps.LatLngLiteral, zoom: number, background: string) => {
	const { Map } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary;

	return new Map(element, {
		backgroundColor: background,
		zoom,
		center,
		mapTypeId: 'roadmap',
		draggableCursor: 'default',
		mapTypeControl: false,
		streetViewControl: false,
		fullscreenControl: false,
		disableDefaultUI: true,
		minZoom: MAP_MIN_ZOOM,
		maxZoom: MAP_MAX_ZOOM,
		gestureHandling: 'cooperative',
		mapId,
	});
};

const addMapListeners = (map: google.maps.Map, markerHasIW: boolean) => {
	const appearance = useAppearance();

	map.addListener('zoom_changed', () => {
		if (markerHasIW && infoWindow) {
			infoWindow.close();
		}

		updateMapId(map, markerHasIW, appearance.theme);
	});
};

export const initGoogleMap = async (probe: Probe, showPulse: boolean = false, markerHasIW: boolean = true, mapCenterYOffsetPx: number | null = null) => {
	if (!probe) {
		return;
	}

	const element = document.getElementById('gp-map');

	if (!element) {
		return;
	}

	const appearance = useAppearance();
	const mapConfig = mapIdsByTheme[appearance.theme];

	// adjust the map center to visually shift marker verically by offset value
	const mapCenterLat = mapCenterYOffsetPx ? probe.latitude - mapCenterYOffsetPx / Math.pow(2, MAP_ZOOM_REG) : probe.latitude;
	const mapCenterLng = probe.longitude;

	currentMapId = mapConfig.initial;
	map = await createMap(element, currentMapId, { lat: mapCenterLat, lng: mapCenterLng }, MAP_ZOOM_REG, mapConfig.background);

	const { infoWindow: markerInfoWindow } = await createMapMarkerWithIW(probe, showPulse, markerHasIW);
	infoWindow = markerInfoWindow;

	addMapListeners(map, markerHasIW);

	const removeWatcher = appearance.$subscribe(() => updateMapId(map, markerHasIW, appearance.theme));

	return removeWatcher;
};

const updateMapId = async (mapInstance: google.maps.Map, markerHasIW: boolean, theme: 'light' | 'dark') => {
	const mapConfig = mapIdsByTheme[theme];
	const currZoom = mapInstance.getZoom();

	let requiredMapId: string;

	if (currZoom && currZoom >= 14) {
		requiredMapId = mapConfig.detailed;
	} else if (currZoom && currZoom >= 5) {
		requiredMapId = mapConfig.moderate;
	} else {
		requiredMapId = mapConfig.initial;
	}

	// only recreate map if mapId needs to change
	if (requiredMapId !== currentMapId) {
		const element = document.getElementById('gp-map');

		if (element) {
			// preserve current state
			const center = mapInstance.getCenter()?.toJSON();
			const zoom = mapInstance.getZoom();

			currentMapId = requiredMapId;
			map = await createMap(element, currentMapId, center!, zoom!, mapConfig.background);

			if (marker) {
				marker.map = map;
			}

			addMapListeners(map, markerHasIW);
		}
	}
};

async function createMapMarkerWithIW (probe: Probe, showPulse: boolean = false, markerHasIW: boolean = true) {
	const { AdvancedMarkerElement } = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary;

	const svgFillColor = DEFAULT_MARKER_COLOR;
	let markerContent: HTMLElement;
	let infoWindow: google.maps.InfoWindow | null = null;

	if (showPulse) {
		const svgWidth = 132;
		const svgHeight = 132;
		const pulseSvg = `
		<circle cx="${svgWidth / 2}" cy="${svgHeight / 2}" r="0" stroke="#17D4A7" stroke-width="1" fill="none">
				<animate attributeName="r" values="12;${svgWidth / 2}" keyTimes="0;1" dur="3.9s" begin="1s" repeatCount="indefinite"/>
				<animate attributeName="opacity" values="1;0.4;0.2;0" keyTimes="0;0.7;0.85;1" dur="3.9s" begin="1s" repeatCount="indefinite"/>
			</circle>
			<circle cx="${svgWidth / 2}" cy="${svgHeight / 2}" r="0" stroke="#17D4A7" stroke-width="1" fill="none">
				<animate attributeName="r" values="12;${svgWidth / 2}" keyTimes="0;1" dur="3.9s" begin="2.2s" repeatCount="indefinite"/>
				<animate attributeName="opacity" values="1;0.4;0.2;0" keyTimes="0;0.7;0.85;1" dur="3.9s" begin="2.2s" repeatCount="indefinite"/>
			</circle>
			<circle cx="${svgWidth / 2}" cy="${svgHeight / 2}" r="0" stroke="#17D4A7" stroke-width="1" fill="none">
				<animate attributeName="r" values="12;${svgWidth / 2}" keyTimes="0;1" dur="3.9s" begin="3.4s" repeatCount="indefinite"/>
				<animate attributeName="opacity" values="1;0.4;0.2;0" keyTimes="0;0.7;0.85;1" dur="3.9s" begin="3.4s" repeatCount="indefinite"/>
			</circle>
		`;

		const markerSvg = `
			<g filter="url(#filter0_d_6106_3045)">
				<circle cx="${svgWidth / 2}" cy="${svgHeight / 2}" r="6" fill="${svgFillColor}"/>
				<circle cx="${svgWidth / 2}" cy="${svgHeight / 2}" r="7" stroke="white" stroke-width="2"/>
			</g>
		`;

		const defs = `
			<defs>
				<filter id="filter0_d_6106_3045" x="0" y="0" width="100" height="100" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
					<feFlood flood-opacity="0" result="BackgroundImageFix"/>
					<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"/>
					<feOffset dy="2"/>
					<feGaussianBlur stdDeviation="2"/>
					<feComposite in2="hardAlpha" operator="out"/>
					<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0"/>
					<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_6106_3045"/>
					<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_6106_3045" result="shape"/>
				</filter>
			</defs>
		`;

		const svgString = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 132 132" fill="none" xmlns="http://www.w3.org/2000/svg">
			${defs}
			${pulseSvg}
			${markerSvg}
			</svg>`;

		markerContent = document.createElement('div');
		markerContent.innerHTML = svgString;
		markerContent.style.width = `${svgWidth}px`;
		markerContent.style.height = `${svgHeight}px`;
	} else {
		const svgString = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<g filter="url(#filter0_d_6106_3045)">
			<circle cx="12" cy="10" r="6" fill="${svgFillColor}"/>
			<circle cx="12" cy="10" r="7" stroke="white" stroke-width="2"/>
			</g>
			<defs>
			<filter id="filter0_d_6106_3045" x="0" y="0" width="24" height="24" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
			<feFlood flood-opacity="0" result="BackgroundImageFix"/>
			<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
			<feOffset dy="2"/>
			<feGaussianBlur stdDeviation="2"/>
			<feComposite in2="hardAlpha" operator="out"/>
			<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0"/>
			<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_6106_3045"/>
			<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_6106_3045" result="shape"/>
			</filter>
			</defs>
			</svg>`;

		markerContent = document.createElement('div');
		markerContent.innerHTML = svgString;
		markerContent.style.width = '24px';
		markerContent.style.height = '24px';
	}

	// Prevent drift during zoom
	markerContent.style.position = 'absolute';
	markerContent.style.transform = showPulse ? 'translate(-50%, -50%)' : 'translate(-50%, -100%)';
	markerContent.style.transformOrigin = 'center bottom';

	if (markerHasIW) {
		infoWindow = new google.maps.InfoWindow({
			content: `<div class="mt-3">
					<div class="font-semibold">${probe.network}</div>
					<div class="font-semibold">(${probe.city}, ${probe.country})</div>
				</div>`,
		});
	}

	marker = new AdvancedMarkerElement({
		map,
		content: markerContent,
		position: { lat: probe.latitude, lng: probe.longitude },
	});

	if (markerHasIW === false) {
		markerContent.style.cursor = 'default';
	}

	if (markerHasIW && infoWindow) {
		marker.addListener('click', () => {
			infoWindow.open(map, marker);
		});

		map.addListener('click', () => {
			infoWindow.close();
		});
	}

	return { marker, infoWindow };
}

export const updateMapMarker = (latitude: number, longitude: number, mapCenterYOffsetPx: number) => {
	if (marker) {
		const mapCenterLat = mapCenterYOffsetPx ? latitude - mapCenterYOffsetPx / Math.pow(2, MAP_ZOOM_REG) : latitude;

		marker.position = { lat: latitude, lng: longitude };
		map.setCenter({ lat: mapCenterLat, lng: longitude });
		map.setZoom(MAP_ZOOM_REG);
	}
};
