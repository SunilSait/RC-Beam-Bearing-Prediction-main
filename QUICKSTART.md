# Quick Start Guide

## Option 1: Automated Setup (Recommended)

### Step 1: Setup Backend
Double-click `setup-backend.bat` or run:
```bash
setup-backend.bat
```

### Step 2: Setup Frontend
Double-click `setup-frontend.bat` or run:
```bash
setup-frontend.bat
```

### Step 3: Start the Application

**Terminal 1 - Backend:**
Double-click `start-backend.bat` or run:
```bash
start-backend.bat
```
Backend will be available at: http://localhost:8000
API Docs: http://localhost:8000/docs

**Terminal 2 - Frontend:**
Double-click `start-frontend.bat` or run:
```bash
start-frontend.bat
```
Frontend will be available at: http://localhost:3000

## Option 2: Manual Setup

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## First Time Usage

1. Run backend setup (only once)
2. Run frontend setup (only once)
3. Start backend server (Terminal 1)
4. Start frontend server (Terminal 2)
5. Open http://localhost:3000 in your browser

## Default Test Values

Try these default values to test the calculator:
- Concrete Grade: 25 MPa
- Steel Grade: 415 MPa
- Width: 230 mm
- Depth: 450 mm
- Length: 4000 mm
- Load Type: Point Load
- Main Bar Diameter: 16 mm
- Number of Main Bars: 2
- Stirrup Diameter: 8 mm
- Stirrup Spacing: 150 mm

## Troubleshooting

### Backend Issues
- Make sure Python 3.8+ is installed
- Check if port 8000 is available
- Verify TensorFlow installation

### Frontend Issues
- Make sure Node.js 16+ is installed
- Check if port 3000 is available
- Try deleting `node_modules` and running `npm install` again

### PowerShell Execution Policy
If you get an error about execution policies, run PowerShell as Administrator and execute:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Need Help?

Check the main README.md for detailed documentation.
