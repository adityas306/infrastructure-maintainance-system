# Infrastructure Nobody Reports — MERN Hackathon Project

Problem Statement #3 — The Infrastructure Nobody Reports

Many colleges, hospitals, offices, and local bodies manage hundreds of physical assets such as lights, pumps, toilets, doors, and electrical points. When an asset develops a fault, it is often reported through phone calls, paper registers, or generic complaint systems. This makes it difficult to identify the exact asset, track its complaint history, and maintain proper maintenance records.

The challenge is to build an asset-centric maintenance management system that connects physical infrastructure with digital reporting. Users should be able to report faults for specific assets, technicians should be assigned to resolve those issues, and the system should maintain a complete maintenance history for every asset.

Key Features
QR-based Asset Identification
User/Staff Fault Reporting
GIS/Map-based Asset Location
Technician Assignment
SLA/Issue Tracking
Maintenance History

A complete starter MERN application for asset-centric maintenance:
QR asset identification → fault report → admin assignment → technician update → resolution → maintenance history.

## Stack
- MongoDB + Mongoose
- Express + Node.js
- React + Vite
- JWT authentication
- QR generation with qrcode.react
- QR scanning with html5-qrcode
- Leaflet/OpenStreetMap map

## Run

### Backend
```bash
cd server
npm install
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

Open the Vite URL shown in the terminal.

Default API: http://localhost:5000/api

## Demo accounts
Register users from the UI. To make an admin/technician account, change the `role` field in MongoDB to `admin` or `technician`.

## Main demo
1. Register/login as well as forget password request.
2. Admin: create an asset and copy its QR value.
3. Open the QR page and print/show the QR.
4. Scan the QR using the Report Fault page.
5. Submit a ticket.
6. Admin assigns a technician.
7. Technician changes status to IN_PROGRESS and RESOLVED.
8. Dashboard shows ticket/asset statistics.

This implements the core workflow described in the supplied problem statement: QR asset tags, fault reporting, technician assignment, SLA tracking, GIS/map support, and maintenance history.
