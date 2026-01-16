import { useState, useRef } from 'react';
import { Form, useActionData, useNavigate, useSearchParams } from 'react-router-dom';
import './AuthPage.css';

export function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [profilePreview, setProfilePreview] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);
    const actionData = useActionData();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const message = searchParams.get('message');

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setProfilePreview(null);
        setSelectedFile(null);
    };

    const handleProfilePicClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }
            // Validate file size (2MB max)
            if (file.size > 2 * 1024 * 1024) {
                alert('File size must be less than 2MB');
                return;
            }

            setSelectedFile(file);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-brand">RESTO CONNECT</div>
            <div className="auth-card">
                <div className="auth-header">
                    {isLogin ? (
                        <>
                            <h1>Welcome to<br />RestoConnect</h1>
                            <p>Sign in to manage your restaurant or explore new<br />culinary experiences.</p>
                        </>
                    ) : (
                        <>
                            <div className="signup-icon">👤</div>
                            <h1>Join RestoConnect Today</h1>
                            <p>Create your customer account to explore and enjoy<br />amazing restaurant experiences.</p>
                        </>
                    )}
                </div>

                {message && (
                    <div className="auth-message info-message">
                        {message}
                    </div>
                )}

                {actionData?.error && (
                    <div className="auth-message error-message">
                        {actionData.error}
                    </div>
                )}

                {actionData?.success && (
                    <div className="auth-message success-message">
                        {actionData.message}
                    </div>
                )}

                <Form method="post" className="auth-form" encType="multipart/form-data">
                    <input type="hidden" name="authType" value={isLogin ? 'login' : 'signup'} />
                    
                    {!isLogin && (
                        <>
                            <div className="profile-upload">
                                <div className="profile-avatar" onClick={handleProfilePicClick} style={{ cursor: 'pointer' }}>
                                    {profilePreview ? (
                                        <img src={profilePreview} alt="Profile preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                    ) : (
                                        <span>👤</span>
                                    )}
                                </div>
                                <button type="button" className="upload-btn" onClick={handleProfilePicClick}>
                                    {selectedFile ? '✓ Image selected' : '📷 Upload Profile Picture'}
                                </button>
                            </div>
                            <input 
                                ref={fileInputRef}
                                type="file" 
                                name="profilePicture" 
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                        </>
                    )}

                    {!isLogin && (
                        <div className="form-group">
                            <label htmlFor="fullName">Full Name</label>
                            <div className="input-wrapper">
                                <span className="input-icon">👤</span>
                                <input 
                                    type="text" 
                                    id="fullName" 
                                    name="fullName" 
                                    placeholder="John Doe"
                                    minLength="2"
                                    maxLength="50"
                                    required={!isLogin}
                                    pattern="^[A-Za-z][A-Za-z\s]{1,49}$"
                                    title="Full name must start with a letter and can only contain letters and spaces"
                                />
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="username">{isLogin ? 'Email or Username' : 'Username'}</label>
                        <div className="input-wrapper">
                            <span className="input-icon">{isLogin ? '📧' : '👤'}</span>
                            <input 
                                type="text" 
                                id="username" 
                                name="username" 
                                placeholder={isLogin ? "Enter your email or username" : "Enter your username"}
                                pattern={isLogin ? undefined : "[a-zA-Z0-9_]{3,20}"}
                                minLength={isLogin ? undefined : "3"}
                                maxLength={isLogin ? undefined : "20"}
                                required
                                title={isLogin ? undefined : "Username: 3-20 characters, letters, numbers, and underscores only"}
                            />
                        </div>
                    </div>

                    {!isLogin && (
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <div className="input-wrapper">
                                <span className="input-icon">📧</span>
                                <input 
                                    type="email" 
                                    id="email" 
                                    name="email" 
                                    placeholder="email@example.com"
                                    required={!isLogin}
                                    title="Please enter a valid email address"
                                />
                            </div>
                        </div>
                    )}

                    {!isLogin && (
                        <div className="form-group">
                            <label htmlFor="mobile">Phone Number</label>
                            <div className="input-wrapper">
                                <span className="input-icon">📞</span>
                                <input 
                                    type="tel" 
                                    id="mobile" 
                                    name="mobile" 
                                    placeholder="+1 (555) 123-4567"
                                    pattern="[0-9]{10}"
                                    maxLength="10"
                                    title="Mobile number must be 10 digits"
                                />
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="input-wrapper">
                            <span className="input-icon">🔒</span>
                            <input 
                                type={showPassword ? "text" : "password"}
                                id="password" 
                                name="password" 
                                placeholder="Enter your password"
                                minLength="6"
                                maxLength="50"
                                required
                                title="Password must be at least 6 characters"
                            />
                            <button 
                                type="button" 
                                className="toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                    </div>

                    {!isLogin && (
                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <div className="input-wrapper">
                                <span className="input-icon">🔒</span>
                                <input 
                                    type={showConfirmPassword ? "text" : "password"}
                                    id="confirmPassword" 
                                    name="confirmPassword" 
                                    placeholder="Confirm your password"
                                    minLength="6"
                                    maxLength="50"
                                    required={!isLogin}
                                    title="Password must match"
                                />
                                <button 
                                    type="button" 
                                    className="toggle-password"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                        </div>
                    )}

                    <button type="submit" className="auth-button">
                        {isLogin ? 'Login to RestoConnect' : 'Register'}
                    </button>
                </Form>

                <div className="auth-toggle">
                    <p>
                        {isLogin ? "New user? " : "Already have an account? "}
                        <button type="button" onClick={toggleMode} className="toggle-button">
                            {isLogin ? 'Register here' : 'Login here'}
                        </button>
                    </p>
                </div>

                {isLogin && (
                    <button type="button" className="add-restaurant-btn" onClick={() => navigate('/restaurant-application')}>
                        Add Your Restaurant
                    </button>
                )}
            </div>
        </div>
    );
}

// Validation helper functions
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validateUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
};

const validatePassword = (password) => {
    return password && password.length >= 6;
};

const validateMobile = (mobile) => {
    if (!mobile || mobile.trim() === '') return true;
    const mobileRegex = /^[0-9]{10}$/;
    return mobileRegex.test(mobile.replace(/\s+/g, ''));
};

const validateFullName = (name) => {
    if (!name) return false;
    const trimmedName = name.trim();
    // Must start with a letter; then allow only letters and spaces (no symbols)
    const fullNameRegex = /^[A-Za-z][A-Za-z\s]{1,49}$/;
    return fullNameRegex.test(trimmedName);
};

// Action handler for form submission
export async function action({ request }) {
    const formData = await request.formData();
    const authType = formData.get('authType');
    let username = formData.get('username')?.trim();
    let password = formData.get('password')?.trim();

    if (authType === 'login') {
        // Frontend validation for login
        if (!username || !password) {
            return { error: 'Username and password are required' };
        }

        if (password.length < 6) {
            return { error: 'Password must be at least 6 characters' };
        }

        // Login logic
        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (!result.valid) {
                return { error: result.error || 'Login failed. Please try again.' };
            }

            // Redirect based on role
            window.location.href = `/${result.role}/`;
            return null;

        } catch (error) {
            console.error('Login error:', error);
            return { error: 'Network error. Please try again.' };
        }

    } else {
        // Signup logic (Customer only)
        let email = formData.get('email')?.trim().toLowerCase();
        let fullName = formData.get('fullName')?.trim();
        let mobile = formData.get('mobile')?.trim();
        let confirmPassword = formData.get('confirmPassword')?.trim();
        const role = 'customer'; // Signup is for customers only

        // Frontend validation for signup
        if (!username || !email || !password || !fullName) {
            return { error: 'All required fields must be filled' };
        }

        if (!validateUsername(username)) {
            return { error: 'Username must be 3-20 characters (letters, numbers, underscores only)' };
        }

        if (!validateEmail(email)) {
            return { error: 'Please enter a valid email address' };
        }

        if (!validatePassword(password)) {
            return { error: 'Password must be at least 6 characters long' };
        }

        if (!validateFullName(fullName)) {
            return { error: 'Please enter a valid full name (at least 2 characters)' };
        }

        if (mobile && !validateMobile(mobile)) {
            return { error: 'Mobile number must be 10 digits' };
        }

        // Validate passwords match
        if (password !== confirmPassword) {
            return { error: 'Passwords do not match' };
        }

        try {
            // Create FormData to handle file upload
            const signupFormData = new FormData();
            signupFormData.append('username', username);
            signupFormData.append('email', email);
            signupFormData.append('password', password);
            signupFormData.append('fullName', fullName);
            signupFormData.append('mobile', mobile);
            signupFormData.append('role', role);

            // Add profile picture if selected
            const profileFile = formData.get('profilePicture');
            if (profileFile && profileFile.size > 0) {
                signupFormData.append('profilePicture', profileFile);
            }

            const response = await fetch('http://localhost:3000/api/auth/signup', {
                method: 'POST',
                credentials: 'include',
                body: signupFormData
            });

            const result = await response.json();

            if (!result.success) {
                return { error: result.error || 'Signup failed. Please try again.' };
            }

            // Show success popup and redirect to login
            alert('✅ ' + (result.message || 'Account created successfully! Please login.'));
            window.location.href = '/login';
            return null;

        } catch (error) {
            console.error('Signup error:', error);
            return { error: 'Network error. Please try again.' };
        }
    }
}
