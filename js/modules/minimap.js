// Module de gestion de la mini-carte de progression
import { storySteps } from './data.js';

// Fonction pour calculer la distance entre deux points (formule de Haversine)
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Rayon de la Terre en kilomètres
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Fonction pour calculer la distance totale parcourue jusqu'à une étape donnée
function calculateTotalDistance(stepIndex) {
    // Valeurs spécifiques de distance pour chaque étape (incluant étape 13)
    // Étapes 0-1: 0 km (même lieu), Étape 2: 20m, Étape 3: 2km, puis distances réelles calculées
    const distancesByStep = [
        0,      // Étape 0: Papa apporte une branche - 0 km
        0,      // Étape 1: Naissance au bord du lac - 0 km  
        20,     // Étape 2: Premier vol - 20 mètres (valeur spéciale)
        2000,   // Étape 3: Départ vers l'inconnu - 2 km (valeur spéciale)
        336,    // Étape 4: Mont-Cenis (336 km depuis les Vosges)
        486,    // Étape 5: Provence (150 km depuis Mont-Cenis)
        686,    // Étape 6: Méditerranée (200 km depuis Provence)
        886,    // Étape 7: Côtes algériennes (200 km depuis Méditerranée)
        2086,   // Étape 8: Mauritanie (1200 km depuis Algérie)
        2756,   // Étape 9: Sénégal (670 km depuis Mauritanie)
        5756,   // Étape 10: Retour au lac (3000 km depuis Sénégal)
        5756,   // Étape 11: Défense du nid (même lieu que étape 10)
        8756,   // Étape 12: Retour Sénégal (3000 km retour vers l'Afrique)
        8956    // Étape 13: Lille (200 km depuis retour vers Europe)
    ];
    
    if (stepIndex < 0 || stepIndex >= distancesByStep.length) return 0;
    
    return distancesByStep[stepIndex];
}

// Fonction pour mettre à jour les indicateurs de progression
function updateProgressIndicators(stepIndex) {
    const stepElement = document.getElementById('step-text');
    const distanceElement = document.getElementById('distance-text');
    const timeElement = document.getElementById('time-text');
    
    if (stepElement && distanceElement && timeElement) {
        // Mise à jour du numéro d'étape (commence à 1)
        const stepNumber = stepIndex + 1;
        stepElement.textContent = `Étape ${stepNumber}`;
        
        // Calcul de la distance totale
        const totalDistance = calculateTotalDistance(stepIndex);
        
        // Calcul du temps selon les valeurs spécifiques pour chaque étape (incluant étape 13)
        const daysByStep = [-45, 0, 55, 75, 90, 105, 115, 120, 135, 150, 300, 310, 365, 400];
        const totalDays = daysByStep[stepIndex] || 0;
        
        // Mise à jour des textes avec gestion des cas spéciaux
        if (totalDistance === 0) {
            distanceElement.textContent = '0 km';
        } else if (stepIndex === 2) {
            // Cas spécial étape 2: Premier vol - 20 mètres
            distanceElement.textContent = '20 m';
        } else if (stepIndex === 3) {
            // Cas spécial étape 3: Départ vers l'inconnu - 2 km
            distanceElement.textContent = '2 km';
        } else {
            // Toutes les autres étapes en km
            distanceElement.textContent = `${totalDistance} km`;
        }
        
        if (totalDays === 0) {
            timeElement.textContent = '0 jours';
        } else if (totalDays < 0) {
            timeElement.textContent = `${totalDays} jours`;
        } else if (totalDays < 100) {
            timeElement.textContent = `${totalDays} jours`;
        } else {
            timeElement.textContent = `${Math.round(totalDays / 30)} mois`;
        }
    }
}

// Variables privées du module
let minimapCanvas = null;
let minimapCtx = null;
let minimapBounds = null;
let minimapMapbox = null;
let lineAnimationProgress = 0;
let lineAnimationId = null;
let previousStepIndex = -1;

