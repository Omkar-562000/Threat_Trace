# 📋 ThreatTrace Deployment Checklist

Use this checklist to track your deployment progress.

## ☁️ MongoDB Atlas Setup
- [ ] Created free MongoDB Atlas account
- [ ] Created M0 (free) cluster
- [ ] Created database user with password
- [ ] Configured network access (0.0.0.0/0)
- [ ] Copied connection string
- [ ] Replaced `<password>` with actual password
- [ ] Added `/threattrace` database name to connection string
- [ ] Tested connection string format

## 🔧 Code Preparation
- [ ] Pushed code to GitHub repository
- [ ] Verified `backend/requirements.txt` has all dependencies
- [ ] Created `.env.production` in frontend folder
- [ ] Committed and pushed all changes

## 🖥️ Render Backend Deployment
- [ ] Created Render account
- [ ] Connected GitHub repository to Render
- [ ] Created new Web Service
- [ ] Set Root Directory to `ThreatTrace/backend`
- [ ] Set Build Command to `pip install -r requirements.txt`
- [ ] Set Start Command to `gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:$PORT app:app`
- [ ] Selected Free plan
- [ ] Added all environment variables:
  - [ ] `PYTHON_VERSION` = `3.11.0`
  - [ ] `DEBUG` = `False`
  - [ ] `SECRET_KEY` = (random string)
  - [ ] `JWT_SECRET_KEY` = (random string)
  - [ ] `MONGO_URI` = (MongoDB connection string)
  - [ ] `MAIL_SERVER` = `smtp.gmail.com` (optional)
  - [ ] `MAIL_PORT` = `587` (optional)
  - [ ] `MAIL_USE_TLS` = `True` (optional)
  - [ ] `MAIL_USERNAME` = (your email, optional)
  - [ ] `MAIL_PASSWORD` = (Gmail app password, optional)
- [ ] Clicked "Create Web Service"
- [ ] Waited for deployment to complete (5-10 min)
- [ ] Copied backend URL (e.g., `https://threattrace-backend.onrender.com`)
- [ ] Tested backend URL in browser (should show status: ok)

## 🌐 Vercel Frontend Deployment
- [ ] Created Vercel account
- [ ] Installed Vercel CLI (`npm install -g vercel`) OR used dashboard
- [ ] Navigated to `ThreatTrace/frontend` directory
- [ ] Created `.env.production` with `VITE_API_BASE=https://YOUR-BACKEND-URL.onrender.com`
- [ ] Ran `vercel` command OR imported repo in dashboard
- [ ] Added environment variable in Vercel:
  - [ ] `VITE_API_BASE` = (Render backend URL)
- [ ] Deployed with `vercel --prod` OR clicked Deploy
- [ ] Copied frontend URL (e.g., `https://threattrace.vercel.app`)
- [ ] Tested frontend URL in browser

## 🔄 Final Configuration
- [ ] Went back to Render dashboard
- [ ] Added `FRONTEND_URL` environment variable with Vercel URL
- [ ] Saved changes (backend auto-redeploys)
- [ ] Waited for redeployment (~2 min)

## ✅ Testing
- [ ] Visited frontend URL
- [ ] Created a test user account
- [ ] Logged in successfully
- [ ] Tested file upload/scan feature
- [ ] Checked dashboard loads
- [ ] Verified real-time updates work (if applicable)
- [ ] Tested on mobile device
- [ ] Tested in different browser

## 📱 Portfolio Integration
- [ ] Added project to portfolio website
- [ ] Added project description
- [ ] Added tech stack list
- [ ] Added live demo link
- [ ] Added GitHub repository link
- [ ] Added screenshots
- [ ] Created demo credentials (optional)
- [ ] Added to LinkedIn projects section
- [ ] Added to resume

## 🔧 Optional Enhancements
- [ ] Set up UptimeRobot to keep backend awake
- [ ] Configured custom domain (Vercel: free, Render: paid)
- [ ] Added Google Analytics
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Created demo video/GIF
- [ ] Added comprehensive README to GitHub

---

## 📝 Important URLs to Save

| Service | URL | Notes |
|---------|-----|-------|
| Frontend (Vercel) | `https://_____________________.vercel.app` | Main app URL |
| Backend (Render) | `https://_____________________.onrender.com` | API endpoint |
| MongoDB Atlas | Dashboard link | Database management |
| GitHub Repo | `https://github.com/____________/____________` | Source code |

---

## 🎯 Next Steps After Deployment

1. **Share your project:**
   - LinkedIn post
   - Twitter/X
   - Dev.to article
   - Portfolio website

2. **Get feedback:**
   - Share in relevant Discord/Slack communities
   - Ask friends/colleagues to test
   - Post in r/webdev or r/reactjs

3. **Improve:**
   - Monitor error logs
   - Add analytics to see user behavior
   - Iterate based on feedback

---

**Congratulations! 🎉 Your ThreatTrace app is now live!**
