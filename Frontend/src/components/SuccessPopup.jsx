import { useEffect } from 'react';
import './SuccessPopup.css';

export function SuccessPopup({ message, onClose }) {
    useEffect(() => {
        // Auto-close and redirect after 2 seconds
        const timer = setTimeout(() => {
            onClose();
        }, 2000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="popup-overlay">
            <div className="popup-card">
                <div className="popup-icon">✅</div>
                <h2 className="popup-title">Success!</h2>
                <p className="popup-message">{message}</p>
                <div className="popup-loader">
                    <div className="loader-bar"></div>
                </div>
                <p className="popup-redirect">Redirecting to login...</p>
            </div>
        </div>
    );
}