// Fonction pour initialiser la mini-carte de progression
function initProgressMinimap() {
    const minimapContainer = document.getElementById('minimap-container');
    if (!minimapContainer) {
        console.error('minimap-container not found');
        return;
    }
    
    console.log('Initializing minimap...');
    
    // Créer la mini-carte Mapbox avec style terrain
    minimapMapbox = new mapboxgl.Map({
        container: minimapContainer,
        style: 'mapbox://styles/mapbox/outdoors-v12', // Style terrain/outdoor
        center: [6.9022, 48.4634], // Coordonnées exactes de l'étape 1 "Naissance au bord du lac"
        zoom: 1.8, // Zoom cohérent avec adaptMinimapBounds
        interactive: false, // Non-interactive
        attributionControl: false // Pas d'attribution pour garder propre
    });
    
    // Calculer les bounds globaux pour toutes les étapes
    if (storySteps && storySteps.length > 0) {
        const allCoords = storySteps.map(step => step.mapState.center);
        const lats = allCoords.map(coord => coord[1]);
        const lngs = allCoords.map(coord => coord[0]);
        
        minimapBounds = {
            minLat: Math.min(...lats) - 2,
            maxLat: Math.max(...lats) + 2,
            minLng: Math.min(...lngs) - 2,
            maxLng: Math.max(...lngs) + 2
        };
        
        console.log('Minimap initialized with bounds:', minimapBounds);
        
        // Attendre que la carte soit prête
        minimapMapbox.on('load', () => {
            console.log('Minimap loaded and ready');
            
            // Test immédiat : ajouter un point de test pour vérifier que la carte fonctionne
            try {
                minimapMapbox.addSource('test-point', {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [6.9022, 48.4634] // Point exact de l'étape 1
                        }
                    }
                });
                
                minimapMapbox.addLayer({
                    id: 'test-point-layer',
                    type: 'circle',
                    source: 'test-point',
                    paint: {
                        'circle-radius': 6,
                        'circle-color': '#ff0000',
                        'circle-stroke-color': '#ffffff',
                        'circle-stroke-width': 2
                    }
                });
                
                console.log('Test point added successfully');
                
                // Supprimer le point de test après 3 secondes
                setTimeout(() => {
                    if (minimapMapbox.getLayer('test-point-layer')) {
                        minimapMapbox.removeLayer('test-point-layer');
                        minimapMapbox.removeSource('test-point');
                        console.log('Test point removed');
                    }
                }, 3000);
                
            } catch (error) {
                console.error('Error adding test point:', error);
            }
        });
    } else {
        console.error('storySteps not available during minimap initialization');
    }
}

// Fonction pour calculer les bounds dynamiques selon la progression
function calculateDynamicBounds(currentStepIndex) {
    if (currentStepIndex < 0) return minimapBounds;
    
    // Récupérer le point de l'étape actuelle
    const currentStep = storySteps[currentStepIndex];
    if (!currentStep || !currentStep.mapState || !currentStep.mapState.center) {
        return minimapBounds;
    }
    
    const currentCoord = currentStep.mapState.center;
    const currentLng = currentCoord[0];
    const currentLat = currentCoord[1];
    
    // Définir une zone fixe autour du point actuel pour garder une vue cohérente
    const viewRadius = {
        lat: 4.0,  // Rayon en degrés de latitude
        lng: 6.0   // Rayon en degrés de longitude
    };
    
    // Calculer les bounds centrés sur le point actuel
    let minLat = currentLat - viewRadius.lat;
    let maxLat = currentLat + viewRadius.lat;
    let minLng = currentLng - viewRadius.lng;
    let maxLng = currentLng + viewRadius.lng;
    
    // S'assurer qu'on garde au minimum la vue de la France
    const franceBounds = {
        minLat: 42.0,    // Sud de la France (Corse)
        maxLat: 50.5,    // Nord de la France  
        minLng: -2.5,    // Ouest de la France (moins de mer)
        maxLng: 8.5      // Est de la France (Alsace)
    };
    
    // Étendre les bounds si nécessaire pour inclure la France
    minLat = Math.min(minLat, franceBounds.minLat);
    maxLat = Math.max(maxLat, franceBounds.maxLat);
    minLng = Math.min(minLng, franceBounds.minLng);
    maxLng = Math.max(maxLng, franceBounds.maxLng);
    
    console.log(`Centering on step ${currentStepIndex} at [${currentLng}, ${currentLat}]`);
    
    return {
        minLat: minLat,
        maxLat: maxLat,
        minLng: minLng,
        maxLng: maxLng
    };
}

