# Developer 1: Front Door — Registration & Login

This part handles the first stage of the Secure MFA System:

- User registration
- Login with username and password
- bcrypt password hashing
- SQL queries for `Users` and `Credentials`
- Frontend registration and login pages

## Project Structure

```text
front-door-auth/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── register.html
│   ├── login.html
│   └── style.css
└── database/
    └── front_door.sql
```

## Backend Routes

### POST `/register`
Creates a new user and stores the bcrypt password hash in the `Credentials` table.

### POST `/login`
Checks username and password. If the password is correct, the user can continue to MFA setup or MFA verification.

## How to Run

```bash
cd backend
npm install
cp .env.example .env
npm start
```

Then open:

```text
frontend/register.html
frontend/login.html
```
