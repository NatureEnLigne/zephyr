// --- Panneau de résultats avec animation GSAP ---
// Imports des modules refactorisés
import { storySteps, storyStepsData } from './data.js';
import { createVideoElement, showVideo, hideVideo } from './video.js';
import { showWelcomeScreen, hideWelcomeScreen, restoreNavigationButtons } from './welcome-screen.js';
import { initProgressMinimap, updateProgressMinimap, showProgressMinimap, hideProgressMinimap } from './minimap.js';
import { formatBoldText, applyButtonStyle } from './utilities.js';

let resultsPanel = null;
let previousButton = null;
let nextButton = null;
let currentStepIndex = -1; // Sera mis à 0 au démarrage pour la première étape
let isWelcomeScreen = true; // Indicateur pour l'écran d'accueil

// Boutons de contrôle globaux
let playButton = null;
let stopButton = null;
let storyButton = null;
let infoButton = null;
let scienceButton = null;

// Les données sont maintenant importées depuis data.js

// Fonction createVideoElement déplacée vers video.js

function createResultsPanelDOM(map) {
    resultsPanel = document.createElement('div');
    resultsPanel.id = 'results-panel';
    resultsPanel.className = 'card card--glass';
    resultsPanel.style.position = 'fixed'; 
    resultsPanel.style.width = '400px'; 
    resultsPanel.style.zIndex = '1002';
    resultsPanel.style.transform = 'scaleY(0)';
    resultsPanel.style.opacity = '0';
    resultsPanel.style.display = 'none';

    const overlayImage = document.createElement('img');
    overlayImage.src = 'assets/images/lerateau.png';
    overlayImage.alt = 'Le Râteau';
    overlayImage.className = 'card__overlay-image';
    resultsPanel.appendChild(overlayImage);

    const content = document.createElement('div');
    content.className = 'card__content';
    content.style.color = 'white';
    content.style.background = 'none';
    resultsPanel.appendChild(content);

    const titleElement = document.createElement('div');
    titleElement.className = 'card__title';
    content.appendChild(titleElement);

    const locationElement = document.createElement('div');
    locationElement.className = 'card__location';
    locationElement.innerHTML = '<i class="fas fa-map-marker-alt"></i> <span id="location-text"></span>';
    content.appendChild(locationElement);

    const detailsElement = document.createElement('div');
    detailsElement.id = 'results-details';
    content.appendChild(detailsElement);

    // Variables pour l'état des boutons
    let videoState = 'playing'; // 'playing', 'paused', 'stopped'
    let currentContentType = 'story'; // 'story', 'info', 'science'

    // Création des boutons de contrôle (assignés aux variables globales)
    playButton = document.createElement('button');
    playButton.className = 'glassIco glassIco--active';
    playButton.innerHTML = '<span><i class="fas fa-play"></i></span>';
    playButton.title = 'Lire/Pause la vidéo';

    stopButton = document.createElement('button');
    stopButton.className = 'glassIco';
    stopButton.innerHTML = '<span><i class="fas fa-stop"></i></span>';
    stopButton.title = 'Arrêter la vidéo';

    storyButton = document.createElement('button');
    storyButton.className = 'glassIco glassIco--active';
    storyButton.innerHTML = '<span><i class="fas fa-book-open"></i></span>';
    storyButton.title = 'Afficher l\'histoire';

    infoButton = document.createElement('button');
    infoButton.className = 'glassIco';
    infoButton.innerHTML = '<span><i class="fas fa-info-circle"></i></span>';
    infoButton.title = 'Informations sur l\'espèce';

    scienceButton = document.createElement('button');
    scienceButton.className = 'glassIco';
    scienceButton.innerHTML = '<span><i class="fas fa-flask"></i></span>';
    scienceButton.title = 'Références scientifiques';

    // Gestionnaires d'événements pour les boutons
    playButton.addEventListener('click', () => {
        if (videoState === 'playing') {
            // Passer en pause
            videoState = 'paused';
            playButton.innerHTML = '<span><i class="fas fa-play"></i></span>';
            playButton.classList.remove('glassIco--active');
            stopButton.classList.remove('glassIco--active');
            if (videoElement) {
                videoElement.pause();
            }
        } else if (videoState === 'paused') {
            // Reprendre la lecture
            videoState = 'playing';
            playButton.innerHTML = '<span><i class="fas fa-pause"></i></span>';
            playButton.classList.add('glassIco--active');
            stopButton.classList.remove('glassIco--active');
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
            stopButton.classList.remove('glassIco--active');
            
            // Relancer la vidéo de l'étape actuelle
            const stepData = storySteps[currentStepIndex];
            if (stepData && stepData.localVideo) {
                showVideo(stepData.localVideo, stepData.position);
            }
        }
    });

    stopButton.addEventListener('click', () => {
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
    });

    storyButton.addEventListener('click', () => {
        if (currentContentType !== 'story') {
            currentContentType = 'story';
            updateContentButtons();
            updateContentDisplay();
        }
    });

    infoButton.addEventListener('click', () => {
        if (currentContentType !== 'info') {
            currentContentType = 'info';
            updateContentButtons();
            updateContentDisplay();
        }
    });

    scienceButton.addEventListener('click', () => {
        if (currentContentType !== 'science') {
            currentContentType = 'science';
            updateContentButtons();
            updateContentDisplay();
        }
    });

    function updateContentButtons() {
        // Réinitialiser tous les boutons
        storyButton.classList.remove('glassIco--active');
        infoButton.classList.remove('glassIco--active');
        scienceButton.classList.remove('glassIco--active');
        
        // Activer le bouton approprié
        switch(currentContentType) {
            case 'story':
                storyButton.classList.add('glassIco--active');
                break;
            case 'info':
                infoButton.classList.add('glassIco--active');
                break;
            case 'science':
                scienceButton.classList.add('glassIco--active');
                break;
        }
    }

    function updateContentDisplay() {
        const stepData = storySteps[currentStepIndex];
        const stepContentData = storyStepsData[currentStepIndex.toString()];
        if (!stepData) return;

        // Animation de sortie puis d'entrée
        gsap.to(detailsElement, {
            duration: 0.3,
            opacity: 0,
            y: -10,
            ease: 'power2.in',
            onComplete: () => {
                detailsElement.innerHTML = '';
                
                if (currentContentType === 'story') {
                    const content = stepData.panelContent;
                    const lines = content.split('<br>');
                    lines.forEach((lineText, index) => {
                        const lineDiv = document.createElement('div');
                        lineDiv.innerHTML = formatBoldText(lineText);
                        lineDiv.style.opacity = '0';
                        lineDiv.style.transform = 'translateY(15px)';
                        lineDiv.style.marginBottom = '8px';
                        detailsElement.appendChild(lineDiv);
                        gsap.to(lineDiv, { duration: 0.6, opacity: 1, y: 0, delay: index * 0.1, ease: 'power1.out' });
                    });
                } else if (currentContentType === 'info') {
                    if (stepContentData && stepContentData["Informations sur l'espèce"]) {
                        const infoDiv = document.createElement('div');
                        infoDiv.innerHTML = formatBoldText(stepContentData["Informations sur l'espèce"]);
                        infoDiv.style.opacity = '0';
                        infoDiv.style.transform = 'translateY(15px)';
                        infoDiv.style.fontSize = '0.9em';
                        infoDiv.style.lineHeight = '1.6';
                        detailsElement.appendChild(infoDiv);
                        gsap.to(infoDiv, { duration: 0.6, opacity: 1, y: 0, ease: 'power1.out' });
                    } else {
                        const noInfoDiv = document.createElement('div');
                        noInfoDiv.innerHTML = 'Aucune information disponible pour cette étape.';
                        noInfoDiv.style.opacity = '0.7';
                        detailsElement.appendChild(noInfoDiv);
                    }
                } else if (currentContentType === 'science') {
                    if (stepContentData && stepContentData["Publications scientifiques"]) {
                        const publications = stepContentData["Publications scientifiques"];
                        publications.forEach((publication, index) => {
                            const pubDiv = document.createElement('div');
                            pubDiv.style.marginBottom = '20px';
                            pubDiv.style.opacity = '0';
                            pubDiv.style.transform = 'translateY(15px)';
                            
                            pubDiv.innerHTML = `
                                <div style="font-weight: bold; margin-bottom: 8px; color: #ffffff; font-size: 1.05em;">${formatBoldText(publication.titre)}</div>
                                <div style="margin-bottom: 10px; font-size: 0.9em; line-height: 1.6;">${formatBoldText(publication.resume)}</div>
                                <div style="font-size: 0.8em; opacity: 0.8; font-style: italic;">
                                    <span><strong>Langue :</strong> ${publication.langue}</span> • 
                                    <span><strong>Année :</strong> ${publication.annee}</span> • 
                                    <span><strong>Source :</strong> ${publication.source}</span>
                                </div>
                            `;
                            
                            detailsElement.appendChild(pubDiv);
                            gsap.to(pubDiv, { duration: 0.6, opacity: 1, y: 0, delay: index * 0.2, ease: 'power1.out' });
                        });
                    } else {
                        const noScienceDiv = document.createElement('div');
                        noScienceDiv.innerHTML = 'Aucune publication scientifique disponible pour cette étape.';
                        noScienceDiv.style.opacity = '0.7';
                        detailsElement.appendChild(noScienceDiv);
                    }
                }
                
                gsap.to(detailsElement, {
                    duration: 0.3,
                    opacity: 1,
                    y: 0,
                    ease: 'power2.out'
                });
            }
        });
    }

    // Stocker les références pour utilisation dans updateAndShowPanelForStep
    resultsPanel.updateContentDisplay = updateContentDisplay;
    resultsPanel.updateContentButtons = updateContentButtons;
    resultsPanel.setCurrentContentType = (type) => {
        currentContentType = type;
        updateContentButtons();
    };
    resultsPanel.resetVideoButton = () => {
        videoState = 'playing';
        playButton.innerHTML = '<span><i class="fas fa-pause"></i></span>';
        playButton.classList.add('glassIco--active');
        stopButton.classList.remove('glassIco--active');
    };

    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'card__actions'; 
    resultsPanel.appendChild(buttonsContainer);

    previousButton = document.createElement('button');
    previousButton.id = 'previous-location-button';
    previousButton.className = 'glassIco';
    previousButton.innerHTML = '<span><i class="fas fa-chevron-left"></i></span>';
    previousButton.title = 'Précédent';
    buttonsContainer.appendChild(previousButton);

    // Ajouter les boutons de contrôle créés plus haut
    buttonsContainer.appendChild(playButton);
    buttonsContainer.appendChild(stopButton);
    buttonsContainer.appendChild(storyButton);
    buttonsContainer.appendChild(infoButton);
    buttonsContainer.appendChild(scienceButton);

    nextButton = document.createElement('button');
    nextButton.id = 'next-location-button';
    nextButton.className = 'glassIco';
    nextButton.innerHTML = '<span><i class="fas fa-chevron-right"></i></span>';
    nextButton.title = 'Suivant';
    buttonsContainer.appendChild(nextButton);

    previousButton.addEventListener('click', () => {
        const navigate = () => {
            hideVideo(); // Masquer la vidéo avant navigation
            if (currentStepIndex > 0) {
                currentStepIndex--;
                map.flyTo(storySteps[currentStepIndex].mapState);
                map.once('moveend', () => {
                    updateAndShowPanelForStep(currentStepIndex, false); // Ne pas mettre à jour la mini-carte
                    // Mettre à jour la mini-carte après le mouvement
                    setTimeout(() => updateProgressMinimap(currentStepIndex, false), 500);
                });
            } else if (currentStepIndex === 0) { 
                 currentStepIndex = -1; 
                 map.flyTo(storySteps[0].mapState);
            }
            updateButtonVisibilityInPanel();
        };
        hideResultsPanel(navigate);
    });

    nextButton.addEventListener('click', () => {
        const navigate = () => {
            hideVideo(); // Masquer la vidéo avant navigation
            if (currentStepIndex < storySteps.length - 1) {
                const nextStepIndex = currentStepIndex + 1;
                const currentState = storySteps[currentStepIndex].mapState;
                const nextState = storySteps[nextStepIndex].mapState;
                
                // Afficher d'abord le point suivant en blanc sur la mini-carte
                updateProgressMinimap(currentStepIndex, true); // showNextStep = true
                
                currentStepIndex++;
                
                // Vérifier si les positions sont identiques (même centre, zoom, pitch, bearing)
                // Cas spécial pour Naissance au bord du lac (étape 1) vers Premier vol (étape 2)
                const isStep1to2 = (currentStepIndex - 1 === 1 && currentStepIndex === 2);
                const samePosition = isStep1to2 || (
                    Math.abs(currentState.center[0] - nextState.center[0]) < 0.0001 &&
                    Math.abs(currentState.center[1] - nextState.center[1]) < 0.0001 &&
                    Math.abs(currentState.zoom - nextState.zoom) < 0.01 &&
                    Math.abs(currentState.pitch - nextState.pitch) < 0.01 &&
                    Math.abs(currentState.bearing - nextState.bearing) < 0.01
                );
                
                if (samePosition) {
                    // Position identique détectée, affichage direct du panneau
                    // Pas de mouvement nécessaire, afficher directement le nouveau panneau
                    setTimeout(() => {
                        updateAndShowPanelForStep(currentStepIndex, false); // Ne pas mettre à jour la mini-carte
                        // Mettre à jour la progression complète après un court délai
                        setTimeout(() => updateProgressMinimap(currentStepIndex, false), 500);
                    }, 100);
                } else {
                    map.flyTo(storySteps[currentStepIndex].mapState);
                    map.once('moveend', () => {
                        updateAndShowPanelForStep(currentStepIndex, false); // Ne pas mettre à jour la mini-carte
                        // Mettre à jour la progression complète une fois la caméra arrivée
                        setTimeout(() => updateProgressMinimap(currentStepIndex, false), 500);
                    });
                }
            }
            updateButtonVisibilityInPanel();
        };

        if (resultsPanel && resultsPanel.style.display !== 'none' && currentStepIndex < storySteps.length -1) {
            hideResultsPanel(navigate);
        } else {
            navigate();
        }
    });
    document.body.appendChild(resultsPanel);
}