// Fonction utilitaire pour adapter l'emprise de la mini-carte
function adaptMinimapBounds(currentStepIndex) {
    if (!minimapMapbox || currentStepIndex < 0) return;
    
    console.log('Adapting minimap bounds for step:', currentStepIndex);
    
    // Attendre que la carte soit complètement prête
    if (!minimapMapbox.loaded()) {
        minimapMapbox.on('load', () => adaptMinimapBounds(currentStepIndex));
        return;
    }
    
    // Récupérer les coordonnées à inclure
    const coordsToInclude = [];
    
    // Logique spéciale pour les premières étapes (0-1) : vue limitée
    if (currentStepIndex <= 1) {
        // Pour les étapes 0 et 1, on utilise toujours les coordonnées de l'étape 1
        // pour avoir exactement la même vue sur la mini-carte
        if (storySteps[1] && storySteps[1].mapState) {
            coordsToInclude.push(storySteps[1].mapState.center);
        }
    } else if (currentStepIndex >= storySteps.length - 1) {
        // Pour l'étape finale (13), montrer l'ensemble du voyage - inclure des étapes clés
        const keySteps = [0, 4, 8, 9, 12]; // Vosges, Alpes, Mauritanie, Sénégal, Sénégal final
        keySteps.forEach(stepIdx => {
            if (stepIdx < storySteps.length && storySteps[stepIdx] && storySteps[stepIdx].mapState && storySteps[stepIdx].mapState.center) {
                coordsToInclude.push(storySteps[stepIdx].mapState.center);
            }
        });
        // Inclure aussi l'étape actuelle (Lille)
        if (storySteps[currentStepIndex] && storySteps[currentStepIndex].mapState) {
            coordsToInclude.push(storySteps[currentStepIndex].mapState.center);
        }
        console.log(`Final step: including key journey points for complete overview`);
    } else {
        // À partir de l'étape 2, logique normale avec étape actuelle et précédente
        // Toujours inclure l'étape actuelle
        if (storySteps[currentStepIndex] && storySteps[currentStepIndex].mapState) {
            coordsToInclude.push(storySteps[currentStepIndex].mapState.center);
        }
        
        // Inclure l'étape précédente si elle existe
        if (currentStepIndex > 0 && storySteps[currentStepIndex - 1] && storySteps[currentStepIndex - 1].mapState) {
            coordsToInclude.push(storySteps[currentStepIndex - 1].mapState.center);
        }
    }
    
    if (coordsToInclude.length === 0) return;
    
    // Calculer les bounds
    if (coordsToInclude.length === 1) {
        // Un seul point : centrer dessus avec zoom fixe
        const coord = coordsToInclude[0];
        console.log('Single point, centering on:', coord);
        
        // Attendre que le container soit prêt
        setTimeout(() => {
            minimapMapbox.jumpTo({
                center: coord,
                zoom: 1.8 // Zoom très réduit pour vue continentale
            });
            
            // Double vérification après un délai
            setTimeout(() => {
                const currentCenter = minimapMapbox.getCenter();
                const distance = Math.abs(currentCenter.lng - coord[0]) + Math.abs(currentCenter.lat - coord[1]);
                if (distance > 0.01) {
                    console.warn('Re-centering...');
                    minimapMapbox.setCenter(coord);
                }
            }, 100);
        }, 100);
    } else {
        // Plusieurs points : adapter l'emprise pour tous les voir
        console.log('Multiple points, fitting bounds for:', coordsToInclude);
        
        const bounds = new mapboxgl.LngLatBounds();
        coordsToInclude.forEach(coord => bounds.extend(coord));
        
        // Attendre que le container soit prêt
        setTimeout(() => {
            minimapMapbox.fitBounds(bounds, {
                padding: 150, // Padding maximal pour garantir que les points soient bien visibles
                maxZoom: 2.2, // Zoom maximum encore plus réduit
                minZoom: 1.0, // Zoom minimum très réduit pour vue continentale
                duration: 0 // Pas d'animation
            });
        }, 100);
    }
}

