# Leo Portfolio Backend

This backend receives contact form submissions and saves them in `data/submissions.json`.

## Run Locally

```bash
npm start
```

Then open:

```text
http://localhost:3000
```

## View Submitted Messages

The admin token is read from `ADMIN_TOKEN`. If you do not set one, the local default is `change-this-token`.

```bash
ADMIN_TOKEN=my-secret-token npm start
```

Open:

```text
http://localhost:3000/api/submissions?token=my-secret-token
```

## Important For GitHub Pages

GitHub Pages only hosts static files. It cannot run this backend by itself.

To collect messages from the live GitHub Pages site, deploy `server.js` to a backend host such as Render, Railway, Fly.io, or a VPS. Then set this in `script.js`:

```js
const CONTACT_API_URL = "https://your-backend-domain.com/api/contact";
```

For local testing, keep it as:

```js
const CONTACT_API_URL = "/api/contact";
```
