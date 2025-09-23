# Chauffagistes Pool API

API officielle du projet **Chauffagistes Pool**, une pool de minage communautaire Bitcoin avec récupération de chaleur.  
Cette API expose différentes routes permettant de récupérer et mettre à jour les données de la pool.

---

## Prérequis

- [Node.js](https://nodejs.org/) >= 18
- [npm](https://www.npmjs.com/) ou [pnpm](https://pnpm.io/)

---

## Installation

Clonez le dépôt puis installez les dépendances :

```bash
git clone https://github.com/Les-Chauffagistes/chauffagistes-pool-api.git
cd chauffagistes-pool-api
pnpm install   # ou npm install
````

---

## Configuration

L’application utilise des variables d’environnement. Créez un fichier `.env` à la racine avec les paramètres nécessaires :

```ini
PORT=3000
API_KEY=ton_token
```

---

## Démarrage

En développement :

```bash
pnpm run dev
```

En production :

```bash
pnpm run build
pnpm start
```

L’API sera disponible sur `http://localhost:3000`.

---

## Routes disponibles

### Webhooks

* `POST /webhook/main` : réception des données principales de la pool
* `POST /webhook/graph` : mise à jour des graphes

### API publiques

* `GET /api/graph.json` : statistiques de hashrate (JSON)
* `GET /api/monthlyBests` : meilleures shares du mois
* `GET /api/top` : top mineurs

*(ajoutez vos routes spécifiques ici)*

---

## Structure du projet

```
chauffagistes-pool-api/
│── controllers/    # Logique des routes
│── services/       # Fonctions utilitaires, traitement des données
│── routes/         # Définition des endpoints Express
│── middlewares/    # Authentification, rate limiting, etc.
│── config/         # Fichiers de configuration
│── public/         # Fichiers statiques
│── app.js          # Point d’entrée principal
```

---

## Déploiement

Exemple avec [PM2](https://pm2.keymetrics.io/) :

```bash
pm2 start app.js --name chauffagistes-api
pm2 save
pm2 startup
```

