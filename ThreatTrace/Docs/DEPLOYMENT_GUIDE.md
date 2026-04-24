# 🚀 ThreatTrace - Free Deployment Guide for Portfolio

This guide walks you through deploying ThreatTrace completely **FREE** using:
- **MongoDB Atlas** (Database - Free 512MB)
- **Render** (Backend - Free 750 hours/month)
- **Vercel** (Frontend - Free unlimited)

Total Cost: **$0/month** ✅

---

## 📋 Prerequisites

Before you start, create accounts on:
1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) - Free tier
2. [Render](https://render.com/) - Sign up with GitHub
3. [Vercel](https://vercel.com/) - Sign up with GitHub

---

## 🗄️ Step 1: Setup MongoDB Atlas (Database)

### 1.1 Create a Free Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click **"Build a Database"**
3. Choose **FREE** tier (M0 Sandbox)
4. Select a cloud provider and region (choose closest to you)
5. Cluster name: `threattrace-cluster`
6. Click **"Create Cluster"** (takes 1-3 minutes)

### 1.2 Create Database User

1. Go to **Database Access** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **Password** authentication
4. Username: `threattrace_user`
5. Click **"Autogenerate Secure Password"** and **SAVE IT**
6. Set **Built-in Role**: `Read and write to any database`
7. Click **"Add User"**

### 1.3 Configure Network Access

1. Go to **Network Access** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - ⚠️ For production, you'd restrict this to Render's IPs
   - ✅ For portfolio/demo, this is fine
4. Click **"Confirm"**

### 1.4 Get Connection String

1. Go to **Database** (left sidebar)
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string (looks like):
   ```
   mongodb+srv://threattrace_user:<password>@threattrace-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. **Replace `<password>`** with the password you saved earlier
6. **Add database name** after `.net/`: change to `.net/threattrace?retryWrites...`
7. **Save this final connection string** - you'll need it for Render

Final format:
```
mongodb+srv://threattrace_user:YOUR_PASSWORD@threattrace-cluster.xxxxx.mongodb.net/threattrace?retryWrites=true&w=majority
```

---

## 🖥️ Step 2: Deploy Backend to Render

### 2.1 Push Code to GitHub

1. Create a new repository on GitHub (e.g., `threattrace-app`)
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - ThreatTrace"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/threattrace-app.git
   git push -u origin main
   ```

### 2.2 Create Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `threattrace-backend`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `ThreatTrace/backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:$PORT app:app`
   - **Plan**: **Free**

### 2.3 Configure Environment Variables

Click **"Advanced"** and add these environment variables:

| Key | Value |
|-----|-------|
| `PYTHON_VERSION` | `3.11.0` |
| `DEBUG` | `False` |
| `SECRET_KEY` | (Generate random string: [RandomKeygen](https://randomkeygen.com/)) |
| `JWT_SECRET_KEY` | (Generate another random string) |
| `MONGO_URI` | (Paste your MongoDB connection string from Step 1.4) |
| `MAIL_SERVER` | `smtp.gmail.com` (optional - for email features) |
| `MAIL_PORT` | `587` (optional) |
| `MAIL_USE_TLS` | `True` (optional) |
| `MAIL_USERNAME` | Your Gmail address (optional) |
| `MAIL_PASSWORD` | Your Gmail App Password* (optional) |
| `FRONTEND_URL` | (Leave empty for now, add after frontend deployment) |

**Gmail App Password Instructions* (Optional - for password reset emails):
1. Go to Google Account → Security → 2-Step Verification
2. Scroll to bottom → App passwords
3. Generate password for "Mail"
4. Copy the 16-character password

### 2.4 Deploy

1. Click **"Create Web Service"**
2. Wait 5-10 minutes for deployment
3. Once deployed, you'll get a URL like: `https://threattrace-backend.onrender.com`
4. **Test it**: Visit `https://YOUR-BACKEND-URL.onrender.com/` - should see:
   ```json
   {
     "status": "ok",
     "service": "ThreatTrace Backend",
     "db_connected": true,
     "socketio": true
   }
   ```

⚠️ **Important**: Free tier services sleep after 15 minutes of inactivity. First request after sleep takes ~30 seconds to wake up.

---

## 🌐 Step 3: Deploy Frontend to Vercel

### 3.1 Create Environment File

1. In `ThreatTrace/frontend/`, create `.env.production`:
   ```bash
   VITE_API_BASE=https://YOUR-BACKEND-URL.onrender.com
   ```
   Replace `YOUR-BACKEND-URL` with your actual Render backend URL.

### 3.2 Deploy to Vercel

**Option A: Using Vercel CLI** (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Navigate to frontend directory:
   ```bash
   cd ThreatTrace/frontend
   ```

3. Deploy:
   ```bash
   vercel
   ```
   - Login with GitHub
   - Follow prompts:
     - Set up and deploy? **Y**
     - Which scope? Choose your account
     - Link to existing project? **N**
     - Project name: `threattrace`
     - In which directory is your code? `./`
     - Override settings? **N**

4. Deploy to production:
   ```bash
   vercel --prod
   ```

**Option B: Using Vercel Dashboard**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `ThreatTrace/frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. Add Environment Variable:
   - Key: `VITE_API_BASE`
   - Value: `https://YOUR-BACKEND-URL.onrender.com`

6. Click **"Deploy"**

### 3.3 Get Your Frontend URL

After deployment, you'll get a URL like:
```
https://threattrace.vercel.app
```
or
```
https://threattrace-YOUR_USERNAME.vercel.app
```

---

## 🔄 Step 4: Update Backend CORS

Now that you have your frontend URL, update the backend:

1. Go back to [Render Dashboard](https://dashboard.render.com/)
2. Select your `threattrace-backend` service
3. Go to **Environment** tab
4. Add new environment variable:
   - Key: `FRONTEND_URL`
   - Value: `https://YOUR-FRONTEND-URL.vercel.app`
5. Click **"Save Changes"**
6. Service will automatically redeploy

---

## ✅ Step 5: Test Your Deployment

1. **Visit your frontend**: `https://YOUR-FRONTEND-URL.vercel.app`
2. **Create an account** (Sign up)
3. **Login**
4. **Test features**:
   - Upload a file for scanning
   - Check dashboard
   - Verify real-time updates work

---

## 🎯 Portfolio Tips

### Add to Your Portfolio

**Project Description Example:**
```markdown
# ThreatTrace - Real-time Cybersecurity Monitoring Platform

A full-stack web application for detecting and monitoring cybersecurity threats
in real-time using machine learning and behavioral analysis.

**Tech Stack:**
- Frontend: React, Vite, Chart.js, Socket.IO
- Backend: Flask, Flask-SocketIO, MongoDB
- Deployment: Vercel (Frontend), Render (Backend), MongoDB Atlas

**Features:**
- Real-time threat detection with WebSocket updates
- ML-based ransomware detection
- File integrity monitoring
- Interactive threat visualization
- Audit logging system

🔗 [Live Demo](https://YOUR-FRONTEND-URL.vercel.app)
🔗 [GitHub Repo](https://github.com/YOUR_USERNAME/threattrace-app)
```

### Add Demo Credentials

For portfolio reviewers, you might want to add demo credentials:

1. Create a demo user in your app: `demo@threattrace.com` / `DemoPassword123`
2. Add to README:
   ```markdown
   ## Demo Access
   - Email: demo@threattrace.com
   - Password: DemoPassword123
   ```

### Screenshots

Add screenshots to your README:
- Dashboard view
- Threat detection in action
- Real-time alerts
- File scanning results

---

## 🔧 Troubleshooting

### Backend Issues

**"Application failed to respond"**
- Check Render logs: Dashboard → Your Service → Logs
- Verify `MONGO_URI` is correct
- Check that all required packages are in `requirements.txt`

**"CORS error"**
- Verify `FRONTEND_URL` environment variable is set correctly
- Check browser console for exact error
- Ensure backend is running (visit backend URL directly)

### Frontend Issues

**"Network Error" when calling API**
- Check `VITE_API_BASE` environment variable in Vercel
- Verify backend is running (not sleeping)
- Open browser DevTools → Network tab to see exact error

**Real-time updates not working**
- Check Socket.IO connection in browser console
- Verify WebSocket isn't blocked by firewall
- Free Render services sleep - wake backend by visiting its URL

### Database Issues

**"MongoServerError: Authentication failed"**
- Double-check MongoDB password in `MONGO_URI`
- Ensure password doesn't have special characters (URL encode them)
- Verify user has correct permissions in MongoDB Atlas

**"Connection timeout"**
- Check Network Access allows 0.0.0.0/0 in MongoDB Atlas
- Wait a few minutes (cluster might be starting up)

---

## 📊 Free Tier Limitations

### Render (Backend)
- ✅ 750 hours/month free (enough for 1 app running 24/7)
- ⚠️ Sleeps after 15 min inactivity
- ⚠️ Limited to 512MB RAM
- ⚠️ Shared CPU

### Vercel (Frontend)
- ✅ Unlimited bandwidth
- ✅ Unlimited deploys
- ✅ Always online (no sleep)
- ✅ 100GB bandwidth/month

### MongoDB Atlas (Database)
- ✅ 512MB storage
- ✅ Enough for thousands of logs
- ✅ Always online

---

## 🚀 Going to Production (Paid Tiers)

When you're ready to upgrade:

1. **Render Pro** ($7/month):
   - No sleep
   - More RAM/CPU
   - Faster performance

2. **MongoDB Atlas M10** ($0.08/hour = ~$57/month):
   - 2GB RAM
   - Better performance
   - Automated backups

3. **Vercel Pro** ($20/month):
   - Better analytics
   - More team features
   - (Usually not needed for portfolio projects)

---

## 📝 Maintenance

### Update Your App

1. Make changes locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update feature"
   git push
   ```
3. Auto-deploys on both Render and Vercel! ✨

### Monitor Uptime

- Use [UptimeRobot](https://uptimerobot.com/) (free) to ping your backend every 5 minutes
- Keeps it from sleeping
- Get alerts if it goes down

---

## 🎓 Learning Resources

- [Flask Deployment Best Practices](https://flask.palletsprojects.com/en/latest/deploying/)
- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas/)

---

## 🤝 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Render/Vercel deployment logs
3. Check MongoDB Atlas metrics

---

**Good luck with your portfolio! 🎉**

Your ThreatTrace app is now live and ready to impress recruiters!
