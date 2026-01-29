import React from 'react';

const ResultDisplay = ({ result, type, error }) => {
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

    if (type === 'nn') {
        return (
            <div className="result-container nn-result">
                <div className="result-header">
                    <div className="result-icon">🤖</div>
                    <h2>Neural Network Prediction</h2>
                </div>
                <div className="result-main">
                    <div className="nn-prediction-card">
                        <div className="nn-icon-wrapper">
                            <span className="nn-icon">⚡</span>
                        </div>
                        <div className="nn-content">
                            <span className="nn-label">Predicted Net Capacity</span>
                            <span className="nn-value">{result.predicted_capacity_kN.toFixed(2)} <span className="nn-unit">kN</span></span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="result-container is456-result">
            <div className="result-header">
                <div className="result-icon">📊</div>
                <h2>IS-456 Calculation Results</h2>
            </div>

            <div className="result-main">
                <div className="capacity-cards">
                    <div className="capacity-card gross">
                        <span className="card-label">Gross Capacity</span>
                        <span className="card-value">{result.Wu_kN_gross.toFixed(2)} kN</span>
                    </div>
                    <div className="capacity-card net">
                        <span className="card-label">Net Capacity</span>
                        <span className="card-value">{result.Wu_kN_net.toFixed(2)} kN</span>
                    </div>
                    <div className="capacity-card mode">
                        <span className="card-label">Failure Mode</span>
                        <span className="card-value mode-badge">{result.mode}</span>
                    </div>
                </div>

                <div className="detailed-results">
                    <h3>Detailed Analysis</h3>
                    <div className="details-grid">
                        <div className="detail-item">
                            <span className="detail-label">Flexural Moment (Mu)</span>
                            <span className="detail-value">{result.Mu_kNm.toFixed(2)} kN·m</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Shear Capacity (Vu)</span>
                            <span className="detail-value">{result.Vu_kN.toFixed(2)} kN</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Effective Depth (d)</span>
                            <span className="detail-value">{result.d_mm.toFixed(1)} mm</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Steel Ratio (pₜ)</span>
                            <span className="detail-value">{result.pt_percent.toFixed(2)}%</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Shear Stress (τv)</span>
                            <span className="detail-value">{result.tau_v.toFixed(3)} MPa</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Concrete Shear (τc)</span>
                            <span className="detail-value">{result.tau_c.toFixed(3)} MPa</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Max Shear (τc,max)</span>
                            <span className="detail-value">{result.tau_c_max.toFixed(2)} MPa</span>
                        </div>
                    </div>
                </div>

                {result.warnings && result.warnings.length > 0 && (
                    <div className="warnings-section">
                        <h3>⚠️ Warnings</h3>
                        {result.warnings.map((warning, index) => (
                            <div key={index} className="warning-item">
                                {warning}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResultDisplay;
