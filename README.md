# TDP Narasaraopet MLA Website

Production React + Firebase + Express application for Dr. Chadalavada Aravinda Babu, MLA of Narasaraopet.

## Setup

1. `cd client && npm install`
2. Copy `client/.env.example` to `client/.env.local`
3. `npm run dev`
4. `cd ../server && npm install`
5. Copy `server/.env.example` to `server/.env` and add Firebase service account values
6. `npm run dev`

Frontend runs on `http://localhost:5173`. Backend runs on `http://localhost:3001`.

## Firebase

Enable Firestore and Email/Password Authentication in Firebase Console. Create the admin user manually in Firebase Auth. Apply `firestore.rules` from the repo root.

Seed initial content from the client folder:

```bash
npm run seed
```

## Admin

Admin is intentionally not linked publicly. Open `/admin/login` directly and sign in with the Firebase Auth admin account.

The admin dashboard manages hero sections, home slides, daily work, achievements, news, gallery, schemes, towns, festival banners, chatbot knowledge, analytics, and site settings.

## Deployment

Frontend: deploy `client` to Vercel and set the `VITE_*` environment variables.

Backend: deploy `server` to Render, set `npm start` as the start command, and configure the Firebase service account plus `IMGBB_API_KEY`.

## Notes

Images upload through ImgBB. Public visitors do not log in. Festival banners show once per browser session. Chatbot answers come from static knowledge plus Firestore knowledge only, with no external AI API.
