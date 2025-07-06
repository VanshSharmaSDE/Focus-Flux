# FocusFlux - Premium To-Do Web App with Analytics

A modern, feature-rich to-do application built with React, Tailwind CSS, and Appwrite. FocusFlux helps you manage tasks efficiently while providing detailed analytics to track your productivity.

## ✨ Features

- **Smart Task Management**: Create, organize, and prioritize tasks with an intuitive interface
- **Advanced Analytics**: Track productivity with detailed charts and insights
- **User Authentication**: Secure OTP-based email authentication via Appwrite
- **Responsive Design**: Beautiful UI that works perfectly on desktop and mobile
- **Real-time Sync**: All data synchronized across devices
- **Priority System**: Organize tasks by priority levels
- **Due Date Tracking**: Never miss deadlines with smart reminders
- **Progress Tracking**: Visual progress indicators and completion rates
- **Data Export**: Export your tasks and analytics

## 🚀 Tech Stack

- **Frontend**: React 19, Tailwind CSS, React Router
- **Backend**: Appwrite (BaaS)
- **Charts**: Chart.js with React Chart.js 2
- **Icons**: Heroicons
- **Notifications**: React Hot Toast
- **Build Tool**: Vite

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FocusFlux
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your Appwrite configuration:
   ```env
   VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   VITE_APPWRITE_PROJECT_ID=your_project_id_here
   VITE_APPWRITE_DATABASE_ID=focusflux_db
   VITE_APPWRITE_TODOS_COLLECTION_ID=todos
   VITE_APPWRITE_USERS_COLLECTION_ID=users
   VITE_APPWRITE_FEEDBACK_COLLECTION_ID=feedback
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🛠️ Appwrite Setup

1. **Create an Appwrite Project**
   - Go to [Appwrite Cloud](https://cloud.appwrite.io)
   - Create a new project
   - Copy the Project ID to your `.env` file

2. **Create Database**
   - Create a database named `focusflux_db`
   - Note the database ID

3. **Create Collections**
   
   **Todos Collection:**
   ```json
   {
     "title": "string",
     "description": "string",
     "priority": "string",
     "dueDate": "datetime",
     "completed": "boolean",
     "completedAt": "datetime",
     "userId": "string",
     "createdAt": "datetime",
     "updatedAt": "datetime"
   }
   ```
   
   **Users Collection:**
   ```json
   {
     "email": "string",
     "name": "string", 
     "bio": "string",
     "location": "string",
     "website": "string",
     "createdAt": "datetime"
   }
   ```
   
   **Feedback Collection:**
   ```json
   {
     "name": "string",
     "email": "string",
     "message": "string",
     "userId": "string",
     "createdAt": "datetime"
   }
   ```

4. **Set Permissions**
   - Configure read/write permissions for authenticated users
   - Set up proper security rules

5. **Enable Authentication**
   - Enable Email/Password authentication
   - Configure OTP settings

## 📁 Project Structure

```
FocusFlux/
├── public/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── PrivateRoute.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   └── dashboard/
│   │       ├── TodoItem.jsx
│   │       ├── TodoModal.jsx
│   │       └── TodoFilters.jsx
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── TodoContext.jsx
│   ├── hooks/
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── About.jsx
│   │   ├── Features.jsx
│   │   ├── Contact.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Dashboard.jsx
│   │   └── dashboard/
│   │       ├── DashboardHome.jsx
│   │       ├── Todos.jsx
│   │       ├── Profile.jsx
│   │       └── Settings.jsx
│   ├── services/
│   │   ├── appwrite.js
│   │   ├── auth.js
│   │   └── todo.js
│   ├── utils/
│   │   ├── dateUtils.js
│   │   └── analytics.js
│   ├── App.jsx
│   └── main.jsx
├── tailwind.config.js
├── vite.config.js
└── package.json
```

## 🎯 Key Features Explained

### Dashboard Analytics
- **Daily/Weekly/Monthly/Yearly** productivity charts
- **Completion rate** tracking
- **Streak counters** for motivation
- **Priority distribution** analysis
- **Productivity insights** and recommendations

### Task Management
- **Create/Edit/Delete** tasks
- **Priority levels** (High, Medium, Low)
- **Due date** tracking with overdue alerts
- **Status filtering** (Pending, Completed)
- **Search functionality**
- **Bulk operations**

### User Experience
- **Responsive design** for all screen sizes
- **Dark/Light theme** support (configurable)
- **Real-time notifications**
- **Smooth animations** and transitions
- **Accessibility** features

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_APPWRITE_ENDPOINT` | Appwrite API endpoint | ✅ |
| `VITE_APPWRITE_PROJECT_ID` | Your Appwrite project ID | ✅ |
| `VITE_APPWRITE_DATABASE_ID` | Database ID | ✅ |
| `VITE_APPWRITE_TODOS_COLLECTION_ID` | Todos collection ID | ✅ |
| `VITE_APPWRITE_USERS_COLLECTION_ID` | Users collection ID | ✅ |
| `VITE_APPWRITE_FEEDBACK_COLLECTION_ID` | Feedback collection ID | ✅ |

## 🚨 Security Notes

- All API calls are secured through Appwrite's authentication
- User data is isolated using Appwrite's permission system
- Sensitive configuration is stored in environment variables
- Input validation on both client and server side

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Built with ❤️ using React, Tailwind CSS, and Appwrite**+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
