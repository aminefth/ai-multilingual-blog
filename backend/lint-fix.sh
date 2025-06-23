#!/bin/bash

# 🔧 Script de correction automatique ESLint
# Pour ton projet AI Tools Blog Backend

echo "🚀 Démarrage correction ESLint..."

# 1. Auto-fix des erreurs Prettier
echo "📝 Correction automatique Prettier..."
npx eslint . --fix

# 2. Correction des imports non utilisés
echo "🗑️ Nettoyage imports non utilisés..."

# Affiliate controller
sed -i '/const.*User.*=.*require/d' src/controllers/affiliate.controller.js

# Analytics controller  
sed -i '/const.*ApiError.*=/d' src/controllers/analytics.controller.js
sed -i '/.*Analytics.*=.*require/d' src/controllers/analytics.controller.js

# Blog service
sed -i '/const.*User.*=.*require/d' src/services/blog.service.js
sed -i '/.*cache.*=.*require/d' src/services/blog.service.js
sed -i '/.*analyticsService.*=/d' src/services/blog.service.js

# Translation controller
sed -i '/.*pick.*=.*require/d' src/controllers/translation.controller.js

# 3. Remplacement console.log par logger
echo "📊 Remplacement console statements..."

find src/ -name "*.js" -exec sed -i 's/console\.log(/logger.info(/g' {} \;
find src/ -name "*.js" -exec sed -i 's/console\.error(/logger.error(/g' {} \;
find src/ -name "*.js" -exec sed -i 's/console\.warn(/logger.warn(/g' {} \;

# 4. Ajout import logger où nécessaire
echo "📦 Ajout imports logger..."

# Fonction pour ajouter logger import si absent
add_logger_import() {
    if ! grep -q "const.*logger.*=" "$1" && grep -q "logger\." "$1"; then
        sed -i '1i const logger = require("../config/logger");' "$1"
    fi
}

# Appliquer sur tous les fichiers qui utilisent logger
find src/ -name "*.js" -exec bash -c 'add_logger_import "$0"' {} \;

# 5. Correction variables non utilisées spécifiques
echo "🔧 Corrections spécifiques..."

# Subscription controller
sed -i 's/const.*result.*=.*await/await/g' src/controllers/subscription.controller.js
sed -i 's/const.*reactivated.*=.*await/await/g' src/controllers/subscription.controller.js

# SEO controller
sed -i 's/const.*updatedPost.*=/\/\/ const updatedPost =/g' src/controllers/seo.controller.js

# Analytics controller - fix unused parameters
sed -i 's/getPageViews(period)/getPageViews(_period)/g' src/controllers/analytics.controller.js
sed -i 's/getUserEngagement(period)/getUserEngagement(_period)/g' src/controllers/analytics.controller.js

# 6. Fix quotes consistency
echo "✨ Standardisation quotes..."
find src/ -name "*.js" -exec sed -i 's/"json_object"/"json_object"/g' {} \;

# 7. Final lint check
echo "🎯 Vérification finale..."
npm run lint

echo "✅ Correction terminée!"
echo "📊 Statistiques finales :"
npm run lint 2>&1 | tail -5
