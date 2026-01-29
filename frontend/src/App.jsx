import React, { useState } from 'react';
import Header from './components/Header';
import InputForm from './components/InputForm';
import ResultDisplay from './components/ResultDisplay';
import { calculateIS456, predictNN } from './services/api';
import './index.css';

function App() {
    const [result, setResult] = useState(null);
    const [resultType, setResultType] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleCalculate = async (formData) => {
        setLoading(true);
        setError(null);
        try {
            const data = await calculateIS456(formData);
            setResult(data);
            setResultType('is456');
        } catch (err) {
            setError(err);
            setResult(null);
        } finally {
            setLoading(false);
        }
    };

    const handlePredict = async (formData) => {
        setLoading(true);
        setError(null);
        try {
            const data = await predictNN(formData);
            setResult(data);
            setResultType('nn');
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
                        onCalculate={handleCalculate}
                        onPredict={handlePredict}
                        loading={loading}
                    />
                    <ResultDisplay
                        result={result}
                        type={resultType}
                        error={error}
                    />
                </div>
            </div>
        </div>
    );
}

export default App;
