import React, { useState } from 'react';
import Header from './components/Header';
import InputForm from './components/InputForm';
import ResultDisplay from './components/ResultDisplay';
import { predictBeamCapacity } from './services/api';
import './index.css';

function App() {
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
            <div className="container">
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
            </div>
        </div>
    );
}

export default App;