export function updateAndShowPanelForStep(stepIndex, updateMinimap = true) {
    if (stepIndex < 0 || stepIndex >= storySteps.length) {
        if(resultsPanel) hideResultsPanel();
        if(videoElement) hideVideo();
        updateButtonVisibilityInPanel();
        return;
    }
    
    // Afficher la mini-carte et la mettre à jour seulement si demandé
    showProgressMinimap();
    if (updateMinimap) {
        updateProgressMinimap(stepIndex);
    } else {
        // Si on ne met pas à jour automatiquement, au moins adapter l'emprise
        setTimeout(() => {
            adaptMinimapBounds(stepIndex);
        }, 200);
    }
    
    if (!resultsPanel) return; 

    resultsPanel.style.display = 'block';
    const stepData = storySteps[stepIndex];

    // Masquer la vidéo seulement si l'étape actuelle n'en a pas
    if (!stepData.localVideo) {
        hideVideo();
    }

    // Positionnement du panneau
    if (stepData.position === 'top-left') {
        resultsPanel.style.top = '50px';
        resultsPanel.style.left = '50px';
        resultsPanel.style.bottom = 'auto';
        resultsPanel.style.right = 'auto';
        resultsPanel.style.transformOrigin = 'top left';
    } else if (stepData.position === 'bottom-left') {
        resultsPanel.style.bottom = '50px';
        resultsPanel.style.left = '50px';
        resultsPanel.style.top = 'auto';
        resultsPanel.style.right = 'auto';
        resultsPanel.style.transformOrigin = 'bottom left';
    } else { // Par défaut ou si stepData.position est 'bottom-right'
        resultsPanel.style.bottom = '50px';
        resultsPanel.style.right = '50px';
        resultsPanel.style.top = 'auto';
        resultsPanel.style.left = 'auto';
        resultsPanel.style.transformOrigin = 'bottom right';
    }

    const titleElement = resultsPanel.querySelector('.card__title');
    const locationElement = resultsPanel.querySelector('#location-text');
    const locationContainer = resultsPanel.querySelector('.card__location');
    const detailsContainer = resultsPanel.querySelector('#results-details');
    titleElement.innerText = stepData.panelTitle;
    locationElement.innerText = stepData.location || '';
    // Réafficher l'icône de localisation pour les étapes (cachée seulement pour l'écran d'accueil)
    if (locationContainer) locationContainer.style.display = 'flex';
    detailsContainer.innerHTML = '';

    const overlayImg = resultsPanel.querySelector('.card__overlay-image');
    if (overlayImg) overlayImg.style.display = stepData.showOverlayImage ? 'block' : 'none';

    let videoWidth = resultsPanel.clientWidth - (parseFloat(getComputedStyle(detailsContainer.parentElement).paddingLeft) * 2);
    videoWidth = Math.max(videoWidth, 300); 

    if (stepData.panelContentType === "text") {
        detailsContainer.style.minHeight = 'auto'; 
        const lines = stepData.panelContent.split('<br>\n');
        lines.forEach((lineText, index) => {
            const lineDiv = document.createElement('div');
            lineDiv.innerHTML = lineText;
            lineDiv.style.opacity = '0';
            lineDiv.style.transform = 'translateY(15px)';
            lineDiv.style.marginBottom = '8px';
            detailsContainer.appendChild(lineDiv);
            gsap.to(lineDiv, { duration: 0.6, opacity: 1, y: 0, delay: index * 0.15, ease: 'power1.out' });
        });
    } else if (stepData.panelContentType === "youtube") {
        const videoHeight = Math.round(videoWidth / 16 * 9);
        detailsContainer.style.minHeight = `${videoHeight}px`;
        detailsContainer.innerHTML = `<iframe width="${videoWidth}" height="${videoHeight}" src="https://www.youtube.com/embed/${stepData.panelContent}?start=18&autoplay=1&mute=1&modestbranding=1&rel=0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    } else if (stepData.panelContentType === "local-video") {
        detailsContainer.style.minHeight = 'auto'; 
        const lines = stepData.panelContent.split('<br>');
        lines.forEach((lineText, index) => {
            const lineDiv = document.createElement('div');
            lineDiv.innerHTML = lineText;
            lineDiv.style.opacity = '0';
            lineDiv.style.transform = 'translateY(15px)';
            lineDiv.style.marginBottom = '8px';
            detailsContainer.appendChild(lineDiv);
            gsap.to(lineDiv, { duration: 0.6, opacity: 1, y: 0, delay: index * 0.15, ease: 'power1.out' });
        });
    }

    // Gestion de la vidéo locale
    if (stepData.localVideo && videoElement) {
        showVideo(stepData.localVideo, stepData.position);
    }

    // Réinitialiser les boutons de contrôle à chaque étape
    if (resultsPanel.setCurrentContentType) {
        resultsPanel.setCurrentContentType('story');
    }
    if (resultsPanel.resetVideoButton) {
        resultsPanel.resetVideoButton();
    }

    resultsPanel.style.transform = 'scaleY(0)';
    resultsPanel.style.opacity = '0';
    gsap.to(resultsPanel, { duration: 1.2, scaleY: 1, opacity: 1, ease: 'power3.out' });
    updateButtonVisibilityInPanel();
}

export function hideResultsPanel(onCompleteCallback) {
    if (resultsPanel && resultsPanel.style.display !== 'none') {
        const detailsContainer = resultsPanel.querySelector('#results-details');
        const titleElement = resultsPanel.querySelector('.card__title');
        const locationElement = resultsPanel.querySelector('.card__location');
        const buttonsContainer = resultsPanel.querySelector('.card__actions');
        
        // Timeline pour animation de fermeture en trois phases
        const hideTimeline = gsap.timeline();
        
        // Phase 1: Rembobiner le contenu texte (animation inverse de l'apparition) - plus rapide
        if (detailsContainer && detailsContainer.children.length > 0) {
            // Animer la disparition de chaque ligne de texte dans l'ordre inverse
            hideTimeline.to(Array.from(detailsContainer.children).reverse(), {
                opacity: 0,
                y: -15,
                duration: 0.2,
                stagger: 0.05,
                ease: 'power2.in'
            });
        }
        
        // Phase 2: Faire disparaître le titre et la localisation
        hideTimeline.to([titleElement, locationElement], {
            opacity: 0,
            y: -10,
            duration: 0.3,
            ease: 'power2.in'
        }, "-=0.1");
        
        // Phase 2.5: Faire disparaître les boutons sans déformation
        if (buttonsContainer) {
            hideTimeline.to(buttonsContainer, {
                opacity: 0,
                y: 10,
                duration: 0.25,
                ease: 'power2.in'
            }, "-=0.15");
        }
        
        // Phase 3: Fermer la card vide (sans contenu pour éviter déformation)
        hideTimeline.to(resultsPanel, {
            scaleY: 0,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.in',
            onComplete: () => {
                resultsPanel.style.display = 'none';
                // Réinitialiser les opacités pour la prochaine ouverture
                if (detailsContainer) {
                    Array.from(detailsContainer.children).forEach(child => {
                        gsap.set(child, { opacity: 1, y: 0 });
                    });
                }
                if (titleElement) gsap.set(titleElement, { opacity: 1, y: 0 });
                if (locationElement) gsap.set(locationElement, { opacity: 1, y: 0 });
                if (buttonsContainer) gsap.set(buttonsContainer, { opacity: 1, y: 0 });
                
                if (onCompleteCallback) onCompleteCallback();
            }
        });
    } else {
        if (onCompleteCallback) onCompleteCallback();
    }
}

// Fonctions showVideo, hideVideo et applyButtonStyle déplacées vers les modules spécialisés

// Fonctions d'animation du titre déplacées vers title-animation.js

function animateTitle() {
    const { titleElement, letters } = createAnimatedTitle();
    const infoElement = document.getElementById('title-info');
    
    // Afficher le titre mais transparent au début
    titleElement.style.display = 'block';
    titleElement.style.opacity = '1';
    
    // Préparer les lettres avec une position initiale simple (légèrement vers le haut)
    letters.forEach((letter) => {
        gsap.set(letter, {
            opacity: 0,
            y: -30,
            x: 0,
            rotation: 0,
            rotationX: 0,
            rotationY: 0,
            scale: 1,
            filter: 'blur(0px)',
            transformOrigin: "center center"
        });
    });
    
    // Préparer le sous-titre (invisible au début)
    gsap.set(infoElement, {
        opacity: 0,
        y: 20
    });
    
    // Préparer les icônes (invisibles au début)
    const icons = infoElement.querySelectorAll('i');
    if (icons.length > 0) {
        gsap.set(icons, {
            opacity: 0,
            scale: 0.8,
            rotation: 0
        });
    }
    
    // Timeline pour l'animation complète
    const titleTimeline = gsap.timeline();
    
    // Phase 1: Animation d'entrée simple des lettres
    titleTimeline.to(letters, {
        opacity: 1,
        y: 0,
        duration: 1,
        stagger: {
            each: 0.05,
            from: "start"
        },
        ease: "power2.out"
    });
    
    // Phase 2: Apparition du sous-titre après un délai
    titleTimeline.to(infoElement, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out"
    }, "+=0.3"); // Délai de 0.3s après la fin des lettres
    
    // Phase 3: Apparition des icônes
    if (icons.length > 0) {
        titleTimeline.to(icons, {
            opacity: 1,
            scale: 1,
            duration: 0.6,
            stagger: 0.2,
            ease: "back.out(1.2)"
        }, "-=0.4"); // Commence 0.4s avant la fin du sous-titre
    }
    
    // Phase 4: Effet de scintillement sur certaines lettres (une sur trois)
    const sparkleLetters = letters.filter((_, index) => index % 3 === 0);
    titleTimeline.to(sparkleLetters, {
        textShadow: "0 0 15px rgba(255,215,0,1), 0 0 30px rgba(255,255,255,0.8), 0 0 45px rgba(135,206,235,0.4)",
        duration: 0.8,
        stagger: {
            each: 0.2,
            from: "random"
        },
        yoyo: true,
        repeat: -1,
        ease: "power2.inOut"
    }, "+=0.5"); // Commence 0.5s après la fin des icônes
    
    return titleTimeline;
}

function hideAnimatedTitle() {
    const titleElement = document.getElementById('app-title');
    const infoElement = document.getElementById('title-info');
    
    if (titleElement) {
        const letters = titleElement.querySelectorAll('.title-letter');
        
        // Arrêter toutes les animations continues
        gsap.killTweensOf(letters);
        
        return gsap.timeline()
            // Phase 1: Effet de "explosion" sur les icônes
            .to(infoElement.querySelectorAll('i'), {
                scale: 0,
                rotation: 360,
                opacity: 0,
                duration: 0.5,
                stagger: 0.1,
                ease: "back.in(1.7)"
            })
            // Phase 2: Texte info disparaît avec effet de glitch
            .to(infoElement, {
                opacity: 0,
                y: 30,
                skewX: 5,
                filter: 'blur(3px)',
                duration: 0.6,
                ease: "power2.in"
            }, "-=0.3")
            // Phase 3: Lettres s'envolent dans toutes les directions
            .to(letters, {
                opacity: 0,
                y: (index) => gsap.utils.random(-150, -300),
                x: (index) => gsap.utils.random(-100, 100),
                rotation: (index) => gsap.utils.random(-360, 360),
                rotationX: (index) => gsap.utils.random(-180, 180),
                rotationY: (index) => gsap.utils.random(-90, 90),
                scale: (index) => gsap.utils.random(0.1, 0.5),
                filter: 'blur(8px)',
                duration: 1.2,
                stagger: {
                    each: 0.04,
                    from: "center",
                    ease: "power1.in"
                },
                ease: "power2.in"
            }, "-=0.4")
            // Phase 4: Implosion finale
            .to(letters, {
                scale: 0,
                opacity: 0,
                duration: 0.3,
                ease: "power3.in"
            }, "-=0.6")
            // Phase 5: Disparition du conteneur avec effet de fade
            .to(titleElement, {
                opacity: 0,
                scale: 0.8,
                filter: 'blur(10px)',
                duration: 0.5,
                ease: "power2.in",
                onComplete: () => {
                    titleElement.style.display = 'none';
                    // Nettoyer les styles appliqués
                    letters.forEach(letter => {
                        gsap.clearProps(letter);
                    });
                }
            }, "-=0.2");
    }
}

function showWelcomeScreen(map) {
    if (!resultsPanel) return;

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
    
    titleElement.innerText = 'Bienvenue sur cette story map';
    
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
    startButton.className = 'welcome-start-button';
    startButton.innerHTML = '<span>Commencer l\'histoire</span>';
    startButton.title = 'Commencer l\'histoire';
    startButton.style.width = 'auto';
    startButton.style.padding = '12px 24px';
    startButton.style.fontSize = '16px';
    startButton.style.fontWeight = '700';
    // Styles du bouton sans effet glassIco
    startButton.style.background = 'rgba(255, 255, 255, 0.1)';
    startButton.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    startButton.style.borderRadius = '8px';
    startButton.style.color = 'white';
    startButton.style.cursor = 'pointer';
    startButton.style.transition = 'all 0.3s ease';
    startButton.style.backdropFilter = 'blur(12px)';
    buttonsContainer.appendChild(startButton);

    // Effet hover propre pour le bouton d'accueil
    startButton.addEventListener('mouseenter', () => {
        startButton.style.background = 'rgba(255, 255, 255, 0.2)';
        startButton.style.borderColor = 'rgba(255, 255, 255, 0.4)';
        startButton.style.transform = 'translateY(-1px)';
    });
    
    startButton.addEventListener('mouseleave', () => {
        startButton.style.background = 'rgba(255, 255, 255, 0.1)';
        startButton.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        startButton.style.transform = 'translateY(0)';
    });

    startButton.addEventListener('click', () => {
        isWelcomeScreen = false;
        stopPanning();
        
        // Cacher le titre animé
        hideAnimatedTitle();
        
        hideResultsPanel(() => {
            // Restaurer les boutons de navigation
            restoreNavigationButtons();
            currentStepIndex = 0;
            map.flyTo(storySteps[currentStepIndex].mapState);
            map.once('moveend', () => {
                updateAndShowPanelForStep(currentStepIndex);
            });
        });
    });

    // Animation d'apparition du panneau
    resultsPanel.style.transform = 'scaleY(0)';
    resultsPanel.style.opacity = '0';
    gsap.to(resultsPanel, { duration: 1.5, scaleY: 1, opacity: 1, ease: 'power3.out', delay: 1 });
}

function startPanning(map) {
    // Animation subtile pour simuler la rotation naturelle de la Terre
    let startTime = Date.now();
    
    function updateEarthMovement() {
        if (isWelcomeScreen) {
            const elapsed = (Date.now() - startTime) / 1000; // temps en secondes
            
            // Rotation principale clairement visible
            const mainRotation = elapsed * 0.25; // Beaucoup plus visible
            
            // Oscillation cyclique marquée
            const oscillation = Math.sin(elapsed * 0.3) * 0.8;
            
            // Mouvement de "respiration" visible sur le pitch
            const breathPitch = Math.sin(elapsed * 0.2) * 0.6;
            
            // Zoom cyclique plus marqué
            const breathZoom = Math.sin(elapsed * 0.18) * 0.08;
            
            // Application des mouvements
            map.setBearing(mainRotation + oscillation);
            map.setPitch(Math.max(0, breathPitch)); // Éviter les valeurs négatives
            map.setZoom(5.2 + breathZoom);
            
            requestAnimationFrame(updateEarthMovement);
        }
    }
    
    updateEarthMovement();
}

function stopPanning() {
    // Le panning s'arrête automatiquement quand isWelcomeScreen devient false
}

function restoreNavigationButtons() {
    if (!resultsPanel) return;
    
    const buttonsContainer = resultsPanel.querySelector('.card__actions');
    buttonsContainer.innerHTML = '';

    // Recréer les boutons de navigation dans le bon ordre
    buttonsContainer.appendChild(previousButton);
    buttonsContainer.appendChild(playButton);
    buttonsContainer.appendChild(stopButton);
    buttonsContainer.appendChild(storyButton);
    buttonsContainer.appendChild(infoButton);
    buttonsContainer.appendChild(scienceButton);
    buttonsContainer.appendChild(nextButton);
}

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

// Variables pour l'animation de la ligne
let lineAnimationProgress = 0;
let lineAnimationId = null;
let previousStepIndex = -1;

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

// Fonction pour afficher la mini-carte
function showProgressMinimap() {
    const minimap = document.getElementById('progress-minimap');
    if (minimap) {
        minimap.style.display = 'block';
        
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

export function initStoryUI(map) {
    createResultsPanelDOM(map);
    createVideoElement();
    
    // Initialiser la mini-carte de progression
    initProgressMinimap();
    
    // Démarrer l'écran d'accueil avec panning automatique
    setTimeout(() => {
        showWelcomeScreen(map);
        startPanning(map);
    }, 1000);
}

function updateButtonVisibilityInPanel() {
    if (!previousButton || !nextButton || isWelcomeScreen) return;
    previousButton.style.display = (currentStepIndex > 0) ? 'inline-block' : 'none';
    nextButton.style.display = (currentStepIndex < storySteps.length - 1 && currentStepIndex !== -1) ? 'inline-block' : 'none';
}

export function createDebugOverlay(map) { 
    const overlay = document.createElement('div');
    overlay.id = 'debug-overlay';
    overlay.style.position = 'absolute';
    overlay.style.top = '10px';
    overlay.style.left = '10px';
    overlay.style.padding = '10px';
    overlay.style.background = 'rgba(0, 0, 0, 0.7)';
    overlay.style.color = 'white';
    overlay.style.zIndex = '1000';
    overlay.style.fontSize = '14px';
    overlay.style.fontFamily = 'monospace';
    document.body.appendChild(overlay);

    function updateOverlay() {
        const center = map.getCenter();
        const zoom = map.getZoom().toFixed(2);
        const pitch = map.getPitch().toFixed(2);
        const bearing = map.getBearing().toFixed(2);
        overlay.innerHTML = 
            `Center: ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}<br>
             Zoom: ${zoom}<br>
             Pitch: ${pitch}<br>
             Bearing: ${bearing}`;
    }

    map.on('move', updateOverlay);
    map.on('zoom', updateOverlay);
    map.on('pitch', updateOverlay);
    map.on('rotate', updateOverlay);

    updateOverlay(); // Initial call
} 