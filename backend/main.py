from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response
from pydantic import BaseModel, Field
from typing import Optional
import math
import base64
import httpx
from crack_detect import process_crack_image

# ====================================================
# FASTAPI APP SETUP
# ====================================================
app = FastAPI(
    title="IS 456 Beam Capacity Predictor API",
    description="API for predicting RC beam capacity using IS-456 code provisions",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ====================================================
# PYDANTIC MODELS
# ====================================================
class BeamParameters(BaseModel):
    fck: float = Field(..., ge=15, le=80, description="Concrete Strength fck (MPa)")
    fy: float = Field(..., ge=250, le=600, description="Steel Yield Strength fy (MPa)")
    b: float = Field(..., ge=100, le=2000, description="Beam Width b (mm)")
    D: float = Field(..., ge=150, le=2000, description="Overall Depth D (mm)")
    L: float = Field(..., ge=500, le=20000, description="Span Length L (mm)")
    loading_type: str = Field(default="Single Point Load", description="Loading Type")
    num_bars: int = Field(..., ge=1, le=20, description="Number of Main Bars")
    main_dia: float = Field(..., ge=8, le=40, description="Main Bar Diameter (mm)")
    stirrup_dia: float = Field(..., ge=6, le=16, description="Stirrup Diameter (mm)")
    stirrup_spacing: float = Field(..., ge=50, le=500, description="Stirrup Spacing (mm)")
    cover: float = Field(default=30.0, ge=15, le=100, description="Concrete Cover (mm)")
    custom_d: Optional[float] = Field(default=None, ge=50, le=2000, description="Custom Effective Depth (mm)")
    applied_load: float = Field(default=0.0, ge=0, description="Applied Load (kN)")

class CalculationResult(BaseModel):
    ultimate_moment_capacity_kNm: float
    design_shear_capacity_kN: float
    maximum_shear_capacity_kN: float
    shear_capacity_kN: float
    maximum_load_capacity_kN: float
    effective_depth_mm: float
    steel_area_mm2: float
    steel_ratio_rho: float
    reinforcement_type: str
    failure_mode: str
    is_safe: Optional[bool] = None
    applied_load_kN: float

# ====================================================
# IS 456 τc TABLE (Table 19)
# ====================================================
def get_tau_c(fck: float, rho: float) -> float:
    p = rho * 100

    p_values = [0.15, 0.25, 0.50, 0.75, 1.00]

    tau_table = {
        20: [0.28, 0.36, 0.48, 0.56, 0.62],
        25: [0.29, 0.37, 0.49, 0.57, 0.64],
        30: [0.30, 0.38, 0.50, 0.59, 0.66],
        35: [0.31, 0.39, 0.51, 0.60, 0.67],
        40: [0.32, 0.40, 0.52, 0.62, 0.70]
    }

    # Snap to nearest grade in table
    nearest_fck = min(tau_table.keys(), key=lambda x: abs(x - fck))
    tau_values = tau_table[nearest_fck]

    if p <= p_values[0]:
        return tau_values[0]

    if p >= p_values[-1]:
        return tau_values[-1]

    for i in range(len(p_values) - 1):
        if p_values[i] <= p <= p_values[i + 1]:
            p1, p2 = p_values[i], p_values[i + 1]
            t1, t2 = tau_values[i], tau_values[i + 1]
            return t1 + (p - p1) * (t2 - t1) / (p2 - p1)

    return tau_values[0]

# ====================================================
# IS 456 BEAM CAPACITY CALCULATION
# ====================================================
def calculate_beam_capacity(params: BeamParameters) -> dict:
    # Effective depth
    if params.custom_d is not None:
        d = params.custom_d
    else:
        d = params.D - params.cover - (params.main_dia / 2)

    if d <= 0:
        raise HTTPException(status_code=400, detail="Invalid effective depth. Check cover and bar diameter.")

    # Steel area
    As = params.num_bars * (math.pi / 4) * (params.main_dia ** 2)

    # Steel ratio
    rho = As / (params.b * d)

    # Neutral axis depth
    xu = (0.87 * params.fy * As) / (0.36 * params.fck * params.b)
    xu_max = 0.48 * d

    if xu > xu_max:
        xu = xu_max
        reinf_type = "Over-Reinforced (Brittle)"
    else:
        reinf_type = "Under-Reinforced (Ductile)"

    # Moment capacity
    Mu_Nmm = 0.87 * params.fy * As * (d - 0.42 * xu)
    Mu_kNm = Mu_Nmm / 1e6

    # Shear capacity
    tau_c = get_tau_c(params.fck, rho)
    Vc_N = tau_c * params.b * d

    Asv = 2 * (math.pi / 4) * (params.stirrup_dia ** 2)
    Vs_N = (0.87 * params.fy * Asv * d) / params.stirrup_spacing

    Vu_design = (Vc_N + Vs_N) / 1000

    # Maximum shear capacity (IS 456 Table 20)
    tau_c_max_table = {
        20: 2.8,
        25: 3.1,
        30: 3.5,
        35: 3.7,
        40: 4.0
    }
    nearest_fck_max = min(tau_c_max_table.keys(), key=lambda x: abs(x - params.fck))
    tau_c_max = tau_c_max_table[nearest_fck_max]
    Vmax = (tau_c_max * params.b * d) / 1000

    Vu_kN = min(Vu_design, Vmax)

    # Load calculation depending on loading type
    if params.loading_type == "Single Point Load":
        W_kN = (4 * Mu_kNm) / (params.L / 1000)
    elif params.loading_type == "Two Point Load":
        W_kN = (6 * Mu_kNm) / (params.L / 1000)
    else:
        W_kN = (4 * Mu_kNm) / (params.L / 1000)

    # Failure mode
    if Vu_design < W_kN / 2:
        failure = "Shear Failure (Brittle)"
    else:
        failure = "Flexural Failure (Ductile)"

    # Safety check
    is_safe = None
    if params.applied_load > 0:
        is_safe = params.applied_load < W_kN

    return {
        "ultimate_moment_capacity_kNm": round(Mu_kNm, 2),
        "design_shear_capacity_kN": round(Vu_design, 2),
        "maximum_shear_capacity_kN": round(Vmax, 2),
        "shear_capacity_kN": round(Vu_kN, 2),
        "maximum_load_capacity_kN": round(W_kN, 2),
        "effective_depth_mm": round(d, 2),
        "steel_area_mm2": round(As, 2),
        "steel_ratio_rho": round(rho, 4),
        "reinforcement_type": reinf_type,
        "failure_mode": failure,
        "is_safe": is_safe,
        "applied_load_kN": params.applied_load
    }

# ====================================================
# API ENDPOINTS
# ====================================================
@app.get("/")
def root():
    return {
        "message": "IS 456 Beam Capacity Predictor API",
        "version": "2.0.0",
        "docs": "/docs",
        "endpoints": {
            "predict": "/api/predict"
        }
    }

@app.post("/api/predict", response_model=CalculationResult)
def predict_endpoint(params: BeamParameters):
    """
    Predict RC beam bearing capacity using IS-456 code provisions.

    Returns detailed results including:
    - Ultimate moment capacity
    - Shear capacities (design, maximum, final)
    - Maximum load capacity
    - Reinforcement type and failure mode
    - Safety check (if applied load is provided)
    """
    try:
        result = calculate_beam_capacity(params)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calculation error: {str(e)}")

# ====================================================
# CRACK DETECTION MODELS & ENDPOINT
# ====================================================
class CrackDetectRequest(BaseModel):
    image_base64: str = Field(..., description="Base64-encoded JPEG/PNG image")

@app.post("/api/crack-detect")
def crack_detect_endpoint(request: CrackDetectRequest):
    """
    Analyze an image for cracks using morphological processing and feature extraction.
    
    Translates the MATLAB crack detection algorithm to Python/OpenCV:
    - Grayscale → Median filter → Morphological opening (6 angles)
    - Overlap fusion → Otsu threshold → Crack mask
    - Shape feature extraction → Rule-based classification
    
    Returns crack type, confidence, features, and processed image.
    """
    try:
        image_bytes = base64.b64decode(request.image_base64)
        result = process_crack_image(image_bytes)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Crack detection failed: {str(e)}")

# ====================================================
# ESP32-CAM PROXY ENDPOINTS (bypass browser CORS)
# ====================================================
@app.get("/api/esp32/stream")
async def esp32_stream_proxy(ip: str = Query(..., description="ESP32-CAM IP address")):
    """Proxy the MJPEG stream from ESP32-CAM to bypass CORS."""
    stream_url = f"http://{ip}:81/stream"
    try:
        client = httpx.AsyncClient(timeout=None)
        req = client.build_request("GET", stream_url)
        resp = await client.send(req, stream=True)
        return StreamingResponse(
            resp.aiter_bytes(),
            media_type=resp.headers.get("content-type", "multipart/x-mixed-replace"),
            background=client.aclose,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Cannot connect to ESP32-CAM at {ip}: {str(e)}")

@app.get("/api/esp32/capture")
async def esp32_capture_proxy(ip: str = Query(..., description="ESP32-CAM IP address")):
    """Proxy a still capture from ESP32-CAM."""
    capture_url = f"http://{ip}/capture"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(capture_url)
            resp.raise_for_status()
            return Response(
                content=resp.content,
                media_type=resp.headers.get("content-type", "image/jpeg"),
            )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Capture failed from {ip}: {str(e)}")

@app.get("/api/esp32/control")
async def esp32_control_proxy(
    ip: str = Query(...),
    var: str = Query(...),
    val: str = Query(...),
):
    """Proxy control commands to ESP32-CAM (flash, resolution, etc)."""
    control_url = f"http://{ip}/control?var={var}&val={val}"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(control_url)
            return {"status": "ok", "response": resp.text}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Control command failed: {str(e)}")

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