// Fonction pour mettre à jour la mini-carte avec la progression
function updateProgressMinimap(currentStepIndex, showNextStep = false) {
    if (!minimapMapbox || currentStepIndex < 0) return;
    
    console.log('updateProgressMinimap called with step:', currentStepIndex, 'showNextStep:', showNextStep);
    
    // S'assurer que la carte est prête
    if (!minimapMapbox.loaded()) {
        console.log('Minimap not loaded yet, waiting...');
        minimapMapbox.on('load', () => {
            updateProgressMinimap(currentStepIndex, showNextStep);
        });
        return;
    }
    
    // Déterminer le point sur lequel centrer
    let targetStepIndex = currentStepIndex;
    if (showNextStep && currentStepIndex < storySteps.length - 1) {
        targetStepIndex = currentStepIndex + 1;
    }
    
    const targetStep = storySteps[targetStepIndex];
    if (!targetStep || !targetStep.mapState || !targetStep.mapState.center) {
        console.error('No valid step data for index:', targetStepIndex);
        return;
    }
    
    console.log('Updating minimap for step', targetStepIndex);
    
    // Ajouter d'abord les éléments
    if (showNextStep) {
        // Afficher le point suivant en blanc
        addProgressElementsWithNext(currentStepIndex);
    } else {
        // Affichage normal avec progression complète
        addProgressElements(currentStepIndex);
    }
    
    // Puis adapter l'emprise après un délai pour que les éléments soient rendus
    setTimeout(() => {
        adaptMinimapBounds(showNextStep ? targetStepIndex : currentStepIndex);
    }, 150);
    
    // Mettre à jour les indicateurs de progression (distance et temps)
    updateProgressIndicators(currentStepIndex);
    
    // Mettre à jour l'index précédent
    previousStepIndex = currentStepIndex;
}

// Fonction pour afficher les éléments avec le point suivant en blanc
function addProgressElementsWithNext(currentStepIndex) {
    console.log('addProgressElementsWithNext called with step:', currentStepIndex);
    
    // Supprimer les sources et layers existants en toute sécurité
    try {
        if (minimapMapbox.getSource('progress-line')) {
            if (minimapMapbox.getLayer('progress-line')) {
                minimapMapbox.removeLayer('progress-line');
            }
            minimapMapbox.removeSource('progress-line');
        }
        if (minimapMapbox.getSource('progress-points')) {
            if (minimapMapbox.getLayer('progress-points-visited')) {
                minimapMapbox.removeLayer('progress-points-visited');
            }
            if (minimapMapbox.getLayer('progress-points-future')) {
                minimapMapbox.removeLayer('progress-points-future');
            }
            if (minimapMapbox.getLayer('progress-points-next')) {
                minimapMapbox.removeLayer('progress-points-next');
            }
            minimapMapbox.removeSource('progress-points');
        }
    } catch (e) {
        console.log('Error removing layers:', e);
    }
    
    // Vérifier que storySteps existe
    if (!storySteps || storySteps.length === 0) {
        console.error('storySteps is not defined or empty');
        return;
    }
    
    // Créer la ligne de progression (jusqu'à l'étape actuelle)
    if (currentStepIndex > 0) {
        const lineCoords = [];
        for (let i = 0; i <= currentStepIndex; i++) {
            if (storySteps[i] && storySteps[i].mapState && storySteps[i].mapState.center) {
                lineCoords.push(storySteps[i].mapState.center);
            }
        }
        
        if (lineCoords.length > 1) {
            minimapMapbox.addSource('progress-line', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: lineCoords
                    }
                }
            });
            
            minimapMapbox.addLayer({
                id: 'progress-line',
                type: 'line',
                source: 'progress-line',
                paint: {
                    'line-color': '#ff3333',
                    'line-width': 3,
                    'line-opacity': 0.8
                }
            });
        }
    }
    
    // Créer les points avec le point suivant en blanc
    const maxStepToShow = Math.min(currentStepIndex + 1, storySteps.length - 1);
    const pointFeatures = [];
    
    for (let i = 0; i <= maxStepToShow; i++) {
        if (storySteps[i] && storySteps[i].mapState && storySteps[i].mapState.center) {
            let status = 'future';
            if (i < currentStepIndex) {
                status = 'visited'; // Points précédents en rouge
            } else if (i === currentStepIndex) {
                status = 'visited'; // Point actuel en rouge
            } else if (i === currentStepIndex + 1) {
                status = 'next'; // Point suivant en blanc
            }
            
            pointFeatures.push({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: storySteps[i].mapState.center
                },
                properties: {
                    status: status,
                    stepIndex: i
                }
            });
        }
    }
    
    if (pointFeatures.length > 0) {
        minimapMapbox.addSource('progress-points', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: pointFeatures
            }
        });
        
        // Points visités (rouge)
        minimapMapbox.addLayer({
            id: 'progress-points-visited',
            type: 'circle',
            source: 'progress-points',
            filter: ['==', ['get', 'status'], 'visited'],
            paint: {
                'circle-radius': 6,
                'circle-color': '#ff3333',
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 3
            }
        });
        
        // Point suivant (contour blanc)
        minimapMapbox.addLayer({
            id: 'progress-points-next',
            type: 'circle',
            source: 'progress-points',
            filter: ['==', ['get', 'status'], 'next'],
            paint: {
                'circle-radius': 6,
                'circle-color': 'transparent',
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 3
            }
        });
        
        // Points futurs (masqués)
        minimapMapbox.addLayer({
            id: 'progress-points-future',
            type: 'circle',
            source: 'progress-points',
            filter: ['==', ['get', 'status'], 'future'],
            paint: {
                'circle-radius': 0,
                'circle-color': 'transparent'
            }
        });
    }
}

