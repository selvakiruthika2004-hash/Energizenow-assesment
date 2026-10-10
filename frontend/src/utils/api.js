// Dynamic API Base URL
// In development & tunnel mode, relative '/api' routes through Vite's proxy to the Express backend.
// In cloud deployment (e.g., Vercel + Render), VITE_API_BASE_URL can point directly to the cloud backend.
export const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export default API_BASE;
