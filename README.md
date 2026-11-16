# Blood Bank Management System

A starter full-stack college project built with React, PHP, and MySQL.

## Features
- Admin login and logout using PHP sessions
- Dashboard summary cards and blood inventory overview
- Donor create, read, update, and delete
- Blood inventory tracking for all eight blood groups
- Blood request creation, status updates, and deletion
- Responsive red-and-white dashboard UI
- Server-side validation and PDO prepared statements

## Requirements
- PHP 8.1+ with PDO MySQL enabled
- MySQL 8+ (or compatible MariaDB)
- Node.js 18+
- XAMPP / WAMP / MAMP is convenient for PHP and MySQL

## 1. Database setup
1. Start Apache and MySQL in XAMPP.
2. Open `http://localhost/phpmyadmin`.
3. Import `database/schema.sql`.
4. Update the database credentials in `backend/config.php` if needed.

Default database values are `localhost`, database `blood_bank`, user `root`, and an empty password.

## 2. Create the first admin
1. Copy the `backend` folder into your PHP server document root, for example `C:\xampp\htdocs\blood-bank\backend`.
2. Open `backend/install.php` in a browser, e.g. `http://localhost/blood-bank/backend/install.php`.
3. The installer creates the default admin account:
   - Email: `admin@bloodbank.local`
   - Password: `Admin@123`
4. **Delete `install.php` after setup.** Change the default password before using this beyond a local demo.

## 3. Start the PHP API
The API should be reachable at `http://localhost/blood-bank/backend/api.php`.
If your folder path is different, update `VITE_API_URL` in the frontend `.env` file.

## 4. Start React
Open a terminal in the `frontend` folder and run:

```bash
npm install
npm run dev
```

Open the local URL shown by Vite, usually `http://localhost:5173`.

## Important notes
- This is a learning/demo starter, not a production-ready medical system.
- Real blood collection, testing, compatibility, release, and transfusion workflows must be handled by qualified staff and follow applicable regulations.
- Add HTTPS, strong password policy, role-based access, audit logs, backups, CSRF protection, and deployment-specific CORS/session settings before production use.