// Fonction pour ajouter les éléments de progression sur la carte
function addProgressElements(currentStepIndex) {
    console.log('addProgressElements called with step:', currentStepIndex);
    
    // Supprimer les sources et layers existants en toute sécurité
    try {
        if (minimapMapbox.getSource('progress-line')) {
            if (minimapMapbox.getLayer('progress-line')) {
                minimapMapbox.removeLayer('progress-line');
            }
            minimapMapbox.removeSource('progress-line');
        }
        if (minimapMapbox.getSource('progress-points')) {
            if (minimapMapbox.getLayer('progress-points-visited')) {
                minimapMapbox.removeLayer('progress-points-visited');
            }
            if (minimapMapbox.getLayer('progress-points-future')) {
                minimapMapbox.removeLayer('progress-points-future');
            }
            if (minimapMapbox.getLayer('progress-points-next')) {
                minimapMapbox.removeLayer('progress-points-next');
            }
            minimapMapbox.removeSource('progress-points');
        }
    } catch (e) {
        console.log('Error removing layers:', e);
    }
    
    // Vérifier que storySteps existe
    if (!storySteps || storySteps.length === 0) {
        console.error('storySteps is not defined or empty');
        return;
    }
    
    // Créer la ligne de progression
    if (currentStepIndex > 0) {
        const lineCoords = [];
        for (let i = 0; i <= currentStepIndex; i++) {
            if (storySteps[i] && storySteps[i].mapState && storySteps[i].mapState.center) {
                lineCoords.push(storySteps[i].mapState.center);
            }
        }
        
        console.log('Line coordinates:', lineCoords);
        
        if (lineCoords.length > 1) {
            minimapMapbox.addSource('progress-line', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: lineCoords
                    }
                }
            });
            
            minimapMapbox.addLayer({
                id: 'progress-line',
                type: 'line',
                source: 'progress-line',
                paint: {
                    'line-color': '#ff3333',
                    'line-width': 3,
                    'line-opacity': 0.8
                }
            });
            console.log('Line added to minimap');
        }
    }
    
    // Créer les points d'étapes - afficher au moins le point actuel
    const maxStepToShow = Math.min(currentStepIndex + 1, storySteps.length - 1);
    const pointFeatures = [];
    
    // Assurer qu'on affiche au moins l'étape actuelle (même à l'étape 0)
    const startIndex = 0;
    const endIndex = Math.max(maxStepToShow, currentStepIndex);
    
    for (let i = startIndex; i <= endIndex; i++) {
        if (storySteps[i] && storySteps[i].mapState && storySteps[i].mapState.center) {
            let status = 'future';
            if (i <= currentStepIndex) {
                status = 'visited'; // Points visités ou actuels en rouge
            } else if (i === currentStepIndex + 1) {
                status = 'next'; // Point suivant en contour blanc
            }
            
            pointFeatures.push({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: storySteps[i].mapState.center
                },
                properties: {
                    status: status,
                    stepIndex: i
                }
            });
            
            console.log(`Point ${i}: ${status} at`, storySteps[i].mapState.center);
        }
    }
    
    console.log('Created', pointFeatures.length, 'point features for step', currentStepIndex);
    
    if (pointFeatures.length > 0) {
        minimapMapbox.addSource('progress-points', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: pointFeatures
            }
        });
        
        console.log('Points source added to minimap');
        
        // Points visités et actuels (rouge)
        minimapMapbox.addLayer({
            id: 'progress-points-visited',
            type: 'circle',
            source: 'progress-points',
            filter: ['==', ['get', 'status'], 'visited'],
            paint: {
                'circle-radius': 6,
                'circle-color': '#ff3333',
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 3
            }
        });
        
        // Point suivant (contour blanc)
        minimapMapbox.addLayer({
            id: 'progress-points-next',
            type: 'circle',
            source: 'progress-points',
            filter: ['==', ['get', 'status'], 'next'],
            paint: {
                'circle-radius': 6,
                'circle-color': 'transparent',
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 4
            }
        });
        
        // Points futurs (masqués)
        minimapMapbox.addLayer({
            id: 'progress-points-future',
            type: 'circle',
            source: 'progress-points',
            filter: ['==', ['get', 'status'], 'future'],
            paint: {
                'circle-radius': 0,
                'circle-color': 'transparent'
            }
        });
        
        console.log('All point layers added to minimap');
    } else {
        console.error('No point features to display');
    }
}

