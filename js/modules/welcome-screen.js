// Module pour la gestion de l'écran d'accueil
import { animateTitle, hideAnimatedTitle } from './title-animation.js';
import { formatBoldText } from './utilities.js';

// Variables privées du module
let isWelcomeScreen = false;

// Getters pour accéder aux variables privées
export function getIsWelcomeScreen() {
    return isWelcomeScreen;
}

export function setIsWelcomeScreen(value) {
    isWelcomeScreen = value;
}

export function showWelcomeScreen(map, resultsPanel, callbacks) {
    if (!resultsPanel) return;

    isWelcomeScreen = true;

    // Animer le titre au démarrage
    setTimeout(() => {
        animateTitle();
    }, 800);

    resultsPanel.style.display = 'block';
    resultsPanel.style.bottom = '50px';
    resultsPanel.style.right = '50px';
    resultsPanel.style.top = 'auto';
    resultsPanel.style.left = 'auto';
    resultsPanel.style.transformOrigin = 'bottom right';

    const titleElement = resultsPanel.querySelector('.card__title');
    const detailsContainer = resultsPanel.querySelector('#results-details');
    
    titleElement.innerText = 'Un nid, un envol, une histoire';
    
    const welcomeContent = `Bienvenue dans l'histoire de **Zéphyr**, un jeune balbuzard pêcheur né sur les hauteurs d'un lac vosgien.<br><br>Tu vas suivre, à travers ses yeux, un voyage extraordinaire : **de la naissance au départ**, de la **migration vers l'Afrique** à son **retour au nid**, en passant par les dangers, les plages, les perchoirs urbains… et les souvenirs.<br><br>**Cette carte raconte une histoire vraie**, inspirée d'un suivi scientifique par balise GPS.<br><br>En plus de l'histoire <i class="fas fa-book-open" style="color: #fff; margin: 0 5px;"></i>, à chaque étape les plus curieux trouveront des informations naturalistes <i class="fas fa-info-circle" style="color: #fff; margin: 0 5px;"></i> et les plus scientifiques des publications <i class="fas fa-flask" style="color: #fff; margin: 0 5px;"></i>.`;
    
    detailsContainer.innerHTML = '';
    const lines = welcomeContent.split('<br><br>');
    lines.forEach((lineText, index) => {
        const lineDiv = document.createElement('div');
        lineDiv.innerHTML = formatBoldText(lineText);
        lineDiv.style.opacity = '0';
        lineDiv.style.transform = 'translateY(15px)';
        // Même espacement pour tous les paragraphes (12px)
        lineDiv.style.marginBottom = '12px';
        detailsContainer.appendChild(lineDiv);
        gsap.to(lineDiv, { duration: 0.8, opacity: 1, y: 0, delay: index * 0.3, ease: 'power1.out' });
    });

    // Masquer l'image overlay pour l'écran d'accueil
    const overlayImg = resultsPanel.querySelector('.card__overlay-image');
    if (overlayImg) overlayImg.style.display = 'none';

    // Masquer l'icône de localisation pour l'écran d'accueil (pas de lieu spécifique)
    const locationElement = resultsPanel.querySelector('.card__location');
    if (locationElement) locationElement.style.display = 'none';

    // Créer le bouton "Commencer l'histoire"
    const buttonsContainer = resultsPanel.querySelector('.card__actions');
    buttonsContainer.innerHTML = '';
    // Réduire l'espacement pour qu'il soit identique à celui entre titre et paragraphe
    buttonsContainer.style.marginTop = '0px';
    
    const startButton = document.createElement('button');
    startButton.className = 'welcome-button';
    startButton.innerHTML = '<span>Commencer l\'histoire</span>';
    startButton.title = 'Commencer l\'histoire';
    buttonsContainer.appendChild(startButton);

    startButton.addEventListener('click', () => {
        isWelcomeScreen = false;
        stopPanning();
        
        // Cacher le titre animé
        hideAnimatedTitle();
        
        callbacks.hideResultsPanel(() => {
            callbacks.restoreNavigationButtons();
            callbacks.startStory(map);
        });
    });

    // Animation d'apparition du panneau
    resultsPanel.style.transform = 'scaleY(0)';
    resultsPanel.style.opacity = '0';
    gsap.to(resultsPanel, { duration: 1.5, scaleY: 1, opacity: 1, ease: 'power3.out', delay: 1 });
}

