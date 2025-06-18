// Configuration sécurisée avec variables d'environnement
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "pk.eyJ1IjoibWJyb3V0aW4iLCJhIjoiY2picWk5ZGN6MDBpMTJqc2M1N2R5cTk1aiJ9.ufdRo1jWROR0au6qiDEfNQ";

// ⚠️ SÉCURITÉ IMPORTANTE ⚠️
// Variables d'environnement configurées sur Netlify :
// - VITE_MAPBOX_TOKEN : Votre clé API Mapbox
//
// AVANT MISE EN PRODUCTION :
// 1. Configurer les restrictions d'URL sur https://account.mapbox.com/access-tokens/
//    - Ajouter : https://your-site.netlify.app/*
//    - Supprimer : http://localhost:* et autres domaines de test
// 2. Limiter les portées (scopes) aux fonctionnalités utilisées uniquement
// 3. Surveiller l'usage sur le dashboard Mapbox

// Vous pouvez ajouter d'autres configurations ici si nécessaire à l'avenir
// export const INITIAL_MAP_CONFIG = {
//     style: 'mapbox://styles/mapbox/satellite-streets-v12',
//     // ... autres configurations initiales si besoin
// }; 