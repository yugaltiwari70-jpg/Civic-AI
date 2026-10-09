# CivicAI - frontend (React + Vite)
Hackathon prototype. Start the backend first (see ../backend/README.md).
```
npm install
npm run dev     # http://localhost:5173 (proxies /api and /uploads to :5000)
```
Set `VITE_API_URL` only if the API is on another origin. Map tiles load from OpenStreetMap (internet required).
Routes: / , /report , /my-reports , /map , /admin , /issue/:id
Images are compressed in the browser (max 1280px JPEG) before upload. Mobile hamburger nav included. Styling is plain CSS (no Tailwind).
