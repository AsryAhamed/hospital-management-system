# 🏥 HealthConnect - Appointment Scheduler

A modern, full-stack appointment scheduling system built with React, Vite, and Supabase.

## ✨ Features

- 🔐 User authentication (email/password)
- 👤 Patient registration
- 📅 Appointment booking with date/time
- 📋 Real-time appointment list with search/filter
- ✏️ Edit and delete appointments
- 🎨 Clean, responsive UI with pure CSS
- 💾 PostgreSQL database via Supabase

## 🛠️ Tech Stack

- **Frontend:** React 18 + Vite
- **Backend:** Supabase (Auth + Database)
- **Database:** PostgreSQL
- **Styling:** Pure CSS (no frameworks)
- **Deployment:** Vercel

## 🚀 Local Setup

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/appointment-scheduler.git
cd appointment-scheduler
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file with Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run development server:
```bash
npm run dev
```

5. Open http://localhost:5173

## 📊 Database Schema

### Patients Table
- `id` (uuid, primary key)
- `name` (text)
- `email` (text)
- `phone` (text)
- `created_at` (timestamp)

### Appointments Table
- `id` (uuid, primary key)
- `patient_id` (uuid, foreign key)
- `date` (date)
- `time` (time)
- `reason` (text)
- `status` (text, default: 'Pending')
- `created_at` (timestamp)

## 🎨 Design Features

- Gradient backgrounds
- Smooth animations
- Responsive grid layout
- Status badges (Pending/Completed)
- Modal dialogs for editing
- Search and filter functionality

## 📄 License

MIT

## 👨‍💻 Author

Asry Ahamed
