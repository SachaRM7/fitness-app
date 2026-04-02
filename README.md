## Fitness App (Next.js)

Cette application stocke désormais les données utilisateur (profil, progression, poids, semaine courante) dans **Firebase Firestore** avec fallback localStorage.

## Démarrage

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Configuration Firebase

1. Créer un projet Firebase.
2. Activer **Cloud Firestore**.
3. Copier `.env.local.example` en `.env.local`.
4. Renseigner les variables :

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Déploiement Vercel

Ajouter les mêmes variables d’environnement dans les settings du projet Vercel (Environment Variables), puis redéployer.
