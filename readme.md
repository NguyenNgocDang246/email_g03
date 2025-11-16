# Project README

## Setup

This project has separate **backend** and **frontend** directories. Follow these steps to set up the project:

1. **Backend**

```bash
cd backend
npm i
```

- Create a `.env` file in the backend directory using the example:

```
JWT_SECRET="your-secret-key"
MONGO_URI="mongodb://localhost:27017/your-database-name"
```

_(You can copy from `.env.example` if available.)_

2. **Frontend**

```bash
cd frontend
npm i
```

## Running the Project

1. **Backend**

```bash
cd backend
npm run start:dev
```

2. **Frontend**

```bash
cd frontend
npm run dev
```

## Accessing the Project

- Once both backend and frontend are running, open your browser and access the frontend at:

```
http://localhost:5173
```

- Backend APIs will be available at:

```
http://localhost:3000
```
