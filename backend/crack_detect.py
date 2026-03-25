"""
Crack Detection Module — Python/OpenCV translation of MATLAB code.txt

Implements the image processing pipeline:
1. RGB → Grayscale → Median Filter (5×5)
2. Morphological opening with line structuring elements at 0°, 30°, 60°, 90°, 120°, 150°
3. Fuse/overlap all opened images
4. Otsu threshold → Binary inversion → Crack mask
5. Extract shape features: Area, Eccentricity, MajorAxisLength, MinorAxisLength
6. Rule-based crack classification (heuristic SVM substitute)
"""

import cv2
import numpy as np
import base64
import math
from skimage.measure import regionprops, label


def create_line_structuring_element(length: int, angle_degrees: float):
    """Create a line structuring element similar to MATLAB's strel('line', length, angle)."""
    angle_rad = math.radians(angle_degrees)
    dx = math.cos(angle_rad)
    dy = -math.sin(angle_rad)  # negative because y-axis is inverted in image coords

    # Half-length
    half = length // 2
    size = 2 * half + 1

    kernel = np.zeros((size, size), dtype=np.uint8)
    center = half

    for i in range(-half, half + 1):
        x = int(round(center + i * dx))
        y = int(round(center + i * dy))
        if 0 <= x < size and 0 <= y < size:
            kernel[y, x] = 1

    return kernel


def process_crack_image(image_bytes: bytes) -> dict:
    """
    Process an image to detect and classify cracks.
    
    Args:
        image_bytes: Raw image bytes (JPEG/PNG)
    
    Returns:
        dict with crack_type, confidence, features, and processed_image_base64
    """
    # Decode image
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("Could not decode image")

    # Step 1: Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Step 2: Median filter (5×5)
    med_img = cv2.medianBlur(gray, 5)

    # Step 3: Morphological opening with line SEs at 0°, 30°, 60°, 90°, 120°, 150°
    angles = [0, 30, 60, 90, 120, 150]
    opened_images = []

    for angle in angles:
        se = create_line_structuring_element(15, angle)
        opened = cv2.morphologyEx(med_img, cv2.MORPH_OPEN, se)
        opened_images.append(opened)

    # Step 4: Fuse/overlap all opened images (take maximum across all)
    overlap = opened_images[0].copy()
    for i in range(1, len(opened_images)):
        overlap = np.maximum(overlap, opened_images[i])

    # Step 5: Otsu threshold → Binary inversion
    _, binary = cv2.threshold(overlap, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    crack_mask = cv2.bitwise_not(binary)

    # Step 6: Extract shape features using regionprops
    labeled = label(crack_mask > 0)
    props = regionprops(labeled)

    if len(props) == 0:
        # No crack detected
        # Encode processed image
        _, buffer = cv2.imencode('.jpg', crack_mask)
        processed_b64 = base64.b64encode(buffer).decode('utf-8')

        return {
            "crack_type": "No Crack Detected",
            "confidence": 0.0,
            "features": {
                "mean_area": 0,
                "mean_eccentricity": 0,
                "mean_major_axis": 0,
                "mean_minor_axis": 0
            },
            "processed_image_base64": processed_b64
        }

    # Calculate mean features
    areas = [p.area for p in props]
    eccentricities = [p.eccentricity for p in props]
    major_axes = [p.major_axis_length for p in props]
    minor_axes = [p.minor_axis_length for p in props]

    mean_area = np.mean(areas)
    mean_eccentricity = np.mean(eccentricities)
    mean_major_axis = np.mean(major_axes)
    mean_minor_axis = np.mean(minor_axes)

    # Step 7: Rule-based crack classification
    crack_type, confidence = classify_crack(
        mean_area, mean_eccentricity, mean_major_axis, mean_minor_axis, props
    )

    # Encode processed image as base64
    _, buffer = cv2.imencode('.jpg', crack_mask)
    processed_b64 = base64.b64encode(buffer).decode('utf-8')

    return {
        "crack_type": crack_type,
        "confidence": round(confidence, 2),
        "features": {
            "mean_area": round(float(mean_area), 2),
            "mean_eccentricity": round(float(mean_eccentricity), 4),
            "mean_major_axis": round(float(mean_major_axis), 2),
            "mean_minor_axis": round(float(mean_minor_axis), 2)
        },
        "processed_image_base64": processed_b64
    }


def classify_crack(
    mean_area: float,
    mean_eccentricity: float,
    mean_major_axis: float,
    mean_minor_axis: float,
    props: list
) -> tuple:
    """
    Rule-based crack classifier mimicking the 4-class SVM from the MATLAB code.

    Categories:
      1 = Diagonal Crack
      2 = Settlement Crack
      3 = Temperature Shrinkage Crack
      4 = Vertical Crack
    """
    # Calculate orientation angle (average across regions)
    orientations = [p.orientation for p in props]  # in radians, [-pi/2, pi/2]
    mean_orientation = np.mean(orientations)
    orientation_deg = abs(np.degrees(mean_orientation))

    # Major/minor axis ratio
    axis_ratio = mean_major_axis / max(mean_minor_axis, 1e-6)

    scores = {
        "Diagonal Crack": 0.0,
        "Settlement Crack": 0.0,
        "Temperature Shrinkage Crack": 0.0,
        "Vertical Crack": 0.0
    }

    # --- Diagonal Crack ---
    # High eccentricity + orientation around 30-60° (diagonal)
    if mean_eccentricity > 0.7:
        scores["Diagonal Crack"] += 0.3
    if 25 <= orientation_deg <= 65:
        scores["Diagonal Crack"] += 0.4
    if axis_ratio > 3:
        scores["Diagonal Crack"] += 0.2

    # --- Settlement Crack ---
    # Moderate eccentricity + near-horizontal orientation (0-25°)
    if 0.4 <= mean_eccentricity <= 0.85:
        scores["Settlement Crack"] += 0.3
    if orientation_deg < 25:
        scores["Settlement Crack"] += 0.35
    if 2 < axis_ratio < 8:
        scores["Settlement Crack"] += 0.2

    # --- Temperature Shrinkage Crack ---
    # Low eccentricity, irregular/spread pattern (large area, low axis ratio)
    if mean_eccentricity < 0.6:
        scores["Temperature Shrinkage Crack"] += 0.35
    if axis_ratio < 3:
        scores["Temperature Shrinkage Crack"] += 0.3
    if mean_area > 100:
        scores["Temperature Shrinkage Crack"] += 0.2

    # --- Vertical Crack ---
    # High eccentricity + near-vertical orientation (65-90°)
    if mean_eccentricity > 0.7:
        scores["Vertical Crack"] += 0.3
    if orientation_deg >= 65:
        scores["Vertical Crack"] += 0.4
    if axis_ratio > 4:
        scores["Vertical Crack"] += 0.2

    # Find the highest scoring category
    best_type = max(scores, key=scores.get)
    best_score = scores[best_type]

    # Normalize confidence (max possible score is ~0.9)
    confidence = min(best_score / 0.9, 1.0)

    # If all scores are very low, it's uncertain
    if best_score < 0.2:
        return "Unknown Crack Type", 0.1

    return best_type, confidence
