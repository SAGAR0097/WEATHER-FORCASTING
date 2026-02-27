# SkyCast - Professional Weather Intelligence Dashboard
SkyCast is a high-performance, full-stack weather intelligence application designed for users who need precise, localized, and actionable weather data. Built with a modern tech stack and powered by Gemini AI, it goes beyond simple temperature readings to provide meaningful insights.

##Project Overview
SkyCast allows users to manage a personalized dashboard of global cities. It features real-time weather data fetching, a secure authentication system, and an AI agent that interprets meteorological data into human-friendly advice.

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Motion (for animations), Lucide React (icons).
- **Backend**: Node.js, Express.
- **Database**: MongoDB (via Mongoose) for persistent user data and city preferences.
- **AI**: Google Gemini API (`gemini-3-flash-preview`) for weather interpretation.
- **Weather Data**: Open-Meteo API (High-resolution meteorological models).
- **Authentication**: JWT (JSON Web Tokens) with Bcrypt password hashing.

### **Justification**
- **Vite/React**: Chosen for lightning-fast development and a responsive UI.
- **MongoDB**: Ideal for storing flexible user-specific city lists and preferences.
- **Gemini AI**: Provides superior natural language processing for generating localized weather insights.

##  Setup Instructions
### **Local Setup**
1. **Clone the repository**.
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Create a `.env` file in the root:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secure_random_string
   GEMINI_API_KEY=your_google_gemini_api_key
   ```
4. **Start the development server**:
   ```bash
   npm run dev
   ```

### **Deployment**
- The application is configured for deployment on platforms like Google Cloud Run or Heroku.
- Ensure all environment variables are set in the production environment.
- The build command is `npm run build`, which generates static assets in the `dist/` folder served by the Express backend.

## High-Level Architecture
SkyCast follows a classic **Client-Server architecture**:
- **Client**: A React SPA that handles state management (cities, units, auth) and UI rendering.
- **Server**: An Express API that manages authentication, database operations (CRUD for cities), and proxies weather requests.
- **Data Flow**: User searches for a city -> Frontend sends coordinates to Server -> Server stores city in MongoDB -> Frontend fetches weather data from Open-Meteo -> Frontend sends weather data to Gemini API for insights.

##Authentication & Authorization
- **Approach**: Stateless JWT-based authentication.
- **Registration**: Passwords are hashed using Bcrypt before storage.
- **Session**: Upon login, a JWT is issued and stored in the client's state/local storage.
- **Protection**: All city-related API routes are protected by an `authenticateToken` middleware that verifies the JWT.

## AI Agent Design & Purpose
- **Purpose**: To bridge the gap between raw data (numbers) and human action.
- **Design**: The agent receives current temperature, humidity, wind speed, and weather codes. It then generates a concise (under 20 words) recommendation.
- **Example**: Instead of just "80% humidity," the agent might say, *"High humidity detected; stay hydrated and prefer indoor activities."*

## Creative/Custom Features
1. **Live Pulse Indicator**: A real-time visual cue (pulsing green dot) that confirms the data source is active and providing live updates.
2. **Smart Duplicate Prevention**: The system intelligently recognizes if a user tries to add a city they already have, refreshing the existing data instead of creating clutter.
3. **Unit Intelligence Toggle**: A global state-driven toggle that instantly converts all dashboard metrics between Metric (°C) and Imperial (°F) without page reloads.

## Key Design Decisions & Trade-offs
- **Technical Dashboard Aesthetic**: We chose a "Mission Control" vibe (Recipe 1) to emphasize precision and professionalism.
- **Client-Side Weather Fetching**: Weather data is fetched directly from the client to reduce server load and latency, while city management is handled server-side for persistence.
- **Trade-off**: We prioritized UI responsiveness over complex server-side rendering (SSR) to ensure the "Live" feel of the weather data.

##Known Limitations
- **API Rate Limits**: The free tier of Open-Meteo and Gemini API may have rate limits for high-frequency requests.
- **Geocoding**: City search relies on the accuracy of the underlying geocoding service.
