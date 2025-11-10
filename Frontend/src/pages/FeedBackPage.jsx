// Frontend/src/pages/FeedbackPage.jsx

import React, { useState, useEffect } from 'react';
// Assuming a layout component wraps the content (e.g., OwnerDashboardLayout)
// import OwnerDashboardLayout from '../components/OwnerDashboardLayout'; 
import '../public/css/owner_dashboard.css'; // Use the main owner dashboard styles

const FeedbackPage = () => {
    // 1. State to hold the feedback data
    const [feedbackData, setFeedbackData] = useState([]);
    // 2. State for loading and error handling
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Function to fetch data from the backend
    const fetchFeedback = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // **Replace with your actual backend endpoint**
            const response = await fetch('/api/owner/feedback'); 
            
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

    // Function to handle status update (e.g., from Pending to Resolved)
    const handleStatusUpdate = async (id, newStatus) => {
        try {
            // **Replace with your actual backend endpoint and method**
            const response = await fetch(`/api/owner/feedback/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                throw new Error('Failed to update status');
            }

            // Refetch the data or update state locally after a successful update
            fetchFeedback(); 
        } catch (err) {
            console.error("Error updating status:", err);
            alert("Could not update the feedback status.");
        }
    };

    // Fetch data when the component mounts
    useEffect(() => {
        fetchFeedback();
    }, []); 

    // Helper for rendering content based on state
    const renderContent = () => {
        if (isLoading) return <p>Loading feedback...</p>;
        if (error) return <p style={{ color: 'red' }}>{error}</p>;
        if (feedbackData.length === 0) return <p>No feedback found.</p>;

        return (
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Customer</th>
                        <th>Rating</th>
                        <th>Comment</th>
                        <th>Status</th>
                        <th>Action</th> 
                    </tr>
                </thead>
                <tbody>
                    {feedbackData.map((item) => (
                        <tr key={item.id}>
                            <td>{item.id}</td>
                            <td>{item.customer}</td>
                            <td>{item.rating}</td>
                            <td>{item.comment}</td>
                            <td>
                                <span className={item.status.toLowerCase()}>
                                    {item.status}
                                </span>
                            </td>
                            <td>
                                {/* Example of a button to change status */}
                                {item.status === 'Pending' && (
                                    <button 
                                        onClick={() => handleStatusUpdate(item.id, 'Resolved')}
                                        className="resolve-btn"
                                    >
                                        Resolve
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    return (
        // Wrap the content with your main Owner Dashboard layout/structure
        <div> 
            <h2>Feedback</h2>
            <div className="feedback-table-container">
                {renderContent()}
            </div>
        </div>
    );
};

export default FeedbackPage;