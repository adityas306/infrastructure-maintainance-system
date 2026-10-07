
# InfraCare — Multi-Organisation Infrastructure Maintenance System

InfraCare is now a role-based, multi-organisation infrastructure maintenance system.

## Roles

### Organisation Admin
- Creates an organisation and receives its unique Organisation ID.
- Can add additional admins.
- Can add technicians and users.
- Can assign technicians to tickets.
- Can reassign tickets when a technician refuses.
- Can manage organisation assets and view organisation tickets.

### Technician
- Has one global technician account.
- Can be a member of multiple organisations.
- Selects an organisation at login when multiple memberships exist.
- Can accept or refuse a ticket assignment.
- Can provide a refusal reason.
- Can start/resolve assigned work.

### User
- Creates a user account using an Organisation ID.
- Can report faults only inside their organisation.
- Can view their own tickets.

## Authentication URLs

- `/login/admin`
- `/login/technician`
- `/login/user`

Registration:

- `/register/organization`
- `/register/technician`
- `/register/user`

## Data isolation

Every organisation-scoped asset, ticket and maintenance record stores `organization`.
Every organisation membership is stored in `OrganizationMember`.

A technician can therefore have:

```text
Technician A
  ├── Organisation ABC
  ├── Organisation XYZ
  └── Organisation PQR
```

but tickets and assets are always filtered by the active organisation.

## Technician assignment workflow

```text
OPEN
  ↓
ADMIN ASSIGNS TECHNICIAN
  ↓
ASSIGNED / PENDING
  ├── ACCEPT → IN_PROGRESS → RESOLVED
  └── REFUSE → OPEN → ADMIN REASSIGNS
```

## Environment

Copy `server/.env.example` to `server/.env` and set:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/infrastructure_maintenance
JWT_SECRET=replace_with_a_long_random_secret
ALLOWED_EMAIL_DOMAINS=gmail.com,aktu.ac.in,smslucknow.ac.in,yahoo.com,outlook.com
```

For Vercel, set:

```env
VITE_API_URL=https://your-api-domain/api
```

## Existing database migration

If the previous InfraCare database already contains users/assets/tickets, run once after deploying the new models:

```bash
node scripts/migrateLegacy.js
```

This creates the default `LEGACY-001` organisation and connects existing records to it.

Review the organisation name/ID before running this on production.

## Run locally

### Server

```bash
cd server
npm install
npm run dev
```

### Client

```bash
cd client
npm install
npm run dev
```
