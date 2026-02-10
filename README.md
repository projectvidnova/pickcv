# 🚀 PickCV - Visual Studio Code Ready

## ⚡ INSTANT RUN - 3 Steps

### Step 1: Open in VS Code
```bash
# Option A: From command line
code pickcv.code-workspace

# Option B: In VS Code
File → Open Workspace → Select "pickcv.code-workspace"
```

### Step 2: Install Dependencies
```bash
# In VS Code terminal (Ctrl+` or Cmd+`)
npm install
```

### Step 3: Run
```bash
npm run dev
```

✅ **Browser opens automatically at http://localhost:5173**

---

## 🎯 What You Get

### Working Demo Features:
- ✅ **File Upload** - Upload resume (simulated)
- ✅ **AI Analysis** - Animated ATS score calculation
- ✅ **Results Dashboard** - Score display with recommendations
- ✅ **Responsive Design** - Mobile-friendly UI
- ✅ **Beautiful UI** - TailwindCSS styling
- ✅ **Interactive** - Real-time feedback

### Tech Stack:
- ⚛️ React 18
- ⚡ Vite (lightning fast)
- 🎨 TailwindCSS
- 🎭 Lucide Icons
- 📱 Responsive

---

## 🖥️ VS Code Features

### Quick Run (Press F5)
- Launches dev server automatically
- Browser opens to http://localhost:5173
- Hot reload on save

### Available Tasks (Terminal → Run Task):
- **Start Dev Server** - Launch app
- **Build** - Create production build
- **Run Tests** - Execute test suite

### Keyboard Shortcuts:
- `Ctrl+Shift+B` (or `Cmd+Shift+B`) - Build
- `F5` - Start debugging/dev server
- `Ctrl+` ` - Toggle terminal

---

## 📁 Project Structure

```
pickcv/
├── index.html              - Entry HTML
├── package.json            - Dependencies
├── vite.config.js          - Vite configuration
├── tailwind.config.js      - Tailwind configuration
├── pickcv.code-workspace   - VS Code workspace
│
├── src/
│   ├── main.jsx           - App entry point
│   ├── App.jsx            - Main component (EDIT THIS!)
│   ├── App.css            - Component styles
│   ├── index.css          - Global styles
│   │
│   ├── components/        - Your components here
│   ├── pages/             - Your pages here
│   ├── hooks/             - Custom hooks
│   ├── utils/             - Helper functions
│   └── services/          - API services
│
├── public/                - Static assets
└── tests/                 - Test files
```

---

## 🎨 Customize the Demo

### Change Colors:
Edit `src/App.jsx` - Look for `indigo-600` and replace with:
- `blue-600`
- `purple-600`
- `green-600`
- `red-600`

### Add Your Logo:
Replace the `<Sparkles>` icon in `App.jsx` line 19:
```jsx
<img src="/your-logo.png" className="w-8 h-8" />
```

### Modify Text:
All text is in `src/App.jsx` - edit freely!

---

## 📦 Available Commands

```bash
# Development
npm run dev          # Start dev server (auto-opens browser)
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm test             # Run tests
```

---

## 🔧 Common Tasks

### Add New Component:
1. Create file: `src/components/MyComponent.jsx`
2. Write component:
```jsx
export default function MyComponent() {
  return <div>Hello!</div>
}
```
3. Import in App.jsx:
```jsx
import MyComponent from './components/MyComponent'
```

### Add New Page:
1. Create file: `src/pages/Dashboard.jsx`
2. Use it in App.jsx

### Install Package:
```bash
npm install package-name
```

---

## 🐛 Troubleshooting

### Port Already in Use?
```bash
# Change port in vite.config.js
server: {
  port: 3000,  // Change to any available port
}
```

### Module Not Found?
```bash
rm -rf node_modules package-lock.json
npm install
```

### Hot Reload Not Working?
```bash
# Restart dev server
Ctrl+C (stop)
npm run dev (start)
```

---

## 🚀 Deploy to Production

### Option 1: Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Option 2: Netlify
```bash
npm run build
# Upload 'dist' folder to Netlify
```

### Option 3: Manual
```bash
npm run build
# Upload 'dist' folder to any hosting
```

---

## 📚 Learn More

- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [TailwindCSS Docs](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)

---

## 🎉 Next Steps

1. ✅ Run the demo (you're here!)
2. 📝 Customize the UI
3. 🔌 Add backend (Supabase)
4. 💳 Add payments (Stripe)
5. 🤖 Add AI (Anthropic)
6. 🚀 Deploy to production

---

## 💡 Tips

- Save files to see changes instantly (Hot Reload)
- Use VS Code extensions (auto-installed from workspace)
- Check terminal for errors
- Use React DevTools browser extension

---

**Ready to build? Start editing `src/App.jsx`!** 🎨
