# Project README

## 1. Setup & Run Locally

This project has separate **backend** and **frontend** directories.

### Backend

```bash
cd backend
npm install
npm run start:dev
```

Create a `.env` file in `/backend` using `.env.example`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Create a `.env` file in `/frontend` using `.env.example`.

---

## 2. Deployed Public URLs

* **Frontend:** [https://email-g03.vercel.app](https://email-g03.vercel.app)
* **Backend:** [https://email-g03-backend.vercel.app](https://email-g03-backend.vercel.app)

---

## 3. Google OAuth Credentials Setup

### Steps to create OAuth credentials

1. Go to **Google Cloud Console** → APIs & Services → Credentials.
2. Create **OAuth Client ID** → Application type: **Web application**.
3. Add **Authorized redirect URIs**, example:

   * `http://localhost:3000/auth/google/callback`
   * `https://email-g03-backend.vercel.app/auth/google/callback`
4. Copy `CLIENT_ID` and `CLIENT_SECRET` into both frontend/backend `.env` files as required.

---

## 5. Token Storage Choices & Security Considerations

### Why **HTTP-only cookies** were used

* Much **safer** than localStorage.
* Cookies cannot be accessed via JavaScript → **protected from XSS**.
* Ideal for storing **access tokens** or **session identifiers**.
* Allows backend to fully control authentication.

### Security considerations

* Use **Secure**, **HttpOnly**, and **SameSite=strict** cookies.
* Refresh tokens should be stored only in cookies — never in frontend storage.
* Access tokens should be short-lived.
* Consider server-side session revocation or token rotation.

---

## 6. How Token Expiry Was Simulated

For demo/testing:

* The **access token cookie** was manually cleared in the browser to simulate expiry.
* When the access token is missing, the frontend automatically triggers a **refresh token** request to the backend.
* The backend validates the refresh token (stored in **HttpOnly cookie**) and issues a **new access token**.

### How to demo token refresh

#### In Chrome DevTools

1. Open **DevTools → Application → Cookies**.
2. Locate the cookie named (example): `access_token`.
3. **Delete** this cookie manually.
4. Perform an action that requires authentication.
5. The app will:

   * Detect missing/expired access token
   * Call backend endpoint: `/token/refresh`
   * Receive a new access token
   * Continue normally

---

## 7. Third-party Services Used. Third-party Services Used

* **Google OAuth** – authentication
* **Vercel** – frontend and backend deployment

---