# ThreatTrace Images & Logos Directory

## 📁 Folder Structure

```
public/images/
├── logos/              ← Place your logo files here
│   ├── logo-full.png   (Recommended: 200x50px or 400x100px)
│   ├── logo-icon.png   (Recommended: 64x64px or 128x128px)
│   └── logo-white.png  (White version for dark backgrounds)
│
└── backgrounds/        ← Place background images here
    ├── auth-bg.jpg     (Login/Signup page backgrounds)
    └── dashboard-bg.jpg (Optional dashboard background)
```

---

## 🎨 Logo Specifications

### 1. **Full Logo** (with text)
- **File**: `logos/logo-full.png` or `logos/logo-full.svg`
- **Size**: 200x50px to 400x100px
- **Format**: PNG (with transparency) or SVG
- **Usage**: Sidebar (expanded), Login/Signup pages
- **Example**:
  ```
  ┌────────────────────────────┐
  │  [🛡️] ThreatTrace         │  ← Your logo design
  └────────────────────────────┘
  ```

### 2. **Icon Logo** (symbol only)
- **File**: `logos/logo-icon.png` or `logos/logo-icon.svg`
- **Size**: 64x64px to 128x128px (square)
- **Format**: PNG (with transparency) or SVG
- **Usage**: Sidebar (collapsed), Favicon, Mobile app icon
- **Example**:
  ```
  ┌────┐
  │ 🛡️ │  ← Your icon only
  └────┘
  ```

### 3. **White/Light Version** (optional)
- **File**: `logos/logo-white.png`
- **Size**: Same as full logo
- **Usage**: On dark backgrounds (current theme)
- **Note**: Use white/light colored logo for better visibility

---

## 📸 Background Images

### 1. **Authentication Background**
- **File**: `backgrounds/auth-bg.jpg`
- **Size**: 1920x1080px (Full HD) or higher
- **Format**: JPG or PNG
- **Usage**: Behind login and signup forms
- **Style**: Dark, cyberpunk-themed, with subtle patterns
- **Recommended**: Abstract tech patterns, circuit boards, digital grids

### 2. **Dashboard Background** (optional)
- **File**: `backgrounds/dashboard-bg.jpg`
- **Usage**: Subtle background for dashboard
- **Note**: Should be very subtle to not interfere with content

---

## 🖼️ How to Add Your Logo

### Step 1: Prepare Your Logo Files
1. Export your logo in PNG or SVG format
2. Make sure PNG has transparent background
3. Create 3 versions:
   - Full logo (with text): `logo-full.png`
   - Icon only: `logo-icon.png`
   - White version: `logo-white.png` (optional)

### Step 2: Place Files
```powershell
# Copy your logo files to the logos folder
Copy-Item "C:\path\to\your\logo-full.png" "public\images\logos\"
Copy-Item "C:\path\to\your\logo-icon.png" "public\images\logos\"
Copy-Item "C:\path\to\your\logo-white.png" "public\images\logos\"
```

Or simply drag and drop into:
```
ThreatTrace/frontend/public/images/logos/
```

### Step 3: Refresh Your Browser
The logos will automatically appear in:
- ✅ Login page (top center)
- ✅ Signup page (top center)
- ✅ Sidebar (top left)
- ✅ Top navbar (if added)

---

## 🎯 Current Logo Placeholders

### Where Logos Appear:

1. **Login Page** (`/`)
   - Position: Top center, above "Welcome Back"
   - File used: `logo-full.png` or `logo-white.png`
   - Fallback: "ThreatTrace" text with cyber gradient

2. **Signup Page** (`/signup`)
   - Position: Top center, above "Create Account"
   - File used: `logo-full.png` or `logo-white.png`
   - Fallback: "ThreatTrace" text with cyber gradient

3. **Sidebar** (Dashboard)
   - Position: Top left corner
   - Expanded state: `logo-full.png` (200x50px)
   - Collapsed state: `logo-icon.png` (40x40px)
   - Fallback: "ThreatTrace" text

---

## 🔧 Customization

### Change Logo Size
Edit `src/components/ui/Logo.jsx`:

```jsx
// For full logo
<img src="/images/logos/logo-full.png" alt="Logo" className="h-12" />
                                                              ↑ Change height

// For icon logo
<img src="/images/logos/logo-icon.png" alt="Icon" className="h-10 w-10" />
                                                              ↑ Change size
```

