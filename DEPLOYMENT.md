# Deploying WalkieTalkie Vite Client to Vercel

This guide provides step-by-step instructions to deploy the Vite + React frontend client to **Vercel**.

---

## 🚀 Option 1: Vercel Dashboard (Recommended)

1. Push your repository to **GitHub**, **GitLab**, or **Bitbucket**.
2. Log in to your [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** -> **Project**.
3. Import your WalkieTalkie repository.
4. In the Project Configuration screen:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand **Environment Variables** and add:

| Key | Value | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Your Render.com backend server URL | `https://walkietalkie-server.onrender.com` |

6. Click **Deploy**.

Vercel will build your Vite React client, optimize assets for global CDN distribution, and assign a production URL (e.g. `https://walkietalkie.vercel.app`).

---

## 💻 Option 2: Vercel CLI Deployment

1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Navigate into the `client/` directory:
   ```bash
   cd client
   ```

3. Deploy to production:
   ```bash
   vercel --prod
   ```

4. Set environment variable via CLI:
   ```bash
   vercel env add VITE_API_URL production
   ```
