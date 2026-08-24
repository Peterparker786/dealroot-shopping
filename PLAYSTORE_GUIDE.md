# DEALROOT — Play Store Setup Guide

## 🎯 How It Works

DEALROOT is a **PWA (Progressive Web App)**. To get it on the Play Store, we wrap it as a **TWA (Trusted Web Activity)** — basically a lightweight Android shell that loads your website.

**Magic:** Any change you push to Vercel → automatically updates in the app. No resubmission needed!

---

## Method 1: PWABuilder.com (Easiest — No Install)

### Step 1: Generate APK/AAB
1. Go to **https://pwabuilder.com**
2. Enter: `https://www.dealroot.store`
3. Click **"Package for stores"**
4. Select **Android**
5. Download the `.aab` file

### Step 2: Upload to Play Store
1. Go to **https://play.google.com/console**
2. Create a developer account ($25 one-time fee)
3. Click **"Create app"**
4. Fill in app details:
   - Name: **DEALROOT — Premium Beauty**
   - Package: **com.dealroot.beauty**
   - Category: **Shopping**
5. Upload the `.aab` file from PWABuilder
6. Add screenshots (see below)
7. Submit for review (usually 1-3 days)

---

## Method 2: Bubblewrap + Android Studio (Full Control)

### Prerequisites
1. Install **Java JDK 17**: https://adoptium.net/
2. Install **Android Studio**: https://developer.android.com/studio
3. Install **Bubblewrap CLI**:
   ```bash
   npm install -g @nicedoc/nickvdh @nicedoc/nickvdh @nicedoc/nickvdh
   ```

### Step 1: Create signing key
```bash
keytool -genkey -v -keystore release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias dealroot
```

### Step 2: Initialize project
```bash
npx @nicedoc/nickvdh init
```
Enter:
- Domain: `www.dealroot.store`
- App name: `DEALROOT`
- Theme color: `#7c3aed`
- Signing key: `android/release-key.jks`

### Step 3: Build APK
```bash
npx @nicedoc/nickvdh build
```

### Step 4: Upload to Play Store
Same as Method 1 Step 2.

---

## 📸 Required Screenshots for Play Store

Take these from Chrome DevTools (mobile view):
- **Phone**: 1080 x 1920 px (at least 2 screenshots)
- **Tablet** (optional): 1200 x 1920 px

### How to take screenshots:
1. Open `https://www.dealroot.store` in Chrome
2. Press F12 → Toggle device toolbar (Ctrl+Shift+M)
3. Select "Moto G Power" or similar (1080px width)
4. Take screenshots of:
   - Home page
   - Product page
   - Cart
   - Checkout

---

## 🔄 Auto-Update Flow

```
You push to GitHub → Vercel auto-deploys → Users see changes on next app open
```

**No Play Store resubmission needed!** The app is just a Chrome wrapper around your website.

If you want to force an update:
- The service worker auto-updates on page load
- Users can also pull-to-refresh in the app

---

## 📱 App Icon Sizes Needed

Already have these (in `public/icons/`):
- ✅ `icon-192.png` (192x192) — Android notification icon
- ✅ `icon-512.png` (512x512) — Play Store icon
- ✅ `icon-maskable-512.png` — Adaptive icon

### For Play Store listing also need:
- **Feature graphic**: 1024 x 500 px (banner image)
- **App icon**: 512 x 512 px (already have this)

---

## 💰 Cost

| Item | Cost |
|------|------|
| Google Play Developer Account | $25 (one-time) |
| Hosting (Vercel) | Free tier |
| Backend (Render) | Free tier |
| SSL Certificate | Free (Vercel) |
| **Total** | **$25** |

---

## ⏱ Timeline

| Step | Time |
|------|------|
| Setup PWABuilder | 10 minutes |
| Play Store account | 5 minutes |
| Submit app | 15 minutes |
| Review process | 1-3 days |
| **Live on Play Store** | **2-4 days total** |
