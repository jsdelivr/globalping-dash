import darkMapStyles from './dark-map-styles.json';
import mapStyles from './map-styles.json';
import { useAppearance } from '~/store/appearance.js';

const MAP_MIN_ZOOM = 1;
const MAP_MAX_ZOOM = 22;
const MAP_ZOOM_REG = 3.74;
const DEFAULT_MARKER_COLOR = '#17d4a7';

const INITIAL_MAP_STYLES = mapStyles;
const MODERATE_MAP_STYLES = [
	{
		elementType: 'labels.text.stroke',
		stylers: [{ visibility: 'on' }],
	},
	{
		elementType: 'labels.text.fill',
		stylers: [
			{ visibility: 'on' },
			{ color: '#989b9e' },
		],
	},
];
const DETAILED_MAP_STYLES = [
	{
		featureType: 'road',
		stylers: [{ visibility: 'on' }],
	},
];
const INITIAL_MAP_STYLES_DARK = darkMapStyles;
const MODERATE_MAP_STYLES_DARK = [{
	elementType: 'labels.text.stroke',
	stylers: [
		{ visibility: 'on' },
		{ color: '#131728' },
	],
}];

const stylesByTheme = {
	light: {
		background: '#ffffff',
		initial: INITIAL_MAP_STYLES,
		moderate: [ ...INITIAL_MAP_STYLES, ...MODERATE_MAP_STYLES ],
		detailed: [ ...INITIAL_MAP_STYLES, ...MODERATE_MAP_STYLES, ...DETAILED_MAP_STYLES ],
	},
	dark: {
		background: '#131728',
		initial: [ ...INITIAL_MAP_STYLES, ...INITIAL_MAP_STYLES_DARK ],
		moderate: [ ...INITIAL_MAP_STYLES, ...MODERATE_MAP_STYLES, ...INITIAL_MAP_STYLES_DARK, ...MODERATE_MAP_STYLES_DARK ],
		detailed: [ ...INITIAL_MAP_STYLES, ...MODERATE_MAP_STYLES, ...DETAILED_MAP_STYLES, ...INITIAL_MAP_STYLES_DARK, ...MODERATE_MAP_STYLES_DARK ],
	},
};

let map: google.maps.Map, marker: google.maps.Marker, infoWindow: google.maps.InfoWindow;

export const initGoogleMap = async (probe: Probe, showPulse: boolean = false, showIW: boolean = true) => {
	if (!probe) {
		return;
	}

	const { Map } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary;
	const element = document.getElementById('gp-map');

	if (!element) {
		return;
	}

	const appearance = useAppearance();
	const style = stylesByTheme[appearance.theme];

	map = new Map(element, {
		backgroundColor: style.background,
		styles: style.initial,
		zoom: MAP_ZOOM_REG,
		center: { lat: probe.latitude, lng: probe.longitude },
		mapTypeId: 'roadmap',
		draggableCursor: 'default',
		mapTypeControl: false,
		streetViewControl: false,
		fullscreenControl: false,
		disableDefaultUI: true,
		minZoom: MAP_MIN_ZOOM,
		maxZoom: MAP_MAX_ZOOM,
		gestureHandling: 'cooperative',
	});

	createMapMarker(probe, showPulse, showIW);

	map.addListener('zoom_changed', () => {
		if (showIW) {
			infoWindow?.close();
		}

		updateStyles(map, appearance.theme);
	});

	const removeWatcher = appearance.$subscribe(() => updateStyles(map, appearance.theme));

	return removeWatcher;
};

const updateStyles = (map: google.maps.Map, theme: 'light' | 'dark') => {
	const style = stylesByTheme[theme];
	const currZoom = map.getZoom();

	// handle map detalization on zoom
	if (currZoom && currZoom >= 14) {
		map.setOptions({ styles: style.detailed });
	} else if (currZoom && currZoom >= 5) {
		map.setOptions({ styles: style.moderate });
	} else {
		map.setOptions({ styles: style.initial });
	}
};

function createMapMarker (probe: Probe, showPulse: boolean = false, showIW: boolean = true) {
	// create svg to use as a Marker icon
	const svgFillColor = DEFAULT_MARKER_COLOR;
	let svg;
	let markerIconSettings: google.maps.Icon;

	if (showPulse) {
		const pulseSvg = `
			<circle cx="66" cy="66" r="12" stroke="#17D4A7" stroke-width="1" fill="none">
				<animate attributeName="r" values="12;66" keyTimes="0;1" dur="3.9s" begin="1s" repeatCount="indefinite"/>
				<animate attributeName="opacity" values="1;0.4;0.2;0" keyTimes="0;0.7;0.85;1" dur="3.9s" begin="1s" repeatCount="indefinite"/>
			</circle>
			<circle cx="66" cy="66" r="12" stroke="#17D4A7" stroke-width="1" fill="none">
				<animate attributeName="r" values="12;66" keyTimes="0;1" dur="3.9s" begin="2.2s" repeatCount="indefinite"/>
				<animate attributeName="opacity" values="1;0.4;0.2;0" keyTimes="0;0.7;0.85;1" dur="3.9s" begin="2.2s" repeatCount="indefinite"/>
			</circle>
			<circle cx="66" cy="66" r="12" stroke="#17D4A7" stroke-width="1" fill="none">
				<animate attributeName="r" values="12;66" keyTimes="0;1" dur="3.9s" begin="3.4s" repeatCount="indefinite"/>
				<animate attributeName="opacity" values="1;0.4;0.2;0" keyTimes="0;0.7;0.85;1" dur="3.9s" begin="3.4s" repeatCount="indefinite"/>
			</circle>
		`;

		const markerSvg = `
			<g filter="url(#filter0_d_6106_3045)">
				<circle cx="66" cy="66" r="6" fill="${svgFillColor}"/>
				<circle cx="66" cy="66" r="7" stroke="white" stroke-width="2"/>
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

		svg = window.btoa(`<svg width="132" height="132" viewBox="0 0 132 132" fill="none" xmlns="http://www.w3.org/2000/svg">
			${defs}
			${pulseSvg}
			${markerSvg}
			</svg>`);

		markerIconSettings = {
			url: `data:image/svg+xml;base64,${svg}`,
			anchor: new google.maps.Point(50, 50),
		};
	} else {
		svg = window.btoa(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
			</svg>`);

		markerIconSettings = {
			url: `data:image/svg+xml;base64,${svg}`,
		};
	}

	if (showIW) {
		// create an Info Window
		infoWindow = new google.maps.InfoWindow({
			content: `<div class="mt-3">
					<div class="font-semibold">${probe.network}</div>
					<div class="font-semibold">(${probe.city}, ${probe.country})</div>
				</div>`,
		});
	}

	// create the Marker
	marker = new google.maps.Marker({
		map,
		icon: markerIconSettings,
		position: { lat: probe.latitude, lng: probe.longitude },
		optimized: false,
	});

	if (showIW === false) {
		marker.setOptions({ cursor: 'default' });
	}

	if (showIW) {
		google.maps.event.addListener(marker, 'click', () => {
			infoWindow.open(map, marker);
		});

		google.maps.event.addListener(map, 'click', () => {
			infoWindow.close();
		});
	}

	return marker;
}
