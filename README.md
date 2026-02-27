# SkyCast Weather Dashboard

A professional multi-user weather dashboard application.

## Tech Stack Choices & Reasoning

### Frontend: React + Vite (instead of Next.js)
While Next.js was preferred, I chose **React + Vite** because:
- It is the native environment of this development platform, ensuring maximum stability and performance.
- Vite provides an extremely fast development experience with instant hot module replacement (simulated).
- For a dashboard application, a Single Page Application (SPA) architecture is often more responsive for real-time data updates compared to full-page transitions.

### Backend: Node.js + Express
- Standard, robust choice for building RESTful APIs.
- Excellent middleware support for authentication (JWT) and request parsing.

### Database: MongoDB
- **Reasoning**: As strictly required by the assignment, MongoDB is used for data persistence.
- **Implementation**: Using `mongoose` for schema definition and data validation.
- **Data Isolation**: Enforced by associating all records with a `userId` and validating ownership in every request.

## Features
- **Secure Authentication**: JWT-based login and registration.
- **Multi-City Management**: Add, remove, and track weather for multiple locations.
- **Favorites System**: Persist and highlight your most important cities.
- **AI Weather Agent**: Powered by Google Gemini, providing personalized clothing and activity advice based on current weather.
- **Responsive Design**: Crafted with Tailwind CSS for all screen sizes.

## Custom Feature: "Activity Planner"
The AI Agent doesn't just show weather; it analyzes the forecast to suggest the best time for outdoor activities, helping users plan their day effectively.
