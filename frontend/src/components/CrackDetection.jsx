import React, { useState, useRef, useCallback, useEffect } from 'react';
import { uploadCrackImage, saveCrackResult, listCrackResults, deleteCrackResult } from '../services/supabaseClient';
import axios from 'axios';
import './CrackDetection.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const CRACK_COLORS = {
    'Diagonal Crack': '#ff6b6b',
    'Settlement Crack': '#ffa94d',
    'Temperature Shrinkage Crack': '#69db7c',
    'Vertical Crack': '#74c0fc',
    'No Crack Detected': '#868e96',
    'Unknown Crack Type': '#868e96',
};

function CrackDetection() {
    const [camIP, setCamIP] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [streamURL, setStreamURL] = useState('');
    const [streamStatus, setStreamStatus] = useState('disconnected');

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [error, setError] = useState(null);

    // History
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const fileInputRef = useRef(null);

    // Load history on mount
    useEffect(() => { loadHistory(); }, []);

    const loadHistory = async () => {
        setLoadingHistory(true);
        try {
            const results = await listCrackResults(20);
            setHistory(results);
        } catch (err) {
            console.warn('Failed to load history:', err.message);
        } finally {
            setLoadingHistory(false);
        }
    };

    // === ESP32-CAM Connection ===
    const connectStream = useCallback(() => {
        const ip = camIP.trim();
        if (!ip) { setError('Please enter the ESP32-CAM IP address'); return; }
        setError(null);
        setStreamURL(`${API_BASE_URL}/api/esp32/stream?ip=${encodeURIComponent(ip)}`);
        setIsConnected(true);
        setStreamStatus('live');
    }, [camIP]);

    const disconnectStream = useCallback(() => {
        setStreamURL('');
        setIsConnected(false);
        setStreamStatus('disconnected');
    }, []);

    const handleStreamError = useCallback(() => {
        setStreamStatus('error');
        setError('Stream connection failed — check IP and ensure ESP32-CAM is on the same network');
    }, []);

    // === Capture via backend proxy ===
    const captureFromESP32 = useCallback(async () => {
        if (!isConnected) { setError('Please connect to the camera first'); return; }
        setError(null);
        try {
            const resp = await fetch(`${API_BASE_URL}/api/esp32/capture?ip=${encodeURIComponent(camIP.trim())}`);
            if (!resp.ok) {
                const errData = await resp.json().catch(() => ({}));
                throw new Error(errData.detail || 'Capture failed');
            }
            const blob = await resp.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
                setCapturedImage(reader.result);
                analyzeImage(reader.result.split(',')[1], blob);
            };
            reader.readAsDataURL(blob);
        } catch (err) {
            setError(err.message || 'Failed to capture image from ESP32-CAM');
        }
    }, [isConnected, camIP]);

    // === File upload ===
    const handleFileUpload = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setError(null);
        const reader = new FileReader();
        reader.onloadend = () => {
            setCapturedImage(reader.result);
            analyzeImage(reader.result.split(',')[1], file);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    }, []);

    // === Analyze image ===
    const analyzeImage = async (base64Data, fileOrBlob) => {
        setIsAnalyzing(true);
        setAnalysisResult(null);
        setError(null);

        let uploadResult = null;

        // 1. Upload to Supabase storage
        try {
            uploadResult = await uploadCrackImage(fileOrBlob);
        } catch (err) {
            console.warn('Supabase upload skipped:', err.message);
        }

        // 2. Analyze via backend
        try {
            const response = await axios.post(`${API_BASE_URL}/api/crack-detect`, {
                image_base64: base64Data,
            });
            const result = response.data;
            setAnalysisResult(result);

            // 3. Save result to Supabase DB
            if (uploadResult) {
                try {
                    await saveCrackResult({
                        imageUrl: uploadResult.url,
                        storagePath: uploadResult.path,
                        crackType: result.crack_type,
                        confidence: result.confidence,
                        features: result.features,
                    });
                    loadHistory(); // refresh history
                } catch (err) {
                    console.warn('Save result skipped:', err.message);
                }
            }
        } catch (err) {
            const detail = err.response?.data?.detail || 'Analysis failed. Make sure the backend is running.';
            setError(detail);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // === View history item ===
    const viewHistoryItem = (item) => {
        setCapturedImage(item.image_url);
        setAnalysisResult({
            crack_type: item.crack_type,
            confidence: item.confidence,
            features: {
                mean_area: item.mean_area,
                mean_eccentricity: item.mean_eccentricity,
                mean_major_axis: item.mean_major_axis,
                mean_minor_axis: item.mean_minor_axis,
            },
            processed_image_base64: null,
        });
    };

    // === Delete history item ===
    const handleDelete = async (item) => {
        try {
            await deleteCrackResult(item.id, item.storage_path);
            setHistory((prev) => prev.filter((h) => h.id !== item.id));
        } catch (err) {
            setError(err.message);
        }
    };

    const statusDotClass = `cd-status-dot ${streamStatus === 'live' ? 'cd-live' : streamStatus === 'error' ? 'cd-error' : ''}`;

    return (
        <div className="crack-detection">
            <div className="cd-header">
                <div className="cd-header-content">
                    <div className="cd-logo-section">
                        <span className="cd-logo-icon">🔍</span>
                        <h1 className="cd-title">Crack Detection System</h1>
                    </div>
                    <p className="cd-subtitle">
                        ESP32-CAM based structural crack identification using image processing
                    </p>
                </div>
            </div>

            <div className="cd-grid">
                <div className="cd-left-col">
                    {/* Connection */}
                    <div className="cd-card cd-connection-panel">
                        <h3 className="cd-card-title">
                            <span className="cd-card-icon">📡</span>
                            ESP32-CAM Connection
                        </h3>
                        <div className="cd-connection-form">
                            <div className="cd-input-group">
                                <label>Camera IP Address</label>
                                <input
                                    type="text"
                                    id="esp32-cam-ip"
                                    value={camIP}
                                    onChange={(e) => setCamIP(e.target.value)}
                                    placeholder="e.g. 192.168.1.100"
                                    disabled={isConnected}
                                />
                            </div>
                            <div className="cd-btn-group">
                                {!isConnected ? (
                                    <button id="connect-btn" className="cd-btn cd-btn-connect" onClick={connectStream}>
                                        ⚡ Connect
                                    </button>
                                ) : (
                                    <button id="disconnect-btn" className="cd-btn cd-btn-disconnect" onClick={disconnectStream}>
                                        ✕ Disconnect
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stream */}
                    <div className="cd-card cd-stream-container">
                        <h3 className="cd-card-title">
                            <span className="cd-card-icon">📷</span>
                            Live Stream
                        </h3>
                        <div className="cd-stream-wrapper">
                            {streamURL ? (
                                <img id="esp32-stream" className="cd-stream-img" src={streamURL}
                                    alt="ESP32-CAM Live Stream" onError={handleStreamError} />
                            ) : (
                                <div className="cd-stream-placeholder">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    <p>Enter your ESP32-CAM IP and click Connect</p>
                                </div>
                            )}
                        </div>
                        <div className="cd-status-bar">
                            <div className={statusDotClass}></div>
                            <span className="cd-status-text">
                                {streamStatus === 'live' ? `Live — ${camIP}` :
                                 streamStatus === 'error' ? 'Connection Error' : 'Disconnected'}
                            </span>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="cd-controls-row">
                        <button id="capture-btn" className="cd-btn cd-btn-capture"
                            onClick={captureFromESP32} disabled={!isConnected || isAnalyzing}>
                            📸 Capture & Analyze
                        </button>
                        <button id="upload-btn" className="cd-btn cd-btn-upload"
                            onClick={() => fileInputRef.current?.click()} disabled={isAnalyzing}>
                            📁 Upload Image
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*"
                            onChange={handleFileUpload} style={{ display: 'none' }} />
                    </div>
                </div>

                {/* Right Column */}
                <div className="cd-right-col">
                    {/* Error */}
                    {error && (
                        <div className="cd-card cd-error-card">
                            <span className="cd-error-icon">⚠️</span>
                            <p>{error}</p>
                            <button className="cd-dismiss-btn" onClick={() => setError(null)}>✕</button>
                        </div>
                    )}

                    {/* Loading */}
                    {isAnalyzing && (
                        <div className="cd-card cd-loading-card">
                            <div className="cd-spinner"></div>
                            <p>Analyzing image for cracks...</p>
                            <span className="cd-loading-sub">Processing through morphological pipeline</span>
                        </div>
                    )}

                    {/* Result */}
                    {analysisResult && (
                        <div className="cd-card cd-result-card">
                            <h3 className="cd-card-title">
                                <span className="cd-card-icon">📊</span>
                                Analysis Result
                            </h3>
                            <div className="cd-crack-type-badge" style={{
                                borderColor: CRACK_COLORS[analysisResult.crack_type] || '#868e96',
                                background: `${CRACK_COLORS[analysisResult.crack_type] || '#868e96'}18`,
                            }}>
                                <div className="cd-badge-main">
                                    <span className="cd-badge-dot"
                                        style={{ background: CRACK_COLORS[analysisResult.crack_type] || '#868e96' }}></span>
                                    <span className="cd-badge-type">{analysisResult.crack_type}</span>
                                </div>
                                <div className="cd-badge-confidence">
                                    <span className="cd-confidence-label">Confidence</span>
                                    <span className="cd-confidence-value">
                                        {Math.round(analysisResult.confidence * 100)}%
                                    </span>
                                </div>
                            </div>
                            <div className="cd-images-compare">
                                {capturedImage && (
                                    <div className="cd-image-box">
                                        <span className="cd-image-label">Original</span>
                                        <img src={capturedImage} alt="Original capture" />
                                    </div>
                                )}
                                {analysisResult.processed_image_base64 && (
                                    <div className="cd-image-box">
                                        <span className="cd-image-label">Crack Mask</span>
                                        <img src={`data:image/jpeg;base64,${analysisResult.processed_image_base64}`}
                                            alt="Processed crack mask" />
                                    </div>
                                )}
                            </div>
                            {analysisResult.features && (
                                <div className="cd-features-grid">
                                    <div className="cd-feature-item">
                                        <span className="cd-feature-label">Mean Area</span>
                                        <span className="cd-feature-value">{analysisResult.features.mean_area}</span>
                                    </div>
                                    <div className="cd-feature-item">
                                        <span className="cd-feature-label">Eccentricity</span>
                                        <span className="cd-feature-value">{analysisResult.features.mean_eccentricity}</span>
                                    </div>
                                    <div className="cd-feature-item">
                                        <span className="cd-feature-label">Major Axis</span>
                                        <span className="cd-feature-value">{analysisResult.features.mean_major_axis}</span>
                                    </div>
                                    <div className="cd-feature-item">
                                        <span className="cd-feature-label">Minor Axis</span>
                                        <span className="cd-feature-value">{analysisResult.features.mean_minor_axis}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* History */}
                    <div className="cd-card cd-history-card">
                        <h3 className="cd-card-title">
                            <span className="cd-card-icon">🕒</span>
                            Analysis History
                            <button className="cd-refresh-btn" onClick={loadHistory} disabled={loadingHistory}>
                                {loadingHistory ? '⏳' : '🔄'}
                            </button>
                        </h3>
                        {history.length === 0 ? (
                            <p className="cd-no-history">No analysis results yet. Capture or upload an image to get started.</p>
                        ) : (
                            <div className="cd-history-list">
                                {history.map((item) => (
                                    <div key={item.id} className="cd-history-item"
                                        onClick={() => viewHistoryItem(item)}
                                        style={{ cursor: 'pointer' }}>
                                        <img src={item.image_url} alt={item.crack_type}
                                            className="cd-history-thumb" />
                                        <div className="cd-history-info">
                                            <span className="cd-history-name" style={{
                                                color: CRACK_COLORS[item.crack_type] || '#fff'
                                            }}>
                                                {item.crack_type}
                                            </span>
                                            <span className="cd-history-date">
                                                {Math.round(item.confidence * 100)}% —{' '}
                                                {new Date(item.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <button
                                            className="cd-delete-btn"
                                            onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                                            title="Delete"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CrackDetection;
