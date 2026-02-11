# RestoConnect-React

RestoConnect is a full-stack restaurant management and ordering platform with a React (Vite) frontend and an Express/MongoDB backend.

## Prerequisites

- Node.js 18+ and npm
- MongoDB running locally

## Project Structure

- Backend/ - Express API + EJS views
- Frontend/ - React (Vite) client

## Installation

### Backend

1. Open a terminal in Backend/
2. Install dependencies:
	npm install

### Frontend

1. Open a terminal in Frontend/
2. Install dependencies:
	npm install

## Database

The backend connects to a local MongoDB instance at:

mongodb://127.0.0.1:27017/test

Make sure MongoDB is running before starting the server.

## Running the App (Development)

### Start Backend

From Backend/:

npm start

The API will run at http://localhost:3000

### Start Frontend

From Frontend/:

npm run dev

The app will run at http://localhost:5173

## Optional: Seed Data

If you want to seed the database:

1. Open a terminal in Backend/seeds/
2. Run:
	node seedData.js

## Notes

- The frontend expects the backend to be available at http://localhost:3000.
- If you change ports, update CORS settings in Backend/server.js and any frontend API calls.
