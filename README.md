# Trendora

Full-stack fashion ecommerce app with a React/Vite frontend and an Express backend.

## Project Structure

- `frontend/` - React, Vite, Tailwind UI
- `backend/` - Express API, auth, orders, admin, uploads, local JSON data

## Run Locally

**Prerequisite:** Node.js

1. Install dependencies from the repo root:
   `npm install`
2. Create backend env file:
   `cp .env.example backend/.env.local`
3. Update values in `backend/.env.local`.
4. Start the full app:
   `npm run dev`

The backend starts the API and serves the frontend through Vite in development.

## Build

From the repo root:

`npm run build`

This builds `frontend/dist` and `backend/dist/server.js`.

## Start Production Build

From the repo root:

`npm start`

## Deploy Full Stack On One Server

This repo is ready for a single web service deployment. The backend serves the built frontend in production.

### Render

1. Push this project to GitHub.
2. Open Render and create a new **Blueprint** from this repository.
3. Render will read `render.yaml`.
4. Add the secret environment variables when Render asks:
   `MONGODB_URI`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `JWT_SECRET`, `GEMINI_API_KEY`, `APP_URL`
5. Set `APP_URL` to the final Render URL after the first deploy, then redeploy once.

Render will run:

- Build command: `npm install && npm run build`
- Start command: `npm start`

### Manual One-Service Settings

If your host does not use `render.yaml`, use these settings:

- Node version: `20.19.0`
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Root directory: project root

## Pre-Deploy Checklist

- Keep real secrets only in `backend/.env.local` locally and in your host's environment variable panel.
- Do not commit `.env.local` or any duplicate `.env*` file with real values.
- Allow your deployment host to access MongoDB Atlas in Network Access.
- Use Razorpay live keys for real payments.
