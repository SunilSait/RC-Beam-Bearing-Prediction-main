# RC Beam Bearing Capacity Calculator

A modern, responsive web application for calculating RC beam bearing capacity using IS-456 code standards and Neural Network predictions.

## 🚀 Features

- **IS-456 Code Calculations** - Detailed structural analysis following Indian Standards
- **Neural Network Predictions** - ML-powered capacity predictions
- **Modern UI** - Glassmorphism design with smooth animations
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Real-time Validation** - Input validation with visual feedback
- **Detailed Results** - Comprehensive analysis including failure modes and warnings

## 🛠️ Tech Stack

### Backend
- **FastAPI** - High-performance Python web framework
- **TensorFlow** - Neural network model inference
- **Pydantic** - Data validation using Python type hints
- **Uvicorn** - ASGI server

### Frontend
- **React 18** - Modern UI library
- **Vite** - Next-generation frontend tooling
- **Axios** - HTTP client for API calls
- **Vanilla CSS** - Custom styling with modern design patterns

## 📁 Project Structure

```
RC-Beam-Bearing-Prediction-main/
├── backend/
│   ├── main.py                    # FastAPI application
│   ├── requirements.txt           # Python dependencies
│   ├── beam_weighted_model.keras  # Trained ML model
│   └── scaler.save               # Feature scaler
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── InputForm.jsx
│   │   │   └── ResultDisplay.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── app.py                        # Original Streamlit version
```

## 🚦 Getting Started

### Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
venv\Scripts\activate  # On Windows
# source venv/bin/activate  # On macOS/Linux
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Start the FastAPI server:
```bash
uvicorn main:app --reload
```

The backend will be available at `http://localhost:8000`

- API Documentation: `http://localhost:8000/docs`
- Alternative Docs: `http://localhost:8000/redoc`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 📊 API Endpoints

### Calculate using IS-456
```http
POST /api/calculate-is456
Content-Type: application/json

{
  "fck": 25,
  "fy": 415,
  "b": 230,
  "D": 450,
  "L": 4000,
  "load_type": "Point Load",
  "main_dia": 16,
  "main_count": 2,
  "stirrup_dia": 8,
  "spacing": 150
}
```

### Predict using Neural Network
```http
POST /api/predict-nn
Content-Type: application/json

{
  "fck": 25,
  "fy": 415,
  "b": 230,
  "D": 450,
  "L": 4000,
  "main_dia": 16,
  "main_count": 2,
  "stirrup_dia": 8,
  "spacing": 150
}
```

## 🎨 Design Features

- **Glassmorphism UI** - Frosted glass effect with backdrop blur
- **Gradient Backgrounds** - Vibrant color gradients
- **Smooth Animations** - Fade-in, hover, and transition effects
- **Dark Theme** - Professional dark mode design
- **Responsive Layout** - Mobile-first responsive design
- **Interactive Elements** - Hover effects and visual feedback

## 📱 Responsive Breakpoints

- **Desktop**: > 768px
- **Tablet**: 480px - 768px
- **Mobile**: < 480px

## 🔧 Input Parameters

### Material Properties
- **Concrete Grade (fck)**: 20, 25, 30, 35, 40 MPa
- **Steel Grade (fy)**: 415, 500 MPa

### Beam Dimensions
- **Width (b)**: 150-1000 mm
- **Overall Depth (D)**: 200-1000 mm
- **Length (L)**: 500-10000 mm
- **Load Type**: Point Load, Two Point Load

### Reinforcement Details
- **Main Bar Diameter**: 8-32 mm
- **Number of Main Bars**: 1-8
- **Stirrup Diameter**: 6-12 mm
- **Stirrup Spacing**: 80-300 mm

## 📈 Output Results

### IS-456 Calculation
- Gross Capacity (kN)
- Net Capacity (kN)
- Flexural Moment (kN·m)
- Shear Capacity (kN)
- Effective Depth (mm)
- Steel Ratio (%)
- Shear Stresses (MPa)
- Failure Mode (Flexural/Shear/Combined)
- Safety Warnings

### Neural Network Prediction
- Predicted NET Capacity (kN)

## 🚀 Production Build

### Backend
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm run build
npm run preview
```

## 📝 License

This project is for educational and research purposes.

## 👨‍💻 Development

- Backend runs on port 8000
- Frontend runs on port 3000
- Vite proxy configured for seamless API communication
- Hot Module Replacement (HMR) enabled for fast development

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📧 Support

For questions or support, please open an issue in the repository.

---

Built with ❤️ using FastAPI and React
