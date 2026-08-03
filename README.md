# 📦 CampusCrate – Lost & Found Portal

CampusCrate is a full-stack web application designed to help students report, search, claim, and recover lost & found items within a college campus. The system provides a secure, user-friendly, and efficient platform where students can easily report missing belongings or submit found items. It also includes an admin dashboard for managing claims and users.

---

# 🎯 Project Objectives

- Simplify the campus lost and found process.
- Provide a centralized platform for reporting lost and found items.
- Ensure secure authentication for users.
- Enable claim verification before returning items.
- Improve communication between students and administrators.

---

# 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React.js, HTML5, CSS3, JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Authentication | Google OAuth, JWT |
| Image Storage | Cloudinary |
| HTTP Client | Axios |
| API Testing | Postman |
| QR Code | QRCode Library |
| Frontend Deployment | Vercel |
| Backend Deployment | Render |
| Version Control | Git & GitHub |

---

# ✨ Key Features

- User Registration & Login
- Google Authentication
- Secure JWT Authentication
- Report Lost Items
- Report Found Items
- Upload Item Images
- Cloudinary Image Storage
- Search Items
- Category-wise Filtering
- View Item Details
- Claim Request System
- Chat Feature
- Mark Item as Returned
- QR Code Portal Access
- Responsive User Interface
- Admin Dashboard
- Approve / Reject Claims
- Block / Unblock Users
- Abuse Report Management

---

# 🧠 Project Mind Map

```text
CampusCrate
│
├── Authentication
│   ├── Register
│   ├── Login
│   └── Google Login
│
├── Lost & Found
│   ├── Report Item
│   ├── Upload Image
│   ├── Search
│   ├── Filter
│   ├── Claim
│   ├── Chat
│   └── Returned Status
│
├── QR Portal
│
├── Admin Dashboard
│   ├── Review Claims
│   ├── Approve Claims
│   ├── Reject Claims
│   ├── Block Users
│   └── Abuse Reports
│
└── Database
    ├── Users
    ├── Items
    └── Claims
```

---

# 🔄 Project Workflow

```text
Start
  │
  ▼
User Registration / Login
  │
  ▼
Dashboard
  │
  ├──────────────┐
  ▼              ▼
Report Item   Browse Items
  │              │
  ▼              ▼
Upload Image  Search & Filter
  │              │
  └──────┬───────┘
         ▼
    Submit Claim
         │
         ▼
Admin Reviews Claim
         │
   ┌─────┴─────┐
   ▼           ▼
Approved   Rejected
   │
   ▼
Item Returned
```

---

# ☁️ System Architecture

```text
             React Frontend
                   │
                   ▼
             Axios API Calls
                   │
                   ▼
          Express.js Backend
           │              │
           ▼              ▼
   MongoDB Atlas      Cloudinary
           │
           ▼
      Admin Dashboard
```

---

# 📂 Project Structure

```text
CampusCrate
│
├── client
│   ├── components
│   ├── pages
│   ├── assets
│   ├── services
│   └── App.jsx
│
├── server
│   ├── config
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── uploads
│   └── server.js
│
├── package.json
└── README.md
```

---

# 🗄️ Database Collections

```text
MongoDB Atlas
│
├── Users
│   ├── Name
│   ├── Email
│   ├── Password
│   ├── Role
│   └── Status
│
├── Items
│   ├── Title
│   ├── Category
│   ├── Description
│   ├── Location
│   ├── Date
│   ├── Image
│   └── Status
│
└── Claims
    ├── User
    ├── Item
    ├── Proof
    ├── Status
    └── Created At
```

---

# ⚙️ Installation

```bash
git clone <repository-name>

cd CampusCrate

npm install

cd server
npm install
npm start

cd ../client
npm install
npm run dev
```

---

# 🚀 Future Enhancements

- AI-based image matching.
- Real-time chat using Socket.io.
- Email notifications.
- Push notifications.
- Mobile application support.
- Advanced analytics dashboard.
- Multi-campus support.

---

# 📌 Conclusion

CampusCrate is a secure and user-friendly Lost & Found Management System developed for educational institutions. The platform streamlines the process of reporting, searching, and claiming lost items through authentication, image uploads, QR access, and an admin verification system. By combining modern web technologies with an intuitive interface, CampusCrate improves transparency, reduces manual effort, and enables faster recovery of lost belongings.