### Use Different Files
If your logo files have different names:
1. Rename them to match: `logo-full.png`, `logo-icon.png`
2. OR edit `src/components/ui/Logo.jsx` to point to your filenames

---

## 📝 Recommended Tools

### Create/Design Logos:
- **Canva**: https://canva.com (Free, easy to use)
- **Figma**: https://figma.com (Professional design tool)
- **Logo Maker**: https://www.logomakr.com
- **Adobe Express**: https://www.adobe.com/express/create/logo

### Find Stock Images for Backgrounds:
- **Unsplash**: https://unsplash.com (Free, high-quality)
- **Pexels**: https://pexels.com (Free stock photos)
- **Pixabay**: https://pixabay.com (Free images)
- Search for: "cyberpunk", "technology", "circuit board", "digital abstract"

---

## 🎨 Design Tips for ThreatTrace Logos

### Color Palette (from current theme):
```
Primary Cyber Neon:  #00FFFF (Cyan)
Secondary Purple:    #B026FF (Purple)
Accent Pink:         #FF006E (Pink)
Background Dark:     #0F0F1E (Very dark blue)
```

### Logo Style Recommendations:
1. **Shield icon** → Represents security/protection
2. **Circuit patterns** → Tech/cybersecurity theme
3. **Abstract geometric** → Modern, professional
4. **Combination mark** → Icon + Text for versatility

### Example Logo Concepts:
```
Option 1: Shield + Circuit
  ┌─────────────────────────┐
  │  [🛡️⚡] ThreatTrace    │
  └─────────────────────────┘

Option 2: Hexagon Tech
  ┌─────────────────────────┐
  │  [⬡-⬡-⬡] ThreatTrace   │
  └─────────────────────────┘

Option 3: Wave/Signal
  ┌─────────────────────────┐
  │  [📡] ThreatTrace       │
  └─────────────────────────┘
```

---

## 🚀 Quick Start

### No logo yet? Use placeholders:
The app already has **placeholder logos** that will show:
- Gradient text "ThreatTrace" if no image is found
- Styled with cyber-themed colors
- Professional fallback design

### Want to add logo now?
1. Prepare logo files (PNG or SVG)
2. Drop them into `public/images/logos/`
3. Name them: `logo-full.png`, `logo-icon.png`
4. Refresh browser → Logo appears! ✨

---

## 📐 File Size Guidelines

| File Type | Recommended Size | Max Size |
|-----------|-----------------|----------|
| Logo Full PNG | 50-200 KB | 500 KB |
| Logo Icon PNG | 10-50 KB | 100 KB |
| Logo SVG | 5-20 KB | 50 KB |
| Background JPG | 200-500 KB | 1 MB |

**Note**: Smaller files = faster loading!

---

## ✅ Checklist

Before deploying:
- [ ] Logo files created and exported
- [ ] Files placed in `public/images/logos/`
- [ ] Correct file names: `logo-full.png`, `logo-icon.png`
- [ ] Transparent background for PNG logos
- [ ] White version created for dark theme (optional)
- [ ] Background image added (optional)
- [ ] Tested in browser (refresh to see changes)

---

## 💡 Examples of Good Logos

Similar cybersecurity products for inspiration:
- **CrowdStrike**: Simple falcon icon + text
- **Palo Alto Networks**: Abstract geometric mark
- **Splunk**: Stylized "S" with tech feel
- **Tenable**: Shield-like geometric design
- **Rapid7**: Abstract tech symbol

---

## 🆘 Troubleshooting

### Logo not showing?
1. **Check file path**: Must be in `public/images/logos/`
2. **Check file name**: Should be `logo-full.png` or `logo-icon.png`
3. **Clear browser cache**: Ctrl+Shift+R (hard refresh)
4. **Check file format**: Should be PNG or SVG
5. **Check console**: Open DevTools (F12) for errors

### Logo too big/small?
Edit `src/components/ui/Logo.jsx`:
- Change `className="h-12"` to `h-8` (smaller) or `h-16` (bigger)

### Logo not visible on dark background?
- Use white/light colored logo
- Save as `logo-white.png`
- Component automatically uses it on dark backgrounds

---

**Last Updated**: 2026-02-14  
**Project**: ThreatTrace Frontend  
**Component**: Logo Management System
