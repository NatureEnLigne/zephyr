import { initMap } from './modules/map.js';
import { initStoryUI } from './modules/ui.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialisation de la carte
    const map = initMap('map');
    
    // Stocker la référence globalement pour les boutons de navigation
    window.storyMap = map;
    
    // Initialisation de la Story Map
    initStoryUI(map);
}); 