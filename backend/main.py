from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import List, Literal
import math
import numpy as np
import tensorflow as tf
import joblib

# ====================================================
# LOAD WEIGHTED NEURAL NETWORK (INFERENCE ONLY)
# ====================================================
model = tf.keras.models.load_model("beam_weighted_model.keras")
scaler = joblib.load("scaler.save")

# ====================================================
# FASTAPI APP SETUP
# ====================================================
app = FastAPI(
    title="RC Beam Bearing Capacity API",
    description="API for calculating RC beam bearing capacity using IS-456 code and Neural Network predictions",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ====================================================
# PYDANTIC MODELS FOR REQUEST VALIDATION
# ====================================================
class BeamParameters(BaseModel):
    fck: Literal[20, 25, 30, 35, 40] = Field(..., description="Concrete grade (MPa)")
    fy: Literal[415, 500] = Field(..., description="Steel grade (MPa)")
    b: float = Field(..., ge=150, le=1000, description="Beam width (mm)")
    D: float = Field(..., ge=200, le=1000, description="Overall depth (mm)")
    L: float = Field(..., ge=500, le=10000, description="Beam length (mm)")
    load_type: Literal["Point Load", "Two Point Load"] = Field(..., description="Type of loading")
    main_dia: float = Field(..., ge=8, le=32, description="Main bar diameter (mm)")
    main_count: int = Field(..., ge=1, le=8, description="Number of main bars")
    stirrup_dia: float = Field(..., ge=6, le=12, description="Stirrup diameter (mm)")
    spacing: float = Field(..., ge=80, le=300, description="Stirrup spacing (mm)")

class CalculationResult(BaseModel):
    Wu_kN_gross: float
    Wu_kN_net: float
    Mu_kNm: float
    Vu_kN: float
    d_mm: float
    pt_percent: float
    tau_v: float
    tau_c: float
    tau_c_max: float
    mode: str
    warnings: List[str]

class NNPredictionResult(BaseModel):
    predicted_capacity_kN: float

# ====================================================
# IS 456 τc TABLE (p_t vs fck)
# ====================================================
tc_table = {
    20: [0.28, 0.32, 0.36, 0.40, 0.45],
    25: [0.29, 0.33, 0.37, 0.41, 0.46],
    30: [0.30, 0.34, 0.38, 0.42, 0.47],
    35: [0.31, 0.35, 0.39, 0.43, 0.48],
    40: [0.32, 0.36, 0.40, 0.44, 0.49]
}

pt_range = [0.15, 0.25, 0.50, 0.75, 1.0]
tc_max = {20: 2.8, 25: 3.1, 30: 3.5, 35: 3.7, 40: 4.0}

def get_tc(pt: float, fck: int) -> float:
    pt = max(min(pt, 1.0), 0.15)
    return float(np.interp(pt, pt_range, tc_table[fck]))

# ====================================================
# SELF WEIGHT
# ====================================================
def self_weight_kN_per_m(b: float, D: float) -> float:
    density = 25  # kN/m3
    return density * (b / 1000) * (D / 1000)

# ====================================================
# MAIN IS-456 CALCULATION FUNCTION
# ====================================================
def calculate_is456(params: BeamParameters) -> dict:
    cover = 25
    d = params.D - cover - params.stirrup_dia - params.main_dia / 2

    if d <= 0:
        raise HTTPException(status_code=400, detail="Invalid effective depth")

    Ast = (math.pi / 4) * (params.main_dia ** 2) * params.main_count
    Asv = (math.pi / 4) * (params.stirrup_dia ** 2) * 2

    xu = (0.87 * params.fy * Ast) / (0.36 * params.fck * params.b)
    xu_max = 0.48 * d
    xu = min(xu, xu_max)

    Mu = 0.36 * params.fck * params.b * xu * (d - 0.42 * xu)
    Mu_lim = 0.138 * params.fck * params.b * d * d
    Mu = min(Mu, Mu_lim)

    eff_span = min(params.L + d, params.L)

    if params.load_type == "Point Load":
        W_flex = 4 * Mu / eff_span
    else:
        W_flex = 6 * Mu / eff_span

    pt = 100 * Ast / (params.b * d)
    tc = get_tc(pt, params.fck)
    tc_lim = tc_max[params.fck]

    V = W_flex / 2
    tau_v = V / (params.b * d)

    Vc = tc * params.b * d
    Vs = 0.87 * params.fy * Asv * d / params.spacing
    Vu = Vc + Vs

    W_shear = 2 * Vu
    Wu = min(W_flex, W_shear)

    sw = self_weight_kN_per_m(params.b, params.D) * (params.L / 1000)
    Wu_net = Wu / 1000 - sw

    if W_flex < 0.9 * W_shear:
        mode = "Flexural"
    elif W_shear < 0.9 * W_flex:
        mode = "Shear"
    else:
        mode = "Combined"

    warnings = []
    if tau_v > tc_lim:
        warnings.append("τv exceeds τc,max → unsafe section.")
    if Wu_net <= 0:
        warnings.append("Beam fails under self weight!")

    return {
        "Wu_kN_gross": Wu / 1000,
        "Wu_kN_net": Wu_net,
        "Mu_kNm": Mu / 1e6,
        "Vu_kN": Vu / 1000,
        "d_mm": d,
        "pt_percent": pt,
        "tau_v": tau_v,
        "tau_c": tc,
        "tau_c_max": tc_lim,
        "mode": mode,
        "warnings": warnings
    }

# ====================================================
# NEURAL NETWORK PREDICTION
# ====================================================
def nn_predict(params: BeamParameters) -> float:
    features = [
        params.fck, params.fy, params.b, params.D, params.L,
        params.main_dia, params.main_count,
        params.stirrup_dia, params.spacing
    ]
    features_scaled = scaler.transform([features])
    return float(model.predict(features_scaled)[0][0])

# ====================================================
# API ENDPOINTS
# ====================================================
@app.get("/")
def root():
    return {
        "message": "RC Beam Bearing Capacity API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "calculate_is456": "/api/calculate-is456",
            "predict_nn": "/api/predict-nn"
        }
    }

@app.post("/api/calculate-is456", response_model=CalculationResult)
def calculate_endpoint(params: BeamParameters):
    """
    Calculate RC beam bearing capacity using IS-456 code standards.
    
    Returns detailed calculation results including:
    - Gross and net capacity
    - Flexural moment
    - Shear capacity
    - Failure mode
    - Safety warnings
    """
    try:
        result = calculate_is456(params)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calculation error: {str(e)}")

@app.post("/api/predict-nn", response_model=NNPredictionResult)
def predict_endpoint(params: BeamParameters):
    """
    Predict RC beam bearing capacity using trained Neural Network model.
    
    Returns the predicted net capacity in kN.
    """
    try:
        prediction = nn_predict(params)
        return {"predicted_capacity_kN": prediction}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "model_loaded": model is not None}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
