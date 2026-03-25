import React, { useState } from 'react';
import Header from './components/Header';
import InputForm from './components/InputForm';
import ResultDisplay from './components/ResultDisplay';
import CrackDetection from './components/CrackDetection';
import { predictBeamCapacity } from './services/api';
import './index.css';

function App() {
    const [activePage, setActivePage] = useState('beam'); // 'beam' | 'crack'
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handlePredict = async (formData) => {
        setLoading(true);
        setError(null);
        try {
            const data = await predictBeamCapacity(formData);
            setResult(data);
        } catch (err) {
            setError(err);
            setResult(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app">
            <div className="background-gradient"></div>

            {/* Navigation Bar */}
            <nav className="app-nav">
                <div className="app-nav-inner">
                    <span className="app-nav-brand">RC Beam Tools</span>
                    <div className="app-nav-tabs">
                        <button
                            id="nav-beam-calculator"
                            className={`app-nav-tab ${activePage === 'beam' ? 'active' : ''}`}
                            onClick={() => setActivePage('beam')}
                        >
                            <span className="nav-tab-icon">🏗️</span>
                            Beam Calculator
                        </button>
                        <button
                            id="nav-crack-detection"
                            className={`app-nav-tab ${activePage === 'crack' ? 'active' : ''}`}
                            onClick={() => setActivePage('crack')}
                        >
                            <span className="nav-tab-icon">🔍</span>
                            Crack Detection
                        </button>
                    </div>
                </div>
            </nav>

            <div className="container">
                {activePage === 'beam' ? (
                    <>
                        <Header />
                        <div className="content-wrapper">
                            <InputForm
                                onPredict={handlePredict}
                                loading={loading}
                            />
                            <ResultDisplay
                                result={result}
                                error={error}
                            />
                        </div>
                    </>
                ) : (
                    <CrackDetection />
                )}
            </div>
        </div>
    );
}

export default App;
