// Module de gestion des animations de titre

// Fonction pour créer les éléments de titre animés
function createAnimatedTitle() {
    const titleElement = document.getElementById('app-title');
    const line1 = document.getElementById('title-line-1');
    
    // Texte du titre complet sur une ligne
    const titleText = 'Zéphyr et l\'appel du poisson';
    
    // Fonction pour créer les lettres animées
    function createLettersForLine(text, container) {
        container.innerHTML = '';
        const letters = [];
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === ' ') {
                const space = document.createElement('span');
                space.className = 'title-space';
                container.appendChild(space);
            } else {
                const letter = document.createElement('span');
                letter.className = 'title-letter';
                letter.textContent = char;
                container.appendChild(letter);
                letters.push(letter);
            }
        }
        return letters;
    }
    
    // Créer les lettres pour le titre complet
    const letters = createLettersForLine(titleText, line1);
    
    return { titleElement, letters };
}

// Fonction pour animer l'apparition du titre
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

// Fonction pour animer la disparition du titre
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

// Exports publics
export {
    createAnimatedTitle,
    animateTitle,
    hideAnimatedTitle
}; 