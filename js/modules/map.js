import { MAPBOX_TOKEN } from './config.js';
// createDebugOverlay et initStoryUI sont importés mais appelés dans initMap, c'est ok.
// Si config.js est supprimé, MAPBOX_TOKEN doit être défini ici ou importé d'une autre source valide.
// Pour l'instant, je vais supposer que MAPBOX_TOKEN sera défini globalement ou vous l'ajouterez manuellement.

let map;

export function initMap(containerId) {
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    const initialFranceView = {
        center: [2.3522, 46.2276],
        zoom: 5.2,
        pitch: 0.00,
        bearing: 0.00
    };

    map = new mapboxgl.Map({
        container: containerId,
        style: 'mapbox://styles/mapbox/satellite-streets-v12', // Style par défaut, la story map peut le changer par étape si besoin.
        ...initialFranceView,
        // Désactiver toute navigation utilisateur
        interactive: false,
        scrollZoom: false,
        boxZoom: false,
        dragRotate: false,
        dragPan: false,
        keyboard: false,
        doubleClickZoom: false,
        touchZoomRotate: false
    });
    
    // Supprimer les contrôles de navigation
    // map.addControl(new mapboxgl.NavigationControl());
    
    map.on('style.load', () => {
        // Style chargé, ajout du terrain et du ciel.
        addTerrainAndSky();
        // La logique pour add3DBuildings et les appels à createDebugOverlay/initStoryUI sont déplacés dans main.js après l'initMap
    });
    
    return map;
}

export function addTerrainAndSky() {
    if (!map.getSource('mapbox-dem')) {
        map.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 14
        });
        map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.4 });
    }
    
    if (!map.getLayer('sky')) {
        map.addLayer({
            id: 'sky',
            type: 'sky',
            paint: {
                'sky-type': 'atmosphere',
                'sky-atmosphere-sun': [0, 0],
                'sky-atmosphere-sun-intensity': 15
            }
        });
    }
}

export function getMap() {
    return map;
}

// Les fonctions setMapStyle, toggleBuildingVisibility, add3DBuildings, addIdfGrid, removeIdfGrid, flyToCoordinates, fitBounds, addSnapLine, removeSnapLine, clearAllSnapLines ont été supprimées.
// La variable shouldShowBuildings et snapLineIds ont été supprimées.
// Les imports de BUILDING_LAYER_ID, GRID_SOURCE_ID, GRID_LAYER_ID depuis config.js ne sont plus nécessaires. 