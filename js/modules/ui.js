// --- Panneau de résultats avec animation GSAP ---

import { storyStepsData, storySteps } from './data.js';
import { initProgressMinimap, updateProgressMinimap, showProgressMinimap, hideProgressMinimap, hideProgressMinimapAnimated, adaptMinimapBounds, adaptMinimapBoundsForTimelineJump } from './minimap.js';
import { initVideoModule, showVideo, hideVideo, handlePlayButton, resetVideoState, getVideoElement } from './video.js';
import { createAnimatedTitle, animateTitle, hideAnimatedTitle } from './title-animation.js';
import { formatBoldText, applyButtonStyle } from './utilities.js';
import { showWelcomeScreen, startPanning, restoreNavigationButtons, getIsWelcomeScreen, setIsWelcomeScreen } from './welcome-screen.js';
import { initStepTimeline, updateStepTimeline, showStepTimeline, hideStepTimeline } from './step-timeline.js';

let resultsPanel = null;
let previousButton = null;
let nextButton = null;
let currentStepIndex = -1; // Sera mis à 0 au démarrage pour la première étape
let panningAnimation = null; // Animation de panning automatique

// Boutons de contrôle globaux
let playButton = null;
let textSizeButton = null;
let textSizeDownButton = null;
let storyButton = null;
let infoButton = null;
let scienceButton = null;

// Variables de mini-carte maintenant dans minimap.js

