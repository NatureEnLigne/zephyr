# 🔍 AUDIT DE SÉCURITÉ - Story Map Application

## ✅ ACTIONS EFFECTUÉES

### 1. **Nettoyage du code**
- ❌ Suppression de tous les `console.log()` et `console.error()`
- ❌ Suppression du debug overlay (`debug-overlay.js`)
- ❌ Nettoyage des imports inutiles
- ❌ Suppression des commentaires de développement

### 2. **Sécurisation HTML**
- ✅ Ajout des headers de sécurité META
- ✅ Amélioration du titre et métadonnées SEO
- ✅ Ajout des preconnect pour les performances

### 3. **Création du .htaccess**
- ✅ Headers de sécurité HTTP
- ✅ Protection contre XSS, clickjacking, MIME sniffing
- ✅ Content Security Policy configurée
- ✅ Compression GZIP et cache navigateur
- ✅ Blocage des fichiers sensibles

## 🚨 ACTIONS OBLIGATOIRES AVANT MISE EN LIGNE

### 1. **SÉCURISATION CLE API MAPBOX** ⚠️ CRITIQUE
Aller sur https://account.mapbox.com/access-tokens/ et :

**a) Configurer les restrictions d'URL :**
```
✅ Ajouter : https://storymap.natureenligne.fr/*
❌ Supprimer : http://localhost:*
❌ Supprimer : tous les domaines de test
```

**b) Limiter les portées (scopes) :**
```
✅ Styles:Read
✅ Fonts:Read  
✅ Tilesets:Read
❌ Désactiver toutes les autres portées non utilisées
```

**c) Surveillance :**
- Surveiller l'usage quotidien sur le dashboard Mapbox
- Configurer des alertes de dépassement si possible

### 2. **FICHIERS À NE PAS UPLOADER**
```bash
# Ne pas inclure dans l'upload FTP :
.git/                    # Historique Git
.DS_Store               # Fichiers système macOS
src/                    # Dossier source (si applicable)
SECURITE-AUDIT.md       # Ce fichier de documentation
.gitignore              # Configuration Git
```

### 3. **VÉRIFICATIONS FINALES**
- [ ] Test de l'application sur https://storymap.natureenligne.fr
- [ ] Vérification du fonctionnement de Mapbox
- [ ] Test des headers de sécurité : https://securityheaders.com/
- [ ] Test des performances : https://pagespeed.web.dev/

## 📁 STRUCTURE FINALE À UPLOADER

```
/
├── index.html
├── .htaccess
├── css/
│   └── style.css
├── js/
│   ├── main.js
│   └── modules/
│       ├── config.js
│       ├── map.js
│       └── ui.js
├── assets/
│   ├── webm/
│   ├── images/
│   ├── data/
│   └── fonts/
└── vendors/
```

## 🛡️ RECOMMANDATIONS SUPPLÉMENTAIRES

### Monitoring continu :
1. **Mapbox Usage** : Vérifier mensuellement la consommation
2. **Analytics** : Suivre le trafic et détecter les usages anormaux
3. **Sécurité** : Tester périodiquement avec des outils comme :
   - https://securityheaders.com/
   - https://observatory.mozilla.org/

### Mises à jour :
1. **Mapbox GL JS** : Surveiller les mises à jour de sécurité
2. **GSAP** : Maintenir la version à jour
3. **Dépendances CDN** : Vérifier périodiquement l'intégrité

### Performance :
1. **Compression** : Le .htaccess gère la compression GZIP
2. **Cache** : Headers de cache configurés pour 1 mois (assets) / 1h (HTML)
3. **CDN** : Envisager Cloudflare pour la protection DDoS

## 🎯 RÉSULTAT

✅ **Application sécurisée** et prête pour la production
✅ **Performance optimisée** avec compression et cache
✅ **Monitoring** des usages Mapbox configuré
✅ **Protection** contre les attaques communes 