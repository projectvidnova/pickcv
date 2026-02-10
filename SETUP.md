# 🎯 INSTANT SETUP - READ THIS FIRST!

## ⚡ FASTEST WAY (1 Click)

### Windows:
```
Double-click: START.bat
```

### Mac/Linux:
```bash
./START.sh
```

**That's it!** Browser opens automatically at http://localhost:5173

---

## 🖥️ OPEN IN VS CODE

### Method 1: From Explorer
1. Right-click on folder
2. Select "Open with Code"
3. Press `Ctrl+` (backtick) to open terminal
4. Type: `npm install && npm run dev`

### Method 2: From Command Line
```bash
code pickcv.code-workspace
```
Then press `F5` to run!

### Method 3: Drag & Drop
1. Open VS Code
2. Drag the entire folder into VS Code
3. Terminal → Type: `npm install && npm run dev`

---

## 📋 What Happens Next?

1. ✅ Dependencies install (1-2 minutes)
2. ✅ Dev server starts
3. ✅ Browser opens automatically
4. ✅ You see the PickCV demo!

---

## 🎨 Try the Demo

1. **Upload Resume** - Click "Choose File" (any PDF/DOC)
2. **Watch AI Analyze** - 2-second animation
3. **See Results** - ATS score with recommendations
4. **Try Again** - Upload another file

---

## 🛠️ Make It Yours

### Edit the App:
Open: `src/App.jsx`
- Change text
- Change colors (indigo → blue, purple, etc.)
- Add features

Save → Browser updates automatically! ⚡

---

## ❓ Issues?

### Node.js Not Installed?
1. Download: https://nodejs.org
2. Install
3. Restart terminal
4. Run again

### Port Taken?
Edit `vite.config.js`:
```js
server: {
  port: 3000,  // Change 5173 to 3000
}
```

### Still Stuck?
```bash
# Clean install
rm -rf node_modules
npm install
npm run dev
```

---

## 🎉 You're Ready!

**Press F5 in VS Code or run START.bat/START.sh**

Browser opens at: http://localhost:5173

**Happy coding!** 🚀
