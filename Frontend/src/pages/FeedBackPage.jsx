import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/owner_dashboard.css';
import styles from './FeedBackPage.module.css';

export function FeedBackPage() {
    const location = useLocation();
    const isOwnerView = location.pathname.includes('/owner/feedback');
    const isCustomerView = location.pathname.includes('/customer/feedback');

    // Customer state
    const [customerData, setCustomerData] = useState(null);
    const [formData, setFormData] = useState({
        rest_id: '',
        diningRating: '',
        orderRating: '',
        lovedItems: '',
        additionalFeedback: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Owner state
    const [feedbackData, setFeedbackData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch customer data
    useEffect(() => {
        if (isCustomerView) {
            fetchCustomerData();
        }
    }, [isCustomerView]);

    // Fetch owner feedback data
    useEffect(() => {
        if (isOwnerView) {
            fetchOwnerFeedback();
        }
    }, [isOwnerView]);

    const fetchCustomerData = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/customer/feedback', {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            setCustomerData(data);
        } catch (err) {
            console.error("Error fetching customer data:", err);
            setError("Failed to load data.");
        }
    };

    const fetchOwnerFeedback = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:3000/api/owner/feedback', {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            setFeedbackData(data);
        } catch (err) {
            console.error("Error fetching feedback:", err);
            setError("Failed to load feedback data.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(false);

        try {
            const response = await fetch('http://localhost:3000/api/customer/submit-feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to submit feedback');
            }

            setSubmitSuccess(true);
            setFormData({
                rest_id: '',
                diningRating: '',
                orderRating: '',
                lovedItems: '',
                additionalFeedback: ''
            });
            
            // Refresh customer data to show new feedback
            setTimeout(() => {
                fetchCustomerData();
                setSubmitSuccess(false);
            }, 2000);
        } catch (err) {
            console.error("Error submitting feedback:", err);
            setSubmitError(err.message || "Could not submit feedback. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            const response = await fetch(`http://localhost:3000/api/owner/feedback/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                throw new Error('Failed to update status');
            }

            // Refresh feedback list
            fetchOwnerFeedback();
        } catch (err) {
            console.error("Error updating status:", err);
            alert("Could not update the feedback status.");
        }
    };

    // Customer View - Feedback Form
    if (isCustomerView) {
        return (
            <div className={styles.feedbackContainer}>
                <h2 className={styles.title}>Share Your Feedback</h2>
                
                {submitSuccess && (
                    <div className={styles.successMessage}>
                        ✅ Feedback submitted successfully! Thank you for your input.
                    </div>
                )}

                {submitError && (
                    <div className={styles.errorMessage}>
                        ❌ {submitError}
                    </div>
                )}

                <form onSubmit={handleSubmit} className={styles.feedbackForm}>
                    <div className={styles.formGroup}>
                        <label htmlFor="rest_id">Select Restaurant *</label>
                        <select
                            id="rest_id"
                            value={formData.rest_id}
                            onChange={(e) => setFormData({ ...formData, rest_id: e.target.value })}
                            required
                        >
                            <option value="">-- Select a restaurant --</option>
                            {customerData?.restaurants?.map((rest) => (
                                <option key={rest.id} value={rest.id}>
                                    {rest.name}
                                </option>
                            ))}
                        </select>
                        {!customerData?.restaurants?.length && (
                            <p className={styles.helpText}>
                                No restaurants found. Please place an order first.
                            </p>
                        )}
                    </div>

                    <div className={styles.ratingGroup}>
                        <div className={styles.formGroup}>
                            <label htmlFor="diningRating">Dining Experience Rating (1-5)</label>
                            <select
                                id="diningRating"
                                value={formData.diningRating}
                                onChange={(e) => setFormData({ ...formData, diningRating: e.target.value })}
                            >
                                <option value="">Not rated</option>
                                {[1, 2, 3, 4, 5].map(num => (
                                    <option key={num} value={num}>{num} ⭐</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="orderRating">Order Quality Rating (1-5)</label>
                            <select
                                id="orderRating"
                                value={formData.orderRating}
                                onChange={(e) => setFormData({ ...formData, orderRating: e.target.value })}
                            >
                                <option value="">Not rated</option>
                                {[1, 2, 3, 4, 5].map(num => (
                                    <option key={num} value={num}>{num} ⭐</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="lovedItems">Loved Items</label>
                        <input
                            type="text"
                            id="lovedItems"
                            value={formData.lovedItems}
                            onChange={(e) => setFormData({ ...formData, lovedItems: e.target.value })}
                            placeholder="e.g., Paneer Tikka, Biryani"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="additionalFeedback">Additional Feedback</label>
                        <textarea
                            id="additionalFeedback"
                            value={formData.additionalFeedback}
                            onChange={(e) => setFormData({ ...formData, additionalFeedback: e.target.value })}
                            placeholder="Share your thoughts, suggestions, or any other feedback..."
                            rows="5"
                        />
                    </div>

                    <button 
                        type="submit" 
                        className={styles.submitButton}
                        disabled={submitting || !formData.rest_id}
                    >
                        {submitting ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                </form>

                {/* Show past feedback */}
                {customerData?.feedbacks?.length > 0 && (
                    <div className={styles.pastFeedback}>
                        <h3>Your Past Feedback</h3>
                        <div className={styles.feedbackList}>
                            {customerData.feedbacks.map((fb) => (
                                <div key={fb.id} className={styles.feedbackItem}>
                                    <div className={styles.feedbackHeader}>
                                        <span className={styles.feedbackDate}>
                                            {new Date(fb.createdAt).toLocaleDateString()}
                                        </span>
                                        <span className={`${styles.status} ${styles[fb.status.toLowerCase()]}`}>
                                            {fb.status}
                                        </span>
                                    </div>
                                    {(fb.diningRating || fb.orderRating) && (
                                        <div className={styles.ratings}>
                                            {fb.diningRating && <span>Dining: {fb.diningRating}⭐</span>}
                                            {fb.orderRating && <span>Order: {fb.orderRating}⭐</span>}
                                        </div>
                                    )}
                                    {fb.lovedItems && (
                                        <p className={styles.lovedItems}>Loved: {fb.lovedItems}</p>
                                    )}
                                    {fb.additionalFeedback && (
                                        <p className={styles.comment}>{fb.additionalFeedback}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Owner View - Feedback Table
    if (isOwnerView) {
        const renderContent = () => {
            if (isLoading) return <p className={styles.loading}>Loading feedback...</p>;
            if (error) return <p className={styles.error}>{error}</p>;
            if (feedbackData.length === 0) return <p className={styles.noData}>No feedback found.</p>;

            return (
                <div className={styles.tableContainer}>
                    <table className={styles.feedbackTable}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Customer</th>
                                <th>Dining Rating</th>
                                <th>Order Rating</th>
                                <th>Loved Items</th>
                                <th>Comment</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {feedbackData.map((item) => {
                                // Handle both old format (rating as number) and new format (rating as object)
                                const diningRating = typeof item.rating === 'object' 
                                    ? item.rating?.dining 
                                    : (item.rating && typeof item.rating === 'number' ? null : item.rating);
                                const orderRating = typeof item.rating === 'object' 
                                    ? item.rating?.order 
                                    : null;
                                
                                return (
                                    <tr key={item.id}>
                                        <td>{item.id.substring(0, 8)}...</td>
                                        <td>{item.customer}</td>
                                        <td>{diningRating ? `${diningRating}⭐` : 'N/A'}</td>
                                        <td>{orderRating ? `${orderRating}⭐` : 'N/A'}</td>
                                        <td>{item.lovedItems || '-'}</td>
                                        <td className={styles.commentCell}>
                                            {item.comment || 'No comment'}
                                        </td>
                                        <td>
                                            <span className={`${styles.status} ${styles[item.status?.toLowerCase()]}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td>{item.date ? new Date(item.date).toLocaleDateString() : '-'}</td>
                                        <td>
                                            {item.status === 'Pending' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(item.id, 'Resolved')}
                                                    className={styles.resolveButton}
                                                >
                                                    Resolve
                                                </button>
                                            )}
                                            {item.status === 'Resolved' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(item.id, 'Pending')}
                                                    className={styles.pendingButton}
                                                >
                                                    Mark Pending
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            );
        };

        return (
            <div className={styles.feedbackContainer}>
                <h2 className={styles.title}>Customer Feedback</h2>
                {renderContent()}
            </div>
        );
    }

    return <div>Invalid route</div>;
}
