// Module des fonctions utilitaires

// Fonction pour formater le texte avec les ** en gras
function formatBoldText(text) {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

// Fonction pour appliquer un style cohérent aux boutons
function applyButtonStyle(button, isFixedPositioned = true) {
    button.style.padding = '10px 15px';
    button.style.fontSize = '0.9rem';
    button.style.border = '1px solid var(--border-color-alpha)';
    button.style.borderRadius = '5px';
    button.style.boxSizing = 'border-box';
    button.style.backgroundColor = 'var(--input-bg-alpha)';
    button.style.color = 'var(--text-color-light)';
    button.style.outline = 'none';
    button.style.cursor = 'pointer';
    button.style.fontFamily = '\'Rubik\', sans-serif';
    button.style.fontWeight = '600';
    button.style.transition = 'background-color 0.3s ease';
    if (isFixedPositioned) {
        button.style.position = 'fixed';
        button.style.zIndex = '1001';
        button.style.margin = '0 5px';
    } else {
        button.style.margin = '10px 5px 0 5px';
    }
    button.onmouseover = () => button.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    button.onmouseout = () => button.style.backgroundColor = 'var(--input-bg-alpha)';
}

// Exports publics
export {
    formatBoldText,
    applyButtonStyle
}; 