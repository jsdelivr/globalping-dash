import mapStyles from './map-styles.json';

const INITIAL_MAP_STYLES = mapStyles;
const MAP_MIN_ZOOM = 1;
const MAP_MAX_ZOOM = 22;
const MAP_ZOOM_REG = 3.74;
const DEFAULT_MARKER_COLOR = '#17d4a7';
const MODERATE_MAP_STYLES = [
	...INITIAL_MAP_STYLES,
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
	...MODERATE_MAP_STYLES,
	{
		featureType: 'road',
		stylers: [{ visibility: 'on' }],
	},
];

let map: google.maps.Map, marker: google.maps.Marker, infoWindow: google.maps.InfoWindow;

export const initGoogleMap = async (probe: Probe) => {
	if (!probe) {
		return;
	}

	const { Map } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary;
	const element = document.getElementById('gp-map');

	if (!element) {
		return;
	}

	map = new Map(element, {
		backgroundColor: '#fafafa',
		styles: INITIAL_MAP_STYLES,
		zoom: MAP_ZOOM_REG,
		center: { lat: probe.latitude, lng: probe.longitude },
		mapTypeId: 'roadmap',
		draggableCursor: 'default',
		mapTypeControl: false,
		streetViewControl: false,
		fullscreenControl: false,
		minZoom: MAP_MIN_ZOOM,
		maxZoom: MAP_MAX_ZOOM,
	});

	createMapMarker(probe);

	map.addListener('zoom_changed', () => {
		infoWindow && infoWindow.close();

		const currZoom = map.getZoom();

		// handle map detalization on zoom
		if (currZoom && currZoom >= 14) {
			map.setOptions({ styles: DETAILED_MAP_STYLES });
		} else if (currZoom && currZoom >= 5) {
			map.setOptions({ styles: MODERATE_MAP_STYLES });
		} else {
			map.setOptions({ styles: INITIAL_MAP_STYLES });
		}
	});
};

function createMapMarker (probe: Probe) {
	// create svg to use as a Marker icon
	const svgFillColor = DEFAULT_MARKER_COLOR;
	const svg = window.btoa(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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


	// create an Info Window
	infoWindow = new google.maps.InfoWindow({
		content: `<div class="mt-3">
				<div class="font-semibold">${probe.network}</div>
				<div class="font-semibold">(${probe.city}, ${probe.country})</div>
			</div>`,
	});

	// create the Marker
	marker = new google.maps.Marker({
		map,
		icon: {
			url: `data:image/svg+xml;base64,${svg}`,
		},
		position: { lat: probe.latitude, lng: probe.longitude },
		optimized: false,
	});

	google.maps.event.addListener(marker, 'click', () => {
		infoWindow.open(map, marker);
	});

	google.maps.event.addListener(map, 'click', () => {
		infoWindow.close();
	});

	return marker;
}
