import React from 'react';

const BeamCrossSection = ({ b, D, numBars, barDia }) => {
    const padding = 40;
    const svgWidth = 300;
    const scale = (svgWidth - 2 * padding) / Math.max(b, D);
    const scaledB = b * scale;
    const scaledD = D * scale;
    const svgHeight = scaledD + 2 * padding;
    const offsetX = (svgWidth - scaledB) / 2;
    const offsetY = padding;

    const barRadius = Math.max((barDia / 2) * scale, 4);
    const barSpacing = scaledB / (numBars + 1);

    return (
        <div className="beam-section">
            <h3>Beam Cross Section</h3>
            <div className="beam-svg-wrapper">
                <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                    {/* Grid pattern */}
                    <defs>
                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width={svgWidth} height={svgHeight} fill="url(#grid)" />

                    {/* Beam rectangle */}
                    <rect
                        x={offsetX}
                        y={offsetY}
                        width={scaledB}
                        height={scaledD}
                        fill="rgba(102, 126, 234, 0.15)"
                        stroke="#667eea"
                        strokeWidth="2"
                        rx="2"
                    />

                    {/* Reinforcement bars at bottom */}
                    {Array.from({ length: numBars }).map((_, i) => (
                        <circle
                            key={i}
                            cx={offsetX + barSpacing * (i + 1)}
                            cy={offsetY + scaledD - 20}
                            r={barRadius}
                            fill="rgba(245, 87, 108, 0.6)"
                            stroke="#f5576c"
                            strokeWidth="1.5"
                        />
                    ))}

                    {/* Dimension lines */}
                    {/* Width dimension */}
                    <line x1={offsetX} y1={offsetY + scaledD + 15} x2={offsetX + scaledB} y2={offsetY + scaledD + 15} stroke="#b4b4d4" strokeWidth="1" markerEnd="url(#arrowhead)" markerStart="url(#arrowheadReverse)" />
                    <text x={offsetX + scaledB / 2} y={offsetY + scaledD + 30} textAnchor="middle" fill="#b4b4d4" fontSize="11" fontFamily="Inter, sans-serif">{b} mm</text>

                    {/* Depth dimension */}
                    <line x1={offsetX + scaledB + 15} y1={offsetY} x2={offsetX + scaledB + 15} y2={offsetY + scaledD} stroke="#b4b4d4" strokeWidth="1" />
                    <text x={offsetX + scaledB + 20} y={offsetY + scaledD / 2} textAnchor="start" fill="#b4b4d4" fontSize="11" fontFamily="Inter, sans-serif" dominantBaseline="middle">{D} mm</text>

                    {/* Arrowheads */}
                    <defs>
                        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                            <polygon points="0 0, 8 3, 0 6" fill="#b4b4d4" />
                        </marker>
                        <marker id="arrowheadReverse" markerWidth="8" markerHeight="6" refX="0" refY="3" orient="auto">
                            <polygon points="8 0, 0 3, 8 6" fill="#b4b4d4" />
                        </marker>
                    </defs>
                </svg>
            </div>
        </div>
    );
};

const ResultDisplay = ({ result, error }) => {
    if (error) {
        return (
            <div className="result-container error-container">
                <div className="error-icon">⚠️</div>
                <h3>Error</h3>
                <p>{error}</p>
            </div>
        );
    }

    if (!result) return null;

    return (
        <div className="result-container is456-result">
            <div className="result-header">
                <div className="result-icon">📊</div>
                <h2>Prediction Results</h2>
            </div>

            <div className="result-main">
                {/* Safety Check */}
                {result.applied_load_kN > 0 && (
                    <div className={`safety-check ${result.is_safe ? 'safe' : 'unsafe'}`}>
                        <div className="safety-icon">{result.is_safe ? '✅' : '❌'}</div>
                        <div className="safety-content">
                            <span className="safety-title">Safety Check</span>
                            <span className="safety-status">
                                {result.is_safe
                                    ? `Beam is SAFE (Applied: ${result.applied_load_kN} kN < Capacity: ${result.maximum_load_capacity_kN} kN)`
                                    : `Beam is UNSAFE (Applied: ${result.applied_load_kN} kN ≥ Capacity: ${result.maximum_load_capacity_kN} kN)`
                                }
                            </span>
                        </div>
                    </div>
                )}

                {/* Main Capacity Cards */}
                <div className="capacity-cards">
                    <div className="capacity-card">
                        <span className="card-label">Ultimate Moment Capacity</span>
                        <span className="card-value">{result.ultimate_moment_capacity_kNm} <span className="card-unit">kN·m</span></span>
                    </div>
                    <div className="capacity-card">
                        <span className="card-label">Design Shear Capacity</span>
                        <span className="card-value">{result.design_shear_capacity_kN} <span className="card-unit">kN</span></span>
                    </div>
                    <div className="capacity-card">
                        <span className="card-label">Maximum Shear Capacity</span>
                        <span className="card-value">{result.maximum_shear_capacity_kN} <span className="card-unit">kN</span></span>
                    </div>
                    <div className="capacity-card">
                        <span className="card-label">Final Shear Capacity</span>
                        <span className="card-value">{result.shear_capacity_kN} <span className="card-unit">kN</span></span>
                    </div>
                    <div className="capacity-card highlight">
                        <span className="card-label">Maximum Load Capacity</span>
                        <span className="card-value">{result.maximum_load_capacity_kN} <span className="card-unit">kN</span></span>
                    </div>
                </div>

                {/* Detailed Results */}
                <div className="detailed-results">
                    <h3>Section Details</h3>
                    <div className="details-grid">
                        <div className="detail-item">
                            <span className="detail-label">Effective Depth (d)</span>
                            <span className="detail-value">{result.effective_depth_mm} mm</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Steel Area (As)</span>
                            <span className="detail-value">{result.steel_area_mm2} mm²</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Steel Ratio (ρ)</span>
                            <span className="detail-value">{result.steel_ratio_rho}</span>
                        </div>
                    </div>
                </div>

                {/* Reinforcement Type & Failure Mode */}
                <div className="status-cards">
                    <div className={`status-card ${result.reinforcement_type.includes('Under') ? 'status-ductile' : 'status-brittle'}`}>
                        <div className="status-card-icon">
                            {result.reinforcement_type.includes('Under') ? '🛡️' : '⚠️'}
                        </div>
                        <div className="status-card-body">
                            <span className="status-card-label">Reinforcement Type</span>
                            <span className="status-card-value">{result.reinforcement_type}</span>
                        </div>
                    </div>
                    <div className={`status-card ${result.failure_mode.includes('Flexural') ? 'status-ductile' : 'status-brittle'}`}>
                        <div className="status-card-icon">
                            {result.failure_mode.includes('Flexural') ? '↕️' : '✂️'}
                        </div>
                        <div className="status-card-body">
                            <span className="status-card-label">Failure Mode</span>
                            <span className="status-card-value">{result.failure_mode}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResultDisplay;