export function startPanning(map) {
    // Animation lente vers l'étape 1 en 5 minutes (300 secondes)
    let startTime = Date.now();
    
    // Position initiale (définie dans ui.js)
    const startPosition = { center: [2.3522, 46.2276], zoom: 5.2, pitch: 0.00, bearing: 0.00 };
    
    // Position cible (étape 1 depuis data.js)
    const targetPosition = { center: [6.9022, 48.4634], zoom: 16.69, pitch: 82.88, bearing: 80.70 };
    
    // Durée de l'animation : 5 minutes = 300 secondes
    const animationDuration = 300;
    
    function updateEarthMovement() {
        if (isWelcomeScreen) {
            const elapsed = (Date.now() - startTime) / 1000; // temps en secondes
            const progress = Math.min(elapsed / animationDuration, 1); // progression de 0 à 1
            
            // Fonction d'easing pour un mouvement fluide (ease-in-out)
            const easeInOut = progress < 0.5 
                ? 2 * progress * progress 
                : -1 + (4 - 2 * progress) * progress;
            
            // Interpolation linéaire entre position de départ et position cible
            const currentCenter = [
                startPosition.center[0] + (targetPosition.center[0] - startPosition.center[0]) * easeInOut,
                startPosition.center[1] + (targetPosition.center[1] - startPosition.center[1]) * easeInOut
            ];
            
            const currentZoom = startPosition.zoom + (targetPosition.zoom - startPosition.zoom) * easeInOut;
            const currentPitch = startPosition.pitch + (targetPosition.pitch - startPosition.pitch) * easeInOut;
            const currentBearing = startPosition.bearing + (targetPosition.bearing - startPosition.bearing) * easeInOut;
            
            // Ajout de petites oscillations subtiles pour donner vie au mouvement
            const oscillation = Math.sin(elapsed * 0.1) * 0.3;
            const breathZoom = Math.sin(elapsed * 0.08) * 0.02;
            
            // Application des mouvements
            map.setCenter(currentCenter);
            map.setZoom(currentZoom + breathZoom);
            map.setPitch(Math.max(0, currentPitch));
            map.setBearing(currentBearing + oscillation);
            
            requestAnimationFrame(updateEarthMovement);
        }
    }
    
    updateEarthMovement();
}

export function stopPanning() {
    // Le panning s'arrête automatiquement quand isWelcomeScreen devient false
}

export function restoreNavigationButtons(resultsPanel, previousButton, playButton, storyButton, infoButton, scienceButton, textSizeDownButton, textSizeButton, nextButton) {
    if (!resultsPanel) return;
    
    const buttonsContainer = resultsPanel.querySelector('.card__actions');
    buttonsContainer.innerHTML = '';

    // Recréer les boutons de navigation dans le bon ordre
    buttonsContainer.appendChild(previousButton);
    buttonsContainer.appendChild(playButton);
    buttonsContainer.appendChild(storyButton);
    buttonsContainer.appendChild(infoButton);
    buttonsContainer.appendChild(scienceButton);
    buttonsContainer.appendChild(textSizeDownButton);
    buttonsContainer.appendChild(textSizeButton);
    buttonsContainer.appendChild(nextButton);
}

export function initWelcomeScreen(map, resultsPanel, callbacks) {
    setTimeout(() => {
        showWelcomeScreen(map, resultsPanel, callbacks);
        startPanning(map);
    }, 1000);
} 