# Smart PF Client

Quick start:

1. From `/client`, run `npm install`.
2. Start dev server: `npm start`.

Notifications:
- Click "Enable Notifications" in the dashboard to register push notifications (requires server VAPID keys configured).

Deployment / Socket configuration:

- If you host the frontend separately (e.g. Vercel) and the API on another host (e.g. Render), set the backend URL in Vercel environment variables:

	- `REACT_APP_SERVER_URL=https://your-render-service.example`

	The client will use `REACT_APP_SERVER_URL` to connect the socket. If this variable is not set:

	- In local dev (`localhost:3000`) the client defaults to `http://localhost:5000`.
	- In other cases the client uses the page's origin.

- After changing env vars on Vercel, redeploy the site so the new variable is embedded into the build.
+
+### Remote frontend vs local server
+
+If the frontend is served from Vercel while the server is still running on your laptop, the browser **cannot reach** the local machine. In that case:
+
+1. You must either deploy the server to a public host (Render, Heroku, etc.) or
+2. Expose your local server via a tunneling service (ngrok, localtunnel, etc.) and use that public URL in `REACT_APP_SERVER_URL`.
+
+Without a publicly accessible backend the dashboard will never receive sensor data or socket events, which is why the site appears empty.
+
+For development, run both client and server on `localhost`: start the server on port 5000 and the React app on 3000; the code automatically connects to `http://localhost:5000`.
