# ProjectPulse – Client Feedback & Project Health Tracker

A comprehensive full-stack application for tracking project health, managing client feedback, employee check-ins, and risk management. Built as an intern assignment project following real-world IT company internal software standards.

## 📄 Additional Documentation

- **[CLIENT_CREDENTIALS.md](./CLIENT_CREDENTIALS.md)** - Complete list of all client login credentials
- **[EMPLOYEE_CREDENTIALS.md](./EMPLOYEE_CREDENTIALS.md)** - Complete list of all employee login credentials with job positions

## 🚀 Features

### Role-Based Access Control
- **ADMIN**: Full system access, project management, monitoring
- **EMPLOYEE**: Submit weekly check-ins, create risks, view assigned projects
- **CLIENT**: Submit weekly feedback, view project health, flag issues

### Core Features
1. **Authentication System** - JWT-based secure authentication
2. **Project Management** - Create, edit, assign projects with health tracking
3. **Weekly Check-in System** - Employee progress tracking (one per week per project)
4. **Client Feedback System** - Weekly satisfaction and communication ratings
5. **Risk Management** - Track and mitigate project risks
6. **Health Score Calculation** - Automatic project health scoring (0-100)
7. **Activity Timeline** - Real-time activity tracking
8. **Role-Based Dashboards** - Customized views for each role
9. **Responsive UI** - Fully responsive with Tailwind CSS
10. **Animations** - Smooth Framer Motion animations

## 📁 Project Structure

```
ProjectPulse/
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   ├── components/       # React components
│   │   ├── context/          # React context (Auth)
│   │   └── lib/              # Utilities (API, auth)
│   ├── package.json
│   └── ...
└── backend/
    ├── src/
    │   ├── models/           # MongoDB schemas
    │   ├── routes/           # API routes
    │   ├── middleware/       # Auth middleware
    │   ├── utils/            # Utilities (JWT, health score)
    │   ├── scripts/          # Seed scripts
    │   └── server.js         # Express server
    ├── package.json
    └── ...
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion** (animations)
- **Axios** (API calls)
- **JWT Decode** (token handling)
- **Lucide React** (icons)

### Backend
**Backend Choice: Express.js (Node.js REST API)**

This project uses **Express.js** as the backend framework, built on Node.js to create a RESTful API server. The choice of Express.js was made for the following reasons:

- **Mature and Stable**: Express.js is the most widely used Node.js web framework
- **RESTful API Design**: Perfect for building clean REST APIs
- **Middleware Support**: Excellent middleware ecosystem (CORS, authentication, validation)
- **MongoDB Integration**: Seamless integration with Mongoose for MongoDB
- **Lightweight and Fast**: Minimal overhead, perfect for API servers
- **Large Community**: Extensive documentation and community support

**Backend Technologies:**
- **Node.js** - Runtime environment
- **Express.js** - Web framework (REST API)
- **MongoDB** (Mongoose) - Database ODM
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **express-validator** - Request validation
- **CORS** - Cross-origin resource sharing

### Database
- **MongoDB Atlas** (Cloud-hosted MongoDB)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### Installation

#### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
MONGODB_URI=mongodb+srv://asif_mahamud_shaon:asif_mahamud_shaon200@cluster0.bdborqr.mongodb.net/projectpulse?appName=Cluster0
JWT_SECRET=your_super_secret_jwt_key_change_in_production
PORT=5000
```

#### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Running the Application

#### Start Backend

```bash
cd backend
npm run dev
```

Backend will run on `http://localhost:5000`

#### Start Frontend

```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:3000`

### Seed Database

To create initial users, run:

```bash
cd backend
npm run seed
```

This creates:
- **1 Admin**
- **10 Employees**
- **15 Clients**

#### Login Credentials

**🔴 ADMIN (1 user):**
- Email: `admin@projectpulse.com`
- Password: `admin123`

**🟢 EMPLOYEES (10 users):**
- Email format: `first_letter.first_name@projectpulse.com`
- Password: `employee123` (same for all)

**Examples:**
- John Doe → `j.doe@projectpulse.com` / `employee123`
- Jane Smith → `j.smith@projectpulse.com` / `employee123`
- Mike Johnson → `m.johnson@projectpulse.com` / `employee123`
- Shamim Hossein → `s.hossein@projectpulse.com` / `employee123`

**🔵 CLIENTS (15 users):**
- Email format: `company_name@projectpulse.com` (lowercase, spaces replaced with dots)
- Password: `client123` (same for all)

**Examples:**
- Acme Corporation → `acme.corporation@projectpulse.com` / `client123`
- Tech Solutions Inc → `tech.solutions.inc@projectpulse.com` / `client123`
- Global Industries Ltd → `global.industries.ltd@projectpulse.com` / `client123`

## 📊 Project Health Score Calculation

The health score (0-100) is automatically calculated based on:

1. **Recent Client Satisfaction** (30% weight)
   - Average of last 4 weeks' satisfaction ratings

2. **Recent Employee Confidence** (20% weight)
   - Average of last 4 weeks' confidence levels

3. **Project Progress vs Timeline** (20% weight)
   - Comparison of estimated completion vs expected progress

4. **Open Risks** (15% weight)
   - Each open risk reduces score by 5 points (max 15)

5. **High Severity Risks** (10% weight)
   - Each high risk reduces score by 10 points (max 10)

6. **Flagged Client Issues** (5% weight)
   - Each flagged issue reduces score by 5 points (max 5)

### Health Status
- **80-100**: On Track (Green)
- **60-79**: At Risk (Yellow)
- **< 60**: Critical (Red)

## 🔐 Authentication & Authorization