// Fonction pour animer la ligne progressive
function animateProgressLine(fromStepIndex, toStepIndex, duration = 2000) {
    if (fromStepIndex < 0 || toStepIndex < 0 || fromStepIndex >= toStepIndex) return;
    
    const startCoord = storySteps[fromStepIndex].mapState.center;
    const endCoord = storySteps[toStepIndex].mapState.center;
    
    // Créer une ligne animée entre les deux points
    let progress = 0;
    const startTime = Date.now();
    
    function updateAnimatedLine() {
        const elapsed = Date.now() - startTime;
        progress = Math.min(elapsed / duration, 1);
        
        // Interpoler entre les coordonnées
        const currentLng = startCoord[0] + (endCoord[0] - startCoord[0]) * progress;
        const currentLat = startCoord[1] + (endCoord[1] - startCoord[1]) * progress;
        
        // Mettre à jour la ligne jusqu'au point actuel
        const animatedCoords = [startCoord, [currentLng, currentLat]];
        
        if (minimapMapbox.getSource('progress-line-animated')) {
            minimapMapbox.getSource('progress-line-animated').setData({
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: animatedCoords
                }
            });
        } else {
            minimapMapbox.addSource('progress-line-animated', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: animatedCoords
                    }
                }
            });
            
            minimapMapbox.addLayer({
                id: 'progress-line-animated',
                type: 'line',
                source: 'progress-line-animated',
                paint: {
                    'line-color': '#ff3333',
                    'line-width': 4,
                    'line-opacity': 1
                }
            });
        }
        
        if (progress < 1) {
            requestAnimationFrame(updateAnimatedLine);
        } else {
            // Animation terminée, mettre à jour les éléments
            setTimeout(() => {
                // Mettre à jour complètement la progression
                addProgressElements(toStepIndex);
                // Nettoyer la ligne animée
                if (minimapMapbox.getSource('progress-line-animated')) {
                    minimapMapbox.removeLayer('progress-line-animated');
                    minimapMapbox.removeSource('progress-line-animated');
                }
            }, 200);
        }
    }
    
    updateAnimatedLine();
}

