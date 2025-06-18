// Module de gestion des vidéos
import { storySteps } from './data.js';

// Variables d'état pour la gestion vidéo
let videoElement = null; // Élément vidéo pour la vidéo locale
let videoState = 'playing'; // 'playing', 'paused', 'stopped'

// Fonction pour créer l'élément vidéo
function createVideoElement() {
    videoElement = document.createElement('video');
    videoElement.id = 'local-video';
    videoElement.style.position = 'fixed';
    videoElement.style.width = '66.66vw'; // 2/3 de l'écran en largeur (2x plus grande)
    videoElement.style.height = 'auto';
    videoElement.style.zIndex = '999'; // Sous la UI mais au-dessus de la carte
    videoElement.style.display = 'none';
    videoElement.style.border = 'none';
    videoElement.style.outline = 'none';
    videoElement.style.background = 'transparent';
    videoElement.style.pointerEvents = 'none'; // Aucune interaction possible
    videoElement.controls = false; // Aucun contrôle
    videoElement.autoplay = true;
    videoElement.muted = true;
    videoElement.loop = true; // Boucle automatique
    videoElement.playsInline = true; // Pour mobile
    
    // Styles pour l'effet de révélation comme une tâche d'encre
    videoElement.style.filter = 'contrast(1.1) saturate(1.2)';
    
    document.body.appendChild(videoElement);
}

// Fonction pour afficher une vidéo
function showVideo(videoSrc, panelPosition) {
    if (!videoElement) {
        return;
    }
    
    // Arrêter toute animation GSAP en cours sur la vidéo
    gsap.killTweensOf(videoElement);
    
    // S'assurer que la vidéo précédente est bien arrêtée
    videoElement.pause();
    videoElement.currentTime = 0;
    
    // Réinitialiser les propriétés visuelles
    videoElement.style.opacity = '1';
    
    // Traitement spécial pour etape3.webm (Départ vers l'inconnu) - 150% plus grande
    if (videoSrc.includes('etape3.webm')) {
        videoElement.style.transform = 'scale(1.5)';
    } else {
        videoElement.style.transform = 'scale(1)';
    }
    
    videoElement.src = videoSrc;
    videoElement.style.display = 'block';
    
    // Positionner la vidéo à l'opposé du panneau, sans bordures
    if (panelPosition === 'bottom-left') {
        // Si le panneau est en bas à gauche, mettre la vidéo en haut à droite
        videoElement.style.top = '0px';
        videoElement.style.right = '0px';
        videoElement.style.bottom = 'auto';
        videoElement.style.left = 'auto';
    } else if (panelPosition === 'top-left') {
        // Si le panneau est en haut à gauche, mettre la vidéo en bas à droite
        videoElement.style.bottom = '0px';
        videoElement.style.right = '0px';
        videoElement.style.top = 'auto';
        videoElement.style.left = 'auto';
    } else {
        // Position par défaut : en haut à gauche (pour panneau bottom-right)
        videoElement.style.top = '0px';
        videoElement.style.left = '0px';
        videoElement.style.bottom = 'auto';
        videoElement.style.right = 'auto';
    }
    
    // Affichage direct sans animation - la vidéo commence déjà par des tâches d'encre
    videoElement.style.opacity = '1';
    // Transform déjà défini ci-dessus selon la vidéo
    videoElement.style.filter = 'contrast(1.1) saturate(1.2)';
    
    // Attendre que la vidéo soit prête avant de la jouer
    videoElement.addEventListener('loadeddata', () => {
        videoElement.currentTime = 0;
        videoElement.play().catch(e => {/* Autoplay bloqué */});
    }, { once: true });
    
    // Gérer les erreurs de chargement
    videoElement.addEventListener('error', (e) => {
        // Erreur de chargement vidéo
    }, { once: true });
}

// Fonction pour masquer la vidéo
function hideVideo() {
    if (videoElement && videoElement.style.display !== 'none') {
        gsap.to(videoElement, {
            duration: 1.8,
            opacity: 0,
            filter: 'contrast(1.1) saturate(1.2) blur(12px)',
            ease: 'power2.out',
            onComplete: () => {
                videoElement.style.display = 'none';
                videoElement.pause();
                videoElement.src = '';
            }
        });
    }
}

// Fonction pour gérer le bouton play/pause
function handlePlayButton(playButton, stopButton, currentStepIndex) {
    if (videoState === 'playing') {
        // Passer en pause
        videoState = 'paused';
        playButton.innerHTML = '<span><i class="fas fa-play"></i></span>';
        playButton.classList.remove('glassIco--active');
        if (videoElement) {
            videoElement.pause();
        }
    } else if (videoState === 'paused') {
        // Reprendre la lecture
        videoState = 'playing';
        playButton.innerHTML = '<span><i class="fas fa-pause"></i></span>';
        playButton.classList.add('glassIco--active');
        if (videoElement && videoElement.src) {
            // Réinitialiser le filtre au cas où il aurait été modifié
            videoElement.style.filter = 'contrast(1.1) saturate(1.2)';
            videoElement.play().catch(e => {/* Lecture impossible */});
        }
    } else if (videoState === 'stopped') {
        // Redémarrer de zéro - relancer comme à l'arrivée sur l'étape
        videoState = 'playing';
        playButton.innerHTML = '<span><i class="fas fa-pause"></i></span>';
        playButton.classList.add('glassIco--active');
        
        // Relancer la vidéo de l'étape actuelle
        const stepData = storySteps[currentStepIndex];
        if (stepData && stepData.localVideo && videoElement) {
            showVideo(stepData.localVideo, stepData.position);
        }
    }
}

// Fonction pour gérer le bouton stop
function handleStopButton(playButton, stopButton) {
    if (videoState !== 'stopped') {
        videoState = 'stopped';
        playButton.innerHTML = '<span><i class="fas fa-play"></i></span>';
        playButton.classList.remove('glassIco--active');
        stopButton.classList.add('glassIco--active');
        
        // Animation de disparition de la vidéo
        if (videoElement && videoElement.style.display !== 'none') {
            gsap.to(videoElement, {
                duration: 1.8,
                opacity: 0,
                filter: 'contrast(1.1) saturate(1.2) blur(12px)',
                ease: 'power2.out',
                onComplete: () => {
                    videoElement.style.display = 'none';
                    videoElement.pause();
                    videoElement.currentTime = 0;
                }
            });
        }
    }
}

// Fonction pour réinitialiser l'état vidéo (lors des changements d'étape)
function resetVideoState() {
    videoState = 'playing';
}

// Fonction pour initialiser le module vidéo
function initVideoModule() {
    createVideoElement();
}

// Fonctions getter pour accéder aux variables depuis d'autres modules
function getVideoElement() {
    return videoElement;
}

function getVideoState() {
    return videoState;
}

// Exports publics
export {
    initVideoModule,
    createVideoElement,
    showVideo,
    hideVideo,
    handlePlayButton,
    resetVideoState,
    getVideoElement,
    getVideoState
}; 