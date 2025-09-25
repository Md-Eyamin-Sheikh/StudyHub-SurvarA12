# StudyHub - Server Side

## 🎓 Collaborative Study Platform Backend

A robust Node.js backend server for the StudyHub collaborative study platform, providing comprehensive APIs for user management, study sessions, materials, and payment processing.

## 🔗 Live Server URL
```
http://localhost:5000/

https://study-hub-survar-a12.vercel.app/
```

## 👨‍💼 Admin Credentials
- **Username**: admin@gmail.com
- **Password**: "Admin 2004"

## 🚀 Key Features

• **JWT Authentication System** - Secure token-based authentication for all user types
• **MongoDB Integration** - Scalable database solution for user data, sessions, and materials
• **Stripe Payment Processing** - Secure payment handling for session bookings
• **Role-Based Access Control** - Admin, Tutor, and Student role management
• **Session Management APIs** - Complete CRUD operations for study sessions
• **Material Upload System** - File and link management for study materials
• **Admin Dashboard APIs** - Comprehensive admin controls and statistics
• **Email Notification System** - Automated notifications for session updates
• **Real-time Session Status** - Live updates for session approval/rejection
• **Pagination Support** - Efficient data loading for large datasets
• **CORS Configuration** - Cross-origin resource sharing for frontend integration
• **Error Handling Middleware** - Comprehensive error management and logging

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Payment**: Stripe API
- **Environment**: dotenv
- **CORS**: cors middleware

## 📁 Project Structure

```
Study Hub SurvarA12/
├── index.js              # Main server file
├── package.json          # Dependencies and scripts
├── .env                  # Environment variables
└── README.md            # This file
```



## 🔒 Security Features

- JWT token authentication
- Password hashing
- CORS protection
- Environment variable protection
- Input validation
- Error handling middleware

## 📊 Database Collections

- **users** - User profiles and authentication
- **StudyHub** - Study sessions and bookings
- **studyMaterials** - Uploaded study materials
- **bookedSession** - Session booking records

## 🚀 Deployment

The server is configured for deployment on platforms like:
- Heroku
- Vercel
- Railway
- DigitalOcean


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.