- **No Public Registration** - All users created via seed script
- **JWT Tokens** - 7-day expiration
- **Role-Based Routes** - Protected on both frontend and backend
- **Middleware Protection** - All API routes protected

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - Get all/assigned projects
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create project (Admin)
- `PUT /api/projects/:id` - Update project (Admin)
- `DELETE /api/projects/:id` - Delete project (Admin)

### Check-ins
- `GET /api/checkins` - Get check-ins
- `GET /api/checkins/project/:projectId` - Get project check-ins
- `POST /api/checkins` - Submit weekly check-in (Employee)

### Feedback
- `GET /api/feedback` - Get feedback
- `GET /api/feedback/project/:projectId` - Get project feedback
- `POST /api/feedback` - Submit weekly feedback (Client)

### Risks
- `GET /api/risks` - Get risks
- `GET /api/risks/project/:projectId` - Get project risks
- `POST /api/risks` - Create risk (Employee)
- `PUT /api/risks/:id` - Update risk
- `DELETE /api/risks/:id` - Delete risk

### Activity
- `GET /api/activity` - Get activity timeline (Admin)

### Users
- `GET /api/users` - Get all users (Admin)

## 🎨 UI Features

- **Responsive Design** - Works on all devices
- **Smooth Animations** - Framer Motion page transitions
- **Loading States** - Proper loading indicators
- **Error Handling** - User-friendly error messages
- **Empty States** - Helpful empty state messages
- **Modal Forms** - Clean modal interfaces
- **Color-Coded Status** - Visual health indicators

## 📱 Role Responsibilities

### ADMIN
- Create and manage projects
- Assign clients and employees
- Monitor all projects' health scores
- View all risks across projects
- Track activity timeline
- Identify high-risk projects
- View missing check-ins

**Login:** `admin@projectpulse.com` / `admin123`

### EMPLOYEE
- View assigned projects
- Submit weekly check-ins (one per week per project)
- Create and manage risks
- View own check-ins and risks
- Track project health

**Login:** `employee1@projectpulse.com` to `employee10@projectpulse.com` / `employee123`

### CLIENT
- View assigned projects
- Submit weekly feedback (one per week per project)
- Rate satisfaction and communication
- Flag issues
- View project health status

**Login:** `client1@projectpulse.com` to `client15@projectpulse.com` / `client123`

## 🚢 Deployment

### Frontend (Vercel)
1. Connect GitHub repository
2. Set environment variable: `NEXT_PUBLIC_API_URL`
3. Deploy

### Backend (Render/Railway)
1. Connect GitHub repository
2. Set environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `PORT`
3. Deploy

### Database
- MongoDB Atlas (already configured)

## 📋 Complete Login Credentials List

### 🔴 ADMIN (1 user)
| Email | Password |
|-------|----------|
| admin@projectpulse.com | admin123 |

### 🟢 EMPLOYEES (10 users)
| # | Name | Email | Password |
|---|------|-------|----------|
| 1 | John Doe | j.doe@projectpulse.com | employee123 |
| 2 | Jane Smith | j.smith@projectpulse.com | employee123 |
| 3 | Mike Johnson | m.johnson@projectpulse.com | employee123 |
| 4 | Sarah Williams | s.williams@projectpulse.com | employee123 |
| 5 | David Brown | d.brown@projectpulse.com | employee123 |
| 6 | Emily Davis | e.davis@projectpulse.com | employee123 |
| 7 | Robert Wilson | r.wilson@projectpulse.com | employee123 |
| 8 | Lisa Anderson | l.anderson@projectpulse.com | employee123 |
| 9 | James Taylor | j.taylor@projectpulse.com | employee123 |
| 10 | Maria Garcia | m.garcia@projectpulse.com | employee123 |

**Email Format:** `first_letter.first_name@projectpulse.com` (e.g., Shamim Hossein → `s.hossein@projectpulse.com`)

### 🔵 CLIENTS (15 users)
| # | Company Name | Email | Password |
|---|--------------|-------|----------|
| 1 | Acme Corporation | acme.corporation@projectpulse.com | client123 |
| 2 | Tech Solutions Inc | tech.solutions.inc@projectpulse.com | client123 |
| 3 | Global Industries Ltd | global.industries.ltd@projectpulse.com | client123 |
| 4 | Digital Innovations Co | digital.innovations.co@projectpulse.com | client123 |
| 5 | Future Systems LLC | future.systems.llc@projectpulse.com | client123 |
| 6 | Smart Business Group | smart.business.group@projectpulse.com | client123 |
| 7 | Advanced Technologies | advanced.technologies@projectpulse.com | client123 |
| 8 | Modern Solutions Inc | modern.solutions.inc@projectpulse.com | client123 |
| 9 | Enterprise Partners | enterprise.partners@projectpulse.com | client123 |
| 10 | Innovation Labs | innovation.labs@projectpulse.com | client123 |
| 11 | Cloud Services Corp | cloud.services.corp@projectpulse.com | client123 |
| 12 | Data Analytics Ltd | data.analytics.ltd@projectpulse.com | client123 |
| 13 | Software Solutions Inc | software.solutions.inc@projectpulse.com | client123 |
| 14 | Network Systems Co | network.systems.co@projectpulse.com | client123 |
| 15 | Creative Digital Agency | creative.digital.agency@projectpulse.com | client123 |

**Email Format:** `company_name@projectpulse.com` (lowercase, spaces replaced with dots)

**Note:** All employees use the same password (`employee123`) and all clients use the same password (`client123`).

## 📄 License

This project is built as an intern assignment.

## 👨‍💻 Developer Notes

- All code follows clean code principles
- TypeScript for type safety
- Proper error handling throughout
- RESTful API design
- Secure authentication implementation
- Responsive and accessible UI

---

**Built with ❤️ for ProjectPulse**


"# ProjectPulse" 
