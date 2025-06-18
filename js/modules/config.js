// Configuration compatible JavaScript vanilla + Netlify
export const MAPBOX_TOKEN = window.MAPBOX_TOKEN || "pk.eyJ1IjoibWJyb3V0aW4iLCJhIjoiY2picWk5ZGN6MDBpMTJqc2M1N2R5cTk1aiJ9.ufdRo1jWROR0au6qiDEfNQ";

// ⚠️ SÉCURITÉ IMPORTANTE ⚠️
// Pour Netlify sans bundler, la clé Mapbox est publique mais sécurisée par :
// 1. Restrictions d'URL sur https://account.mapbox.com/access-tokens/
//    - Ajouter UNIQUEMENT : https://zephyr-storymap.netlify.app/*
//    - Supprimer TOUS les autres domaines (localhost, etc.)
// 2. Limiter les portées (scopes) aux fonctionnalités utilisées uniquement
// 3. Surveiller l'usage sur le dashboard Mapbox
//
// Note : Les clés publiques Mapbox (pk.*) sont conçues pour être exposées côté client
// La sécurité se fait par restrictions d'URL, pas par dissimulation

// Vous pouvez ajouter d'autres configurations ici si nécessaire à l'avenir
// export const INITIAL_MAP_CONFIG = {
//     style: 'mapbox://styles/mapbox/satellite-streets-v12',
//     // ... autres configurations initiales si besoin
// }; 