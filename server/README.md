# Smart PF Server

Backend for Smart Power Factor Monitoring and Correction System.

Quick start:

1. Copy `.env.example` to `.env` and set `MONGO_URI`, `JWT_SECRET`, and VAPID keys.
2. Install dependencies: `npm install` in `/server`.
3. Run dev: `npm run dev`.

Notes:
- Generate VAPID keys for push and set `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`. You can generate keys with `npx web-push generate-vapid-keys`.
- The server exposes `/api/vapid-public` to allow the client to subscribe.
- Scheduler runs AI insight job hourly and daily summary at 00:05 server time.