// Vue initiale de la France métropolitaine pour l'écran d'accueil
const initialMapViewState = { center: [2.3522, 46.2276], zoom: 5.2, pitch: 0.00, bearing: 0.00 };




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
    let currentContentType = 'story'; // 'story', 'info', 'science'

    // Création des boutons de contrôle (assignés aux variables globales)
    playButton = document.createElement('button');
    playButton.className = 'glassIco glassIco--active';
    playButton.innerHTML = '<span><i class="fas fa-play"></i></span>';
    playButton.title = 'Lire/Pause la vidéo';

    textSizeButton = document.createElement('button');
    textSizeButton.className = 'glassIco';
    textSizeButton.innerHTML = '<span><i class="fas fa-search-plus"></i></span>';
    textSizeButton.title = 'Augmenter la taille du texte';

    textSizeDownButton = document.createElement('button');
    textSizeDownButton.className = 'glassIco';
    textSizeDownButton.innerHTML = '<span><i class="fas fa-search-minus"></i></span>';
    textSizeDownButton.title = 'Diminuer la taille du texte';

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

    // Variables pour la taille de texte
    let currentTextSize = 1; // Taille par défaut
    const minTextSize = 0.7;
    const maxTextSize = 1.5;
    const textSizeStep = 0.1;

    // Fonctions pour afficher les tooltips dans le panneau de droite
    function showButtonTooltip(title, description) {
        // Créer ou récupérer l'overlay du panneau
        let panelOverlay = resultsPanel.querySelector('.panel-tooltip-overlay');
        if (!panelOverlay) {
            panelOverlay = document.createElement('div');
            panelOverlay.className = 'panel-tooltip-overlay';
            panelOverlay.innerHTML = `
                <div class="panel-tooltip-content">
                    <div class="panel-tooltip-title"></div>
                    <div class="panel-tooltip-description"></div>
                </div>
            `;
            resultsPanel.appendChild(panelOverlay);
        }
        
        const tooltipTitle = panelOverlay.querySelector('.panel-tooltip-title');
        const tooltipDescription = panelOverlay.querySelector('.panel-tooltip-description');
        const cardContent = resultsPanel.querySelector('.card__content');
        
        if (tooltipTitle && tooltipDescription) {
            tooltipTitle.textContent = title;
            tooltipDescription.textContent = description;
            
            // Ajouter l'effet de flou sur le contenu de la card
            if (cardContent) {
                cardContent.classList.add('blur-content');
            }
            
            panelOverlay.classList.add('show');
        }
    }
    
    function hideButtonTooltip() {
        const panelOverlay = resultsPanel.querySelector('.panel-tooltip-overlay');
        const cardContent = resultsPanel.querySelector('.card__content');
        
        if (panelOverlay) {
            panelOverlay.classList.remove('show');
        }
        
        // Supprimer l'effet de flou du contenu de la card
        if (cardContent) {
            cardContent.classList.remove('blur-content');
        }
    }

    // Gestionnaires d'événements pour les boutons
    playButton.addEventListener('click', () => {
        handlePlayButton(playButton, null, currentStepIndex);
    });
    
    // Événements de survol pour les tooltips
    playButton.addEventListener('mouseenter', () => {
        showButtonTooltip('Lecture vidéo', 'Lancer ou mettre en pause la vidéo de l\'étape');
    });
    playButton.addEventListener('mouseleave', hideButtonTooltip);

    textSizeButton.addEventListener('click', () => {
        if (currentTextSize < maxTextSize) {
            currentTextSize += textSizeStep;
            updateTextSize();
        }
    });
    textSizeButton.addEventListener('mouseenter', () => {
        showButtonTooltip('Agrandir le texte', 'Augmenter la taille du texte pour une meilleure lisibilité');
    });
    textSizeButton.addEventListener('mouseleave', hideButtonTooltip);

    textSizeDownButton.addEventListener('click', () => {
        if (currentTextSize > minTextSize) {
            currentTextSize -= textSizeStep;
            updateTextSize();
        }
    });
    textSizeDownButton.addEventListener('mouseenter', () => {
        showButtonTooltip('Réduire le texte', 'Diminuer la taille du texte pour plus de contenu visible');
    });
    textSizeDownButton.addEventListener('mouseleave', hideButtonTooltip);

    function updateTextSize() {
        const detailsElement = resultsPanel.querySelector('#results-details');
        if (detailsElement) {
            detailsElement.style.fontSize = `${currentTextSize}em`;
        }
    }

    storyButton.addEventListener('click', () => {
        if (currentContentType !== 'story') {
            currentContentType = 'story';
            updateContentButtons();
            updateContentDisplay();
        }
    });
    storyButton.addEventListener('mouseenter', () => {
        showButtonTooltip('Histoire de Zéphyr', 'Afficher le récit narratif de l\'aventure du balbuzard');
    });
    storyButton.addEventListener('mouseleave', hideButtonTooltip);

    infoButton.addEventListener('click', () => {
        if (currentContentType !== 'info') {
            currentContentType = 'info';
            updateContentButtons();
            updateContentDisplay();
        }
    });
    infoButton.addEventListener('mouseenter', () => {
        showButtonTooltip('Informations sur l\'espèce', 'Pour les curieux de nature : des informations sur l\'espèce');
    });
    infoButton.addEventListener('mouseleave', hideButtonTooltip);

    scienceButton.addEventListener('click', () => {
        if (currentContentType !== 'science') {
            currentContentType = 'science';
            updateContentButtons();
            updateContentDisplay();
        }
    });
    scienceButton.addEventListener('mouseenter', () => {
        showButtonTooltip('Publications scientifiques', 'Références et études académiques sur l\'espèce');
    });
    scienceButton.addEventListener('mouseleave', hideButtonTooltip);

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
                    
                    // Gestion spéciale pour le contenu HTML
                    if (stepData.panelContentType === 'html') {
                        const contentDiv = document.createElement('div');
                        contentDiv.innerHTML = content;
                        contentDiv.style.opacity = '0';
                        contentDiv.style.transform = 'translateY(15px)';
                        detailsElement.appendChild(contentDiv);
                        gsap.to(contentDiv, { duration: 0.8, opacity: 1, y: 0, ease: 'power1.out' });
                    } else {
                        // Gestion normale pour le texte
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
                    }
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
        resetVideoState();
        playButton.innerHTML = '<span><i class="fas fa-pause"></i></span>';
        playButton.classList.add('glassIco--active');
    };

    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'card__actions'; 
    resultsPanel.appendChild(buttonsContainer);

    previousButton = document.createElement('button');
    previousButton.id = 'previous-location-button';
    previousButton.className = 'glassIco';
    previousButton.innerHTML = '<span><i class="fas fa-chevron-left"></i></span>';
    previousButton.title = 'Précédent';
    previousButton.addEventListener('mouseenter', () => {
        showButtonTooltip('Étape précédente', 'Revenir à l\'étape précédente du voyage de Zéphyr');
    });
    previousButton.addEventListener('mouseleave', hideButtonTooltip);
    buttonsContainer.appendChild(previousButton);

    // Ajouter les boutons de contrôle créés plus haut
    buttonsContainer.appendChild(playButton);
    buttonsContainer.appendChild(storyButton);
    buttonsContainer.appendChild(infoButton);
    buttonsContainer.appendChild(scienceButton);
    buttonsContainer.appendChild(textSizeDownButton);
    buttonsContainer.appendChild(textSizeButton);

    nextButton = document.createElement('button');
    nextButton.id = 'next-location-button';
    nextButton.className = 'glassIco';
    nextButton.innerHTML = '<span><i class="fas fa-chevron-right"></i></span>';
    nextButton.title = 'Suivant';
    nextButton.addEventListener('mouseenter', () => {
        showButtonTooltip('Étape suivante', 'Continuer vers la prochaine étape du voyage de Zéphyr');
    });
    nextButton.addEventListener('mouseleave', hideButtonTooltip);
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

        // Cas spécial : si on va VERS l'étape finale (13)
        if (currentStepIndex === storySteps.length - 2) {
            // On est à l'avant-dernière étape et on va vers la finale
            // Masquer d'abord la mini-carte, puis le panneau, puis naviguer
            hideProgressMinimapAnimated(() => {
                // Une fois la mini-carte masquée, masquer le panneau
                if (resultsPanel && resultsPanel.style.display !== 'none') {
                    hideResultsPanel(navigate);
                } else {
                    navigate();
                }
            });
        } else if (resultsPanel && resultsPanel.style.display !== 'none' && currentStepIndex < storySteps.length -1) {
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
        if(getVideoElement()) hideVideo();
        updateButtonVisibilityInPanel();
        return;
    }
    
    // Gérer l'affichage de la mini-carte de façon stable
    const minimapPanel = document.getElementById('progress-minimap');
    if (stepIndex !== storySteps.length - 1) {
        // Pour toutes les étapes sauf la finale, s'assurer que la minicarte est visible
        // Vérifier si elle est masquée ou pas encore affichée
        if (minimapPanel && (minimapPanel.style.display === 'none' || minimapPanel.style.display === '')) {
            showProgressMinimap();
        }
    }
    
    showStepTimeline();
    if (updateMinimap) {
        updateProgressMinimap(stepIndex);
        updateStepTimeline(stepIndex);
    } else {
        // Si on ne met pas à jour automatiquement, au moins adapter l'emprise
        setTimeout(() => {
            adaptMinimapBounds(stepIndex);
            updateStepTimeline(stepIndex);
        }, 200);
    }
    
    if (!resultsPanel) return; 

    resultsPanel.style.display = 'block';
    
    // Remettre l'affichage des boutons si on n'est pas à l'étape finale
    if (stepIndex !== storySteps.length - 1) {
        const buttonsContainer = resultsPanel.querySelector('.card__actions');
        if (buttonsContainer) buttonsContainer.style.display = 'flex';
    }
    
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
    } else if (stepData.panelContentType === "html") {
        detailsContainer.style.minHeight = 'auto'; 
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = stepData.panelContent;
        contentDiv.style.opacity = '0';
        contentDiv.style.transform = 'translateY(15px)';
        detailsContainer.appendChild(contentDiv);
        gsap.to(contentDiv, { duration: 0.8, opacity: 1, y: 0, ease: 'power1.out' });
        
        // Gestion spéciale pour l'étape finale
        if (stepIndex === storySteps.length - 1) {
            // La mini-carte est déjà masquée avant l'arrivée, pas besoin de la masquer ici
            
            // Masquer les boutons de navigation pour l'étape finale
            const buttonsContainer = resultsPanel.querySelector('.card__actions');
            if (buttonsContainer) {
                buttonsContainer.style.display = 'none';
            }
            
            // Ajouter l'événement au bouton "Recommencer l'histoire"
            setTimeout(() => {
                const restartButton = document.getElementById('restart-story-button');
                if (restartButton) {
                    restartButton.addEventListener('click', () => {
                        // Remettre l'affichage des boutons
                        if (buttonsContainer) buttonsContainer.style.display = 'flex';
                        
                        // Cacher le panneau actuel puis redémarrer
                        hideResultsPanel(() => {
                            currentStepIndex = 0;
                            // Utiliser la référence map stockée globalement
                            const mapInstance = window.storyMap;
                            if (mapInstance) {
                                mapInstance.flyTo(storySteps[0].mapState);
                                mapInstance.once('moveend', () => {
                                    updateAndShowPanelForStep(0);
                                });
                            }
                        });
                    });
                }
            }, 100);
        }
    }

    // Gestion de la vidéo locale
    if (stepData.localVideo && getVideoElement()) {
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










export function initStoryUI(map) {
    createResultsPanelDOM(map);
    initVideoModule();
    
    // Initialiser la mini-carte de progression
    initProgressMinimap();
    
    // Initialiser la timeline d'étapes
    initStepTimeline();
    
    // Écouter les événements de navigation depuis la timeline
    document.addEventListener('navigateToStep', (event) => {
        const { stepIndex } = event.detail;
        navigateToStepFromTimeline(stepIndex, map);
    });
    
    // Démarrer l'écran d'accueil avec panning automatique
    setTimeout(() => {
        showWelcomeScreen(map, resultsPanel, {
            hideResultsPanel: hideResultsPanel,
            restoreNavigationButtons: () => restoreNavigationButtons(resultsPanel, previousButton, playButton, storyButton, infoButton, scienceButton, textSizeDownButton, textSizeButton, nextButton),
            startStory: (map) => {
            currentStepIndex = 0;
            map.flyTo(storySteps[currentStepIndex].mapState);
            map.once('moveend', () => {
                updateAndShowPanelForStep(currentStepIndex);
            });
            }
        });
        startPanning(map);
    }, 1000);
}

// Fonction pour naviguer depuis la timeline
function navigateToStepFromTimeline(stepIndex, map) {
    if (stepIndex < 0 || stepIndex >= storySteps.length) return;
    
    const navigate = () => {
        hideVideo(); // Masquer la vidéo avant navigation (même effet que navigation normale)
        
        console.log(`Timeline navigation: jumping from step ${currentStepIndex} to step ${stepIndex}`);
        currentStepIndex = stepIndex;
        
        map.flyTo(storySteps[currentStepIndex].mapState);
        map.once('moveend', () => {
            updateAndShowPanelForStep(currentStepIndex);
            
            // Mettre à jour la mini-carte avec un rafraîchissement complet pour les sauts de timeline
            setTimeout(() => {
                console.log(`Updating minimap for timeline jump to step ${currentStepIndex}`);
                
                // Forcer une mise à jour complète des éléments de progression
                updateProgressMinimap(currentStepIndex, false);
                
                // Attendre que les éléments soient rendus puis adapter l'emprise
                setTimeout(() => {
                    console.log(`Adapting bounds for timeline jump to step ${currentStepIndex}`);
                    adaptMinimapBoundsForTimelineJump(currentStepIndex);
                }, 300);
            }, 600);
        });
    };
    
    // Cas spécial : si on navigue VERS l'étape finale (13) via la timeline
    if (stepIndex === storySteps.length - 1) {
        // On va vers l'étape finale
        // Masquer d'abord la mini-carte, puis le panneau, puis naviguer
        hideProgressMinimapAnimated(() => {
            // Une fois la mini-carte masquée, masquer le panneau
            if (resultsPanel && resultsPanel.style.display !== 'none') {
                hideResultsPanel(navigate);
            } else {
                navigate();
            }
        });
    } else if (resultsPanel && resultsPanel.style.display !== 'none') {
        hideResultsPanel(navigate);
    } else {
        navigate();
    }
}

function updateButtonVisibilityInPanel() {
    if (!previousButton || !nextButton || getIsWelcomeScreen()) return;
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