// Fonction pour mettre à jour uniquement les points
function updateProgressPoints(currentStepIndex) {
    if (!minimapMapbox.getSource('progress-points')) return;
    
    const maxStepToShow = Math.min(currentStepIndex + 2, storySteps.length - 1);
    const pointFeatures = [];
    
    for (let i = 0; i <= maxStepToShow; i++) {
        let status = 'future';
        if (i <= currentStepIndex) {
            status = 'visited';
        } else if (i === currentStepIndex + 1) {
            status = 'next';
        }
        
        pointFeatures.push({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: storySteps[i].mapState.center
            },
            properties: {
                status: status,
                stepIndex: i
            }
        });
    }
    
    minimapMapbox.getSource('progress-points').setData({
        type: 'FeatureCollection',
        features: pointFeatures
    });
}

// Fonction pour afficher la mini-carte avec animation
function showProgressMinimap() {
    const minimap = document.getElementById('progress-minimap');
    if (minimap) {
        minimap.style.display = 'block';
        
        // Animation d'entrée similaire au panneau de droite
        minimap.style.transform = 'scaleY(0)';
        minimap.style.opacity = '0';
        gsap.to(minimap, { duration: 1.2, scaleY: 1, opacity: 1, ease: 'power3.out' });
        
        // Forcer le redimensionnement de la carte après l'affichage
        if (minimapMapbox) {
            setTimeout(() => {
                minimapMapbox.resize();
                console.log('Minimap resized after show');
            }, 100);
        }
    }
}

// Fonction pour masquer la mini-carte
function hideProgressMinimap() {
    const minimap = document.getElementById('progress-minimap');
    if (minimap) {
        minimap.style.display = 'none';
    }
}

// Fonction pour masquer la mini-carte avec animation (pour étape finale)
function hideProgressMinimapAnimated(onCompleteCallback) {
    const minimap = document.getElementById('progress-minimap');
    if (minimap && minimap.style.display !== 'none') {
        // Animation de sortie similaire au panneau de droite
        gsap.to(minimap, {
            scaleY: 0,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.in',
            onComplete: () => {
                minimap.style.display = 'none';
                if (onCompleteCallback) onCompleteCallback();
            }
        });
    } else {
        if (onCompleteCallback) onCompleteCallback();
    }
}

// Fonction spéciale pour adapter l'emprise lors de navigation depuis la timeline
function adaptMinimapBoundsForTimelineJump(currentStepIndex) {
    if (!minimapMapbox || currentStepIndex < 0) return;
    
    console.log('Adapting minimap bounds for timeline jump to step:', currentStepIndex);
    
    // Attendre que la carte soit complètement prête
    if (!minimapMapbox.loaded()) {
        minimapMapbox.on('load', () => adaptMinimapBoundsForTimelineJump(currentStepIndex));
        return;
    }
    
    // LOGIQUE MODIFIÉE : Lors d'un saut d'étapes, on considère qu'on "vient" de l'étape 
    // précédente dans la séquence naturelle pour appliquer le bon décalage de carte
    const coordsToInclude = [];
    
    // Toujours inclure l'étape actuelle
    if (storySteps[currentStepIndex] && storySteps[currentStepIndex].mapState && storySteps[currentStepIndex].mapState.center) {
        coordsToInclude.push(storySteps[currentStepIndex].mapState.center);
    }
    
    // Déterminer quelle étape précédente inclure selon le contexte
    if (currentStepIndex <= 2) {
        // Pour les premières étapes (0-2), inclure toutes les étapes précédentes pour le contexte européen
        for (let i = 0; i < currentStepIndex; i++) {
            if (storySteps[i] && storySteps[i].mapState && storySteps[i].mapState.center) {
                coordsToInclude.push(storySteps[i].mapState.center);
            }
        }
        console.log(`Early steps (0-2): including all previous steps up to ${currentStepIndex}`);
    } else if (currentStepIndex >= storySteps.length - 1) {
        // Pour l'étape finale (13), montrer l'ensemble du voyage - inclure des étapes clés
        const keySteps = [0, 4, 8, 9, 12]; // Vosges, Alpes, Mauritanie, Sénégal, Sénégal final
        keySteps.forEach(stepIdx => {
            if (stepIdx < storySteps.length && storySteps[stepIdx] && storySteps[stepIdx].mapState && storySteps[stepIdx].mapState.center) {
                coordsToInclude.push(storySteps[stepIdx].mapState.center);
            }
        });
        console.log(`Final step: including key journey points for complete overview`);
    } else {
        // Pour les étapes avancées, inclure l'étape précédente pour simuler la transition naturelle
        const previousStep = currentStepIndex - 1;
        
        if (storySteps[previousStep] && storySteps[previousStep].mapState && storySteps[previousStep].mapState.center) {
            const currentCoord = storySteps[currentStepIndex].mapState.center;
            const previousCoord = storySteps[previousStep].mapState.center;
            
            // Calculer la distance entre l'étape précédente et l'actuelle
            const distance = calculateDistance(
                previousCoord[1], previousCoord[0],
                currentCoord[1], currentCoord[0]
            );
            
            console.log(`Distance between step ${previousStep} and ${currentStepIndex}: ${distance.toFixed(0)} km`);
            
            // Si les étapes sont très proches (< 50 km), c'est probablement le même lieu
            // Dans ce cas, inclure une étape plus éloignée pour donner du contexte
            if (distance < 50 && currentStepIndex >= 2) {
                // Chercher une étape plus éloignée pour donner du contexte géographique
                let contextStepIndex = -1;
                
                // Chercher l'étape la plus récente qui soit suffisamment éloignée
                for (let i = currentStepIndex - 2; i >= 0; i--) {
                    if (storySteps[i] && storySteps[i].mapState && storySteps[i].mapState.center) {
                        const contextDistance = calculateDistance(
                            storySteps[i].mapState.center[1], storySteps[i].mapState.center[0],
                            currentCoord[1], currentCoord[0]
                        );
                        if (contextDistance > 200) { // Plus de 200 km pour avoir un vrai contexte
                            contextStepIndex = i;
                            break;
                        }
                    }
                }
                
                if (contextStepIndex >= 0) {
                    coordsToInclude.push(storySteps[contextStepIndex].mapState.center);
                    console.log(`Close steps detected, using context step ${contextStepIndex} for geographic context`);
                } else {
                    // Fallback : inclure quand même l'étape précédente
                    coordsToInclude.push(previousCoord);
                    console.log(`No distant context found, using previous step ${previousStep}`);
                }
            } else {
                // Distance normale, inclure l'étape précédente
                coordsToInclude.push(previousCoord);
                console.log(`Normal distance, including previous step ${previousStep}`);
            }
        }
    }
    
    if (coordsToInclude.length === 0) return;
    
    // Calculer les bounds pour inclure les points pertinents
    if (coordsToInclude.length === 1) {
        // Un seul point : centrer dessus avec zoom adapté
        const coord = coordsToInclude[0];
        console.log('Single point for timeline jump, centering on:', coord);
        
        setTimeout(() => {
            minimapMapbox.jumpTo({
                center: coord,
                zoom: 1.8 // Zoom très réduit pour vue continentale
            });
        }, 100);
    } else {
        // Plusieurs points : adapter l'emprise pour voir la transition
        console.log('Multiple points for timeline jump, fitting bounds:', coordsToInclude);
        
        const bounds = new mapboxgl.LngLatBounds();
        coordsToInclude.forEach(coord => bounds.extend(coord));
        
        setTimeout(() => {
            minimapMapbox.fitBounds(bounds, {
                padding: 120, // Padding suffisant pour voir les points
                maxZoom: 3.5, // Zoom maximum adapté pour les transitions
                minZoom: 0.8, // Zoom minimum pour vue globale si nécessaire
                duration: 1000 // Animation fluide
            });
        }, 100);
    }
}

// Exports publics
export {
    initProgressMinimap,
    updateProgressMinimap,
    showProgressMinimap,
    hideProgressMinimap,
    hideProgressMinimapAnimated,
    adaptMinimapBounds,
    adaptMinimapBoundsForTimelineJump,
    updateProgressIndicators,
    // Variables pour accès depuis ui.js si nécessaire
    minimapMapbox
};
