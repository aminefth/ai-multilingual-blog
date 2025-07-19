# Architecture de Tests Backend

Cette documentation décrit l'architecture de tests backend utilisée dans notre application de blog multilingue AI.

## Structure des tests

Notre architecture de tests suit une approche en pyramide avec trois niveaux :

### 1. Tests unitaires

- Testent des fonctions/méthodes isolées
- Utilisent des mocks pour toutes les dépendances
- Rapides à exécuter
- Localisés dans `/tests/unit/`

### 2. Tests d'intégration

- Testent l'interaction entre plusieurs composants
- Utilisent des bases de données et services externes réels ou conteneurisés
- Vérifient que les composants fonctionnent ensemble
- Localisés dans `/tests/integration/`

### 3. Tests end-to-end (E2E)

- Testent le système dans son ensemble
- Simulent le comportement utilisateur réel
- Utilisent tous les services externes (ou leurs versions test)
- Localisés dans `/tests/e2e/`

## Configuration des tests

### Variables d'environnement

- Fichier principal : `tests/config/test.env`
- Séparation des secrets : utilisation de `.env.test.local` pour les secrets (non commité)

### Base de données

- MongoDB conteneurisé pour les tests d'intégration/E2E
- Nettoyage automatique entre les suites de test
- Configuration via `setupTestDB.js`

### Mocks

- Services externes mockés dans `tests/utils/mockServices.js`
- Fixtures et factories pour générer des données de test consistantes

## Bonnes pratiques

1. **Isolation des tests** : chaque test doit être indépendant
2. **Performance** : utiliser des mocks pour les tests unitaires, réserver les services réels pour l'intégration/E2E
3. **Reproductibilité** : utiliser des seeds/fixtures pour garantir la cohérence des données
4. **CI/CD** : exécution automatique de tous les tests sur les pull requests et avant le déploiement

## Exécution des tests

```bash
# Tests unitaires uniquement
npm run test:unit

# Tests d'intégration uniquement
npm run test:integration

# Tests E2E uniquement
npm run test:e2e

# Tous les tests avec couverture
npm run test:coverage

# Exécution dans Docker (isolation complète)
npm run test:docker
```

## Rapports et métriques

- Couverture de code générée dans `/coverage/`
- Seuils minimaux de couverture:
  - Fonctions: 80%
  - Branches: 75%
  - Lignes: 80%
- Intégration avec SonarQube pour analyse de qualité
