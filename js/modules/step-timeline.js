// Module pour la ligne d'étapes interactives
import { storySteps } from './data.js';

// Variables privées du module
let timelineContainer = null;
let currentActiveStep = -1;

// Fonction pour créer la ligne d'étapes
export function createStepTimeline() {
    const minimapContent = document.querySelector('#progress-minimap .minimap-content');
    if (!minimapContent) return;
    
    // Créer l'overlay pour l'assombrissement de la carte
    const overlay = document.createElement('div');
    overlay.className = 'minimap-step-overlay';
    overlay.innerHTML = `
        <div class="minimap-step-name">
            <div class="minimap-step-title"></div>
            <div class="minimap-step-location">
                <i class="fas fa-map-marker-alt"></i>
                <span></span>
            </div>
        </div>
    `;
    
    // Ajouter l'overlay au conteneur de la carte minimap
    const minimapContainer = document.getElementById('minimap-container');
    if (minimapContainer) {
        minimapContainer.appendChild(overlay);
    }
    
    // Créer le conteneur de la timeline
    timelineContainer = document.createElement('div');
    timelineContainer.className = 'minimap-timeline';
    timelineContainer.innerHTML = `
        <div class="timeline-track"></div>
        <div class="timeline-steps"></div>
    `;
    
    // Ajouter à la fin du contenu de la minimap
    minimapContent.appendChild(timelineContainer);
    
    // Créer les points d'étapes
    createTimelineSteps();
}

// Fonction pour créer les points d'étapes
function createTimelineSteps() {
    const stepsContainer = timelineContainer.querySelector('.timeline-steps');
    const track = timelineContainer.querySelector('.timeline-track');
    
    storySteps.forEach((step, index) => {
        // Créer le point d'étape
        const stepPoint = document.createElement('div');
        stepPoint.className = 'timeline-step';
        stepPoint.dataset.stepIndex = index;
        stepPoint.dataset.stepName = step.panelTitle;
        stepPoint.dataset.stepLocation = step.location || '';
        
        // Événements
        stepPoint.addEventListener('mouseenter', showStepOverlay);
        stepPoint.addEventListener('mouseleave', hideStepOverlay);
        stepPoint.addEventListener('click', () => navigateToStep(index));
        
        stepsContainer.appendChild(stepPoint);
    });
}

// Fonction pour afficher l'overlay d'assombrissement
function showStepOverlay(event) {
    const overlay = document.querySelector('.minimap-step-overlay');
    const stepTitle = document.querySelector('.minimap-step-title');
    const stepLocationSpan = document.querySelector('.minimap-step-location span');
    
    if (overlay && stepTitle && stepLocationSpan) {
        const title = event.target.dataset.stepName;
        const location = event.target.dataset.stepLocation;
        
        stepTitle.textContent = title;
        stepLocationSpan.textContent = location;
        overlay.classList.add('show');
    }
}

// Fonction pour masquer l'overlay d'assombrissement
function hideStepOverlay(event) {
    const overlay = document.querySelector('.minimap-step-overlay');
    
    if (overlay) {
        overlay.classList.remove('show');
    }
}

// Fonction pour naviguer vers une étape
function navigateToStep(stepIndex) {
    // Dispatch un événement personnalisé pour la navigation
    const event = new CustomEvent('navigateToStep', {
        detail: { stepIndex }
    });
    document.dispatchEvent(event);
}

// Fonction pour mettre à jour la timeline selon la progression
export function updateStepTimeline(currentStepIndex) {
    if (!timelineContainer) return;
    
    currentActiveStep = currentStepIndex;
    const steps = timelineContainer.querySelectorAll('.timeline-step');
    const track = timelineContainer.querySelector('.timeline-track');
    
    steps.forEach((step, index) => {
        const stepIndex = parseInt(step.dataset.stepIndex);
        
        // Réinitialiser les classes
        step.classList.remove('step-passed', 'step-current', 'step-future');
        
        if (stepIndex < currentStepIndex) {
            // Étapes passées - points pleins blancs
            step.classList.add('step-passed');
        } else if (stepIndex === currentStepIndex) {
            // Étape actuelle - point actif
            step.classList.add('step-current');
        } else {
            // Étapes futures - points vides
            step.classList.add('step-future');
        }
    });
    
    // Mettre à jour la ligne de progression
    const progressPercentage = currentStepIndex <= 0 ? 0 : 
                              (currentStepIndex / (storySteps.length - 1)) * 100;
    
    // Créer ou mettre à jour la ligne de progression
    let progressLine = track.querySelector('.timeline-progress');
    if (!progressLine) {
        progressLine = document.createElement('div');
        progressLine.className = 'timeline-progress';
        track.appendChild(progressLine);
    }
    
    progressLine.style.width = `${progressPercentage}%`;
}

// Fonction pour afficher la timeline (maintenant intégrée, toujours visible avec la minimap)
export function showStepTimeline() {
    // La timeline est maintenant intégrée dans la minimap, pas besoin de gestion séparée
}

// Fonction pour masquer la timeline (maintenant intégrée, masquée avec la minimap)
export function hideStepTimeline() {
    // La timeline est maintenant intégrée dans la minimap, pas besoin de gestion séparée
}

// Fonction d'initialisation
export function initStepTimeline() {
    createStepTimeline();
} 