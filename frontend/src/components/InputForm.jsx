import React, { useState } from 'react';

const InputForm = ({ onCalculate, onPredict, loading }) => {
    const [formData, setFormData] = useState({
        fck: 25,
        fy: 415,
        b: 230,
        D: 450,
        L: 4000,
        load_type: 'Point Load',
        main_dia: 16,
        main_count: 2,
        stirrup_dia: 8,
        spacing: 150
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'load_type' ? value : Number(value)
        }));
    };

    const handleSubmit = (type) => {
        if (type === 'is456') {
            onCalculate(formData);
        } else {
            onPredict(formData);
        }
    };

    return (
        <div className="input-form">
            <div className="form-section">
                <h2 className="section-title">Material Properties</h2>
                <div className="input-grid">
                    <div className="input-group">
                        <label htmlFor="fck">Concrete Grade (fck) MPa</label>
                        <select
                            id="fck"
                            name="fck"
                            value={formData.fck}
                            onChange={handleChange}
                            className="input-field"
                        >
                            <option value={20}>20</option>
                            <option value={25}>25</option>
                            <option value={30}>30</option>
                            <option value={35}>35</option>
                            <option value={40}>40</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label htmlFor="fy">Steel Grade (fy) MPa</label>
                        <select
                            id="fy"
                            name="fy"
                            value={formData.fy}
                            onChange={handleChange}
                            className="input-field"
                        >
                            <option value={415}>415</option>
                            <option value={500}>500</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="form-section">
                <h2 className="section-title">Beam Dimensions</h2>
                <div className="input-grid">
                    <div className="input-group">
                        <label htmlFor="b">Width (b) mm</label>
                        <input
                            type="number"
                            id="b"
                            name="b"
                            value={formData.b}
                            onChange={handleChange}
                            min="150"
                            max="1000"
                            className="input-field"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="D">Overall Depth (D) mm</label>
                        <input
                            type="number"
                            id="D"
                            name="D"
                            value={formData.D}
                            onChange={handleChange}
                            min="200"
                            max="1000"
                            className="input-field"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="L">Length (L) mm</label>
                        <input
                            type="number"
                            id="L"
                            name="L"
                            value={formData.L}
                            onChange={handleChange}
                            min="500"
                            max="10000"
                            className="input-field"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="load_type">Load Type</label>
                        <select
                            id="load_type"
                            name="load_type"
                            value={formData.load_type}
                            onChange={handleChange}
                            className="input-field"
                        >
                            <option value="Point Load">Point Load</option>
                            <option value="Two Point Load">Two Point Load</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="form-section">
                <h2 className="section-title">Reinforcement Details</h2>
                <div className="input-grid">
                    <div className="input-group">
                        <label htmlFor="main_dia">Main Bar Diameter mm</label>
                        <input
                            type="number"
                            id="main_dia"
                            name="main_dia"
                            value={formData.main_dia}
                            onChange={handleChange}
                            min="8"
                            max="32"
                            className="input-field"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="main_count">Number of Main Bars</label>
                        <input
                            type="number"
                            id="main_count"
                            name="main_count"
                            value={formData.main_count}
                            onChange={handleChange}
                            min="1"
                            max="8"
                            className="input-field"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="stirrup_dia">Stirrup Diameter mm</label>
                        <input
                            type="number"
                            id="stirrup_dia"
                            name="stirrup_dia"
                            value={formData.stirrup_dia}
                            onChange={handleChange}
                            min="6"
                            max="12"
                            className="input-field"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="spacing">Stirrup Spacing mm</label>
                        <input
                            type="number"
                            id="spacing"
                            name="spacing"
                            value={formData.spacing}
                            onChange={handleChange}
                            min="80"
                            max="300"
                            className="input-field"
                        />
                    </div>
                </div>
            </div>

            <div className="button-group">
                <button
                    className="btn btn-primary"
                    onClick={() => handleSubmit('is456')}
                    disabled={loading}
                >
                    {loading ? 'Calculating...' : 'Calculate using IS-456'}
                </button>
                <button
                    className="btn btn-secondary"
                    onClick={() => handleSubmit('nn')}
                    disabled={loading}
                >
                    {loading ? 'Predicting...' : 'Predict using Neural Network'}
                </button>
            </div>
        </div>
    );
};

export default InputForm;
