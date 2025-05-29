# 🚗 Car Rental Backend API

This is a backend system for a car rental application with **user authentication**, **admin and user roles**, **email verification**, and **protected routes**. Built using **Node.js**, **Express.js**, **MySQL**, and **JWT**.

---

## 📆 Tech Stack

* Node.js
* Express.js
* MySQL (via XAMPP)
* JWT for authentication
* bcrypt for password hashing
* dotenv for environment variables
* nodemailer for email sending

---

## 📁 Project Structure

```
car-rental-backend/
│
├── config/
│   └── db.js               # MySQL database connection
│
├── controllers/
│   └── authController.js   # Auth logic (signup, login, verification)
│
├── models/
│   └── userModel.js        # User DB queries
│
├── routes/
│   ├── authRoutes.js       # /api/auth routes
│   └── testRoutes.js       # /api/test routes (protected)
│
├── utils/
│   ├── authMiddleware.js   # JWT middleware
│   └── mailer.js           # Nodemailer utility for sending verification emails
│
├── .env                    # Environment config
├── server.js               # App entry point
└── README.md               # Project documentation
```

---

## 🔧 Setup Instructions

### 1. Clone the Project

```bash
git clone https://github.com/AmitNaik01/car-rental-backend.git
cd car-rental-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=car_rental
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
```

### 4. Start MySQL via XAMPP

* Start Apache & MySQL
* Open phpMyAdmin
* Create a new database: `car_rental`

### 5. Start the Server

```bash
nodemon server.js
```

You should see:

```bash
🚀 Server running on port 5000
✅ Connected to MySQL Database
```

---

## 📄 API Documentation

### 🔐 Authentication Routes

#### `POST /api/auth/signup`

Registers a new user or admin and sends a verification code to email.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "123456",
  "role": "admin"
}
```

**Response:**

```json
{
  "message": "User registered. Please check your email for the verification code."
}
```

#### `POST /api/auth/verify-email`

Verifies user's email using the received code.

**Request Body:**

```json
{
  "email": "john@example.com",
  "code": "123456"
}
```

**Response:**

```json
{
  "message": "Email verified successfully"
}
```

#### `POST /api/auth/login`

Logs in a verified user and returns a JWT token.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "123456"
}
```

**Response:**

```json
{
  "message": "Login successful",
  "token": "your.jwt.token"
}
```

If user is not verified:

```json
{
  "message": "Please verify your email first"
}
```

Use this token in protected routes:

```
Authorization: Bearer your.jwt.token
```

#### `POST /api/auth/forgot-password`

Sends a reset token to the user's email.

**Request Body:**

```json
{
  "email": "john@example.com"
}
```

**Response:**

```json
{
  "message": "Password reset link has been sent to your email."
}
```

#### `POST /api/auth/reset-password`

Resets the password using the token.

**Request Body:**

```json
{
  "email": "john@example.com",
  "token": "resetToken",
  "newPassword": "new123456"
}
```

**Response:**

```json
{
  "message": "Password has been reset successfully."
}
```

---

## 🔒 Protected Routes

### `GET /api/test/admin`

Access only for users with admin role.

**Headers:**

```
Authorization: Bearer <your_token_here>
```

**Response (if token valid and user is admin):**

```json
{
  "message": "Welcome Admin"
}
```

**Unauthorized Response:**

```json
{
  "message": "Unauthorized: Admins only"
}
```

---

## ✅ Sample Usage with Postman

### 1. Signup User or Admin

**Method:** POST
**URL:** `http://localhost:5000/api/auth/signup`

**Body (JSON):**

```json
{
  "name": "Admin",
  "email": "admin@example.com",
  "password": "admin123",
  "role": "admin"
}
```

### 2. Verify Email Code

**Method:** POST
**URL:** `http://localhost:5000/api/auth/verify-email`

**Body (JSON):**

```json
{
  "email": "admin@example.com",
  "code": "123456"
}
```

### 3. Login

**Method:** POST
**URL:** `http://localhost:5000/api/auth/login`

**Body (JSON):**

```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

Copy the token from the response.

### 4. Forgot Password

**Method:** POST
**URL:** `http://localhost:5000/api/auth/forgot-password`

**Body (JSON):**

```json
{
  "email": "admin@example.com"
}
```

### 5. Reset Password

**Method:** POST
**URL:** `http://localhost:5000/api/auth/reset-password`

**Body (JSON):**

```json
{
  "code":"585455",
  "newPassword": "newAdmin123"
}
```

### 6. Access Protected Route

**Method:** GET
**URL:** `http://localhost:5000/api/test/admin`

**Headers:**

```
Authorization: Bearer <your_token_here>
```

---

## 🧑‍💻 Author

Developed by Amit Naik
For any queries, feel free to contact.

---

## 📃 License

This project is licensed under the MIT License.
