import React, { useState, useRef, useEffect } from 'react';

const loadingOptions = [
    { value: 'Single Point Load', label: 'Single Point Load', icon: '↓', desc: 'Concentrated load at midspan' },
    { value: 'Two Point Load', label: 'Two Point Load', icon: '⇊', desc: 'Two equal loads at third points' }
];

const CustomDropdown = ({ value, onChange, options }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selected = options.find(o => o.value === value) || options[0];

    return (
        <div className={`custom-dropdown ${isOpen ? 'open' : ''}`} ref={dropdownRef}>
            <button
                type="button"
                className="dropdown-trigger"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="dropdown-trigger-content">
                    <span className="dropdown-icon">{selected.icon}</span>
                    <span className="dropdown-selected-text">{selected.label}</span>
                </span>
                <svg className={`dropdown-chevron ${isOpen ? 'rotated' : ''}`} width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
            {isOpen && (
                <div className="dropdown-menu">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            className={`dropdown-option ${option.value === value ? 'active' : ''}`}
                            onClick={() => { onChange(option.value); setIsOpen(false); }}
                        >
                            <span className="dropdown-option-icon">{option.icon}</span>
                            <span className="dropdown-option-content">
                                <span className="dropdown-option-label">{option.label}</span>
                                <span className="dropdown-option-desc">{option.desc}</span>
                            </span>
                            {option.value === value && (
                                <svg className="dropdown-check" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M3.5 8.5L6 11L12.5 4.5" stroke="#667eea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const InputForm = ({ onPredict, loading }) => {
    const [formData, setFormData] = useState({
        fck: 25.0,
        fy: 415.0,
        b: 200.0,
        D: 450.0,
        L: 4000.0,
        loading_type: 'Single Point Load',
        num_bars: 2,
        main_dia: 20.0,
        stirrup_dia: 8.0,
        stirrup_spacing: 150.0,
        cover: 30.0,
        custom_d: null,
        applied_load: 0.0
    });

    const [useCustomD, setUseCustomD] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'loading_type' ? value : Number(value)
        }));
    };

    const handleLoadingTypeChange = (value) => {
        setFormData(prev => ({ ...prev, loading_type: value }));
    };

    const handleCustomDToggle = (e) => {
        const checked = e.target.checked;
        setUseCustomD(checked);
        if (!checked) {
            setFormData(prev => ({ ...prev, custom_d: null }));
        } else {
            setFormData(prev => ({ ...prev, custom_d: 400.0 }));
        }
    };

    const handleCustomDChange = (e) => {
        setFormData(prev => ({ ...prev, custom_d: Number(e.target.value) }));
    };

    const handleSubmit = () => {
        onPredict(formData);
    };

    return (
        <div className="input-form">
            <div className="form-section">
                <h2 className="section-title">Material Properties</h2>
                <div className="input-grid">
                    <div className="input-group">
                        <label htmlFor="fck">Concrete Strength fck (MPa)</label>
                        <input
                            type="number"
                            id="fck"
                            name="fck"
                            value={formData.fck}
                            onChange={handleChange}
                            step="5"
                            className="input-field"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="fy">Steel Yield Strength fy (MPa)</label>
                        <input
                            type="number"
                            id="fy"
                            name="fy"
                            value={formData.fy}
                            onChange={handleChange}
                            step="5"
                            className="input-field"
                        />
                    </div>
                </div>
            </div>

            <div className="form-section">
                <h2 className="section-title">Beam Geometry</h2>
                <div className="input-grid grid-3-col">
                    <div className="input-group">
                        <label htmlFor="b">Beam Width b (mm)</label>
                        <input
                            type="number"
                            id="b"
                            name="b"
                            value={formData.b}
                            onChange={handleChange}
                            className="input-field"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="D">Overall Depth D (mm)</label>
                        <input
                            type="number"
                            id="D"
                            name="D"
                            value={formData.D}
                            onChange={handleChange}
                            className="input-field"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="L">Span Length L (mm)</label>
                        <input
                            type="number"
                            id="L"
                            name="L"
                            value={formData.L}
                            onChange={handleChange}
                            className="input-field"
                        />
                    </div>
                </div>

                <div className="input-group dropdown-constrained" style={{ marginTop: 'var(--spacing-md)' }}>
                    <label>Loading Type</label>
                    <CustomDropdown
                        value={formData.loading_type}
                        onChange={handleLoadingTypeChange}
                        options={loadingOptions}
                    />
                </div>
            </div>

            <div className="form-section">
                <h2 className="section-title">Reinforcement Details</h2>
                <div className="input-grid">
                    <div className="input-group">
                        <label htmlFor="num_bars">Number of Main Bars</label>
                        <input
                            type="number"
                            id="num_bars"
                            name="num_bars"
                            value={formData.num_bars}
                            onChange={handleChange}
                            min="1"
                            className="input-field"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="main_dia">Main Bar Diameter (mm)</label>
                        <input
                            type="number"
                            id="main_dia"
                            name="main_dia"
                            value={formData.main_dia}
                            onChange={handleChange}
                            className="input-field"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="stirrup_dia">Stirrup Diameter (mm)</label>
                        <input
                            type="number"
                            id="stirrup_dia"
                            name="stirrup_dia"
                            value={formData.stirrup_dia}
                            onChange={handleChange}
                            className="input-field"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="stirrup_spacing">Stirrup Spacing (mm)</label>
                        <input
                            type="number"
                            id="stirrup_spacing"
                            name="stirrup_spacing"
                            value={formData.stirrup_spacing}
                            onChange={handleChange}
                            className="input-field"
                        />
                    </div>
                </div>
            </div>

            <div className="form-section">
                <h2 className="section-title">Additional Parameters</h2>
                <div className="input-grid">
                    <div className="input-group">
                        <label htmlFor="cover">Concrete Cover (mm)</label>
                        <input
                            type="number"
                            id="cover"
                            name="cover"
                            value={formData.cover}
                            onChange={handleChange}
                            className="input-field"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="applied_load">Applied Load (kN)</label>
                        <input
                            type="number"
                            id="applied_load"
                            name="applied_load"
                            value={formData.applied_load}
                            onChange={handleChange}
                            min="0"
                            className="input-field"
                        />
                    </div>
                </div>

                <div className="checkbox-row">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={useCustomD}
                            onChange={handleCustomDToggle}
                            className="checkbox-input"
                        />
                        <span className="checkbox-text">Use custom effective depth (dataset validation)</span>
                    </label>
                </div>

                {useCustomD && (
                    <div className="input-grid" style={{ marginTop: '1rem' }}>
                        <div className="input-group">
                            <label htmlFor="custom_d">Effective Depth (mm)</label>
                            <input
                                type="number"
                                id="custom_d"
                                name="custom_d"
                                value={formData.custom_d || 400}
                                onChange={handleCustomDChange}
                                className="input-field"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="button-group">
                <button
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? 'Calculating...' : 'Predict Beam Capacity'}
                </button>
            </div>
        </div>
    );
};

export default InputForm;
