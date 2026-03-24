import React from 'react';

const Header = () => {
    return (
        <header className="header">
            <div className="header-content">
                <div className="logo-section">
                    <div className="logo-icon">🏗️</div>
                    <h1 className="title">IS 456 Beam Capacity Predictor</h1>
                </div>
                <p className="subtitle">Predict RC Beam Bearing Capacity using IS-456 Code Provisions</p>
            </div>
        </header>
    );
};

export default Header;
