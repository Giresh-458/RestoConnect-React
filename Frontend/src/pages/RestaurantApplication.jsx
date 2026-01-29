import { Form, useActionData } from "react-router-dom";
import "./RestaurantApplication.css";
import { useEffect, useState } from "react";

export function RestaurantApplication() {
  const actionData = useActionData();
  const [cuisines, setCuisines] = useState([]);

    useEffect(() => {
        const fetchCuisines = async () => {
            try {
            const res = await fetch(
                "http://localhost:3000/api/customer/restaurants/public-cuisines"
            );
            const data = await res.json();
            setCuisines(data.cuisines || []);
            } catch (err) {
            console.error("Error fetching cuisines", err);
            }
        };
        fetchCuisines();
        }, []);

  return (
    <div className="app-container">
      <div className="app-brand">RESTO CONNECT</div>

      <div className="app-card">
        <h1 className="app-title">Restaurant Owner Registration</h1>
        <p className="app-subtitle">
          Register your restaurant and create your owner account
        </p>

        {actionData?.error && (
          <div className="app-message error-message">{actionData.error}</div>
        )}

        {actionData?.success && (
          <div className="app-message success-message">
            {actionData.message}
          </div>
        )}

        <Form method="post" encType="multipart/form-data" className="app-form">
          <section className="form-section">
            <h2 className="section-title">Owner Information</h2>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="ownerName">Owner's Full Name</label>
                <input
                  type="text"
                  id="ownerName"
                  name="ownerName"
                  placeholder="Amelia Chen"
                  required
                  minLength="2"
                  maxLength="50"
                  pattern="^[A-Za-z][A-Za-z\s]{1,49}$"
                  title="Full name must start with a letter and can only contain letters and spaces"
                />
              </div>
              <div className="form-field">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="amelia.chen@example.com"
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="••••••••"
                required
                minLength="6"
              />
              <small className="field-hint">
                Minimum 8 characters, with at least one uppercase letter, one
                number, and one special character.
              </small>
            </div>
          </section>

          <section className="form-section">
            <h2 className="section-title">Restaurant Details</h2>

            <div className="form-field">
              <label htmlFor="restaurantName">Restaurant Name</label>
              <input
                type="text"
                id="restaurantName"
                name="restaurantName"
                placeholder="The Golden Spoon Bistro"
                required
                minLength="2"
                maxLength="80"
                pattern="^[A-Za-z0-9][A-Za-z0-9\s]{1,79}$"
                title="Restaurant name must start with a letter or number and can only contain letters, numbers, and spaces"
              />
            </div>

            <div className="form-field">
              <label htmlFor="restaurantImage">Restaurant Image</label>
              <input
                type="file"
                id="restaurantImage"
                name="restaurantImage"
                accept="image/jpeg,image/jpg,image/png,image/webp"
              />
              <small className="field-hint">
                Upload an image of your restaurant (JPEG, PNG, or WebP - Max 5MB)
              </small>
            </div>

            <div className="form-field">
              <label htmlFor="address">Restaurant Address</label>
              <div className="form-row">
                <input
                  type="text"
                  id="address"
                  name="address"
                  placeholder="123 Main Street, Building/Area Name"
                  required
                  minLength="5"
                  maxLength="120"
                  style={{ flex: "1", marginRight: "10px" }}
                />
                <select
                  id="location"
                  name="location"
                  required
                  style={{ flex: "0 0 150px" }}
                >
                  <option value="">Select Location</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Tirupati">Tirupati</option>
                </select>
              </div>
              <small className="field-hint">
                Enter street address and select location
              </small>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="contactNumber">Contact Number</label>
                <input
                  type="tel"
                  id="contactNumber"
                  name="contactNumber"
                  placeholder="(555) 123-4567"
                  pattern="[0-9]{10}"
                  maxLength="10"
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="amount">Registration Fee</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  placeholder="1000"
                  min="0"
                  step="0.01"
                  required
                />
                <small className="field-hint">
                  Platform registration fee (in your currency)
                </small>
              </div>
            </div>

            <div className="cuisine-checkboxes">
                {cuisines.map((cuisine) => (
                <label key={cuisine} className="checkbox-item">
                  <input
                  type="checkbox"
                  name="cuisineType"
                  value={cuisine}
                  />
                  <span>{cuisine}</span>
                </label>
              ))}
            </div>

            <div className="form-field">
              <label htmlFor="additionalNotes">Additional Notes</label>
              <textarea
                id="additionalNotes"
                name="additionalNotes"
                rows="4"
                placeholder="Seeking to expand our online presence and streamline reservations through RestoConnect. We value high-quality service and customer satisfaction."
              ></textarea>
              <small className="field-hint">
                Any additional information about your restaurant.
              </small>
            </div>

            <h3 className="section-title" style={{ marginTop: '20px' }}>Operating Hours & Days</h3>
            
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="openingTime">Opening Time</label>
                <input
                  type="time"
                  id="openingTime"
                  name="openingTime"
                  defaultValue="09:00"
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="closingTime">Closing Time</label>
                <input
                  type="time"
                  id="closingTime"
                  name="closingTime"
                  defaultValue="22:00"
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label>Operating Days</label>
              <div className="cuisine-checkboxes">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <label key={day} className="checkbox-item">
                    <input
                      type="checkbox"
                      name="operatingDay"
                      value={day}
                      defaultChecked={day !== 'Sunday'}
                    />
                    <span>{day}</span>
                  </label>
                ))}
              </div>
              <small className="field-hint">Select days when your restaurant is open</small>
            </div>
          </section>

          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => window.history.back()}
            >
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              Submit Application
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}

// Action handler
export async function action({ request }) {
  const formData = await request.formData();

  // Get all checked cuisine types
  const cuisineTypes = formData.getAll("cuisineType");

  const city = formData.get("location")?.trim();
  const address = formData.get("address")?.trim();
  const fullAddress = city ? `${address}, ${city}` : address;

  const restaurantImage = formData.get("restaurantImage");

  // Validation
  if (
    !formData.get("ownerName")?.trim() ||
    !formData.get("email")?.trim() ||
    !formData.get("password")?.trim() ||
    !formData.get("restaurantName")?.trim() ||
    !address ||
    !city ||
    !formData.get("contactNumber")?.trim() ||
    !formData.get("amount")
  ) {
    return { error: "Please fill in all required fields" };
  }

  if (parseFloat(formData.get("amount")) < 0) {
    return { error: "Registration fee must be a positive number" };
  }

  if (cuisineTypes.length === 0) {
    return { error: "Please select at least one cuisine type" };
  }

  if (formData.get("password")?.trim().length < 6) {
    return { error: "Password must be at least 6 characters long" };
  }

  // Validate image file if provided
  if (restaurantImage && restaurantImage.size > 0) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (restaurantImage.size > maxSize) {
      return { error: "Restaurant image must be less than 5MB" };
    }
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(restaurantImage.type)) {
      return { error: "Restaurant image must be JPEG, PNG, or WebP format" };
    }
  }

  try {
    // Create FormData to send multipart/form-data
    const submitFormData = new FormData();
    submitFormData.append("ownerName", formData.get("ownerName")?.trim());
    submitFormData.append("ownerEmail", formData.get("email")?.trim());
    submitFormData.append("password", formData.get("password")?.trim());
    submitFormData.append("restaurantName", formData.get("restaurantName")?.trim());
    submitFormData.append("location", fullAddress);
    submitFormData.append("city", city);
    submitFormData.append("contactNumber", formData.get("contactNumber")?.trim());
    submitFormData.append("amount", parseFloat(formData.get("amount")));
    
    // Append cuisine types individually
    cuisineTypes.forEach((cuisine) => {
      submitFormData.append("cuisineTypes", cuisine);
    });
    
    submitFormData.append(
      "additionalNotes",
      formData.get("additionalNotes")?.trim() || ""
    );
    
    // Append operating hours
    const openingTime = formData.get("openingTime") || "09:00";
    const closingTime = formData.get("closingTime") || "22:00";
    submitFormData.append("openingTime", openingTime);
    submitFormData.append("closingTime", closingTime);

    // Append operating days
    const operatingDays = formData.getAll("operatingDay");
    operatingDays.forEach((day) => {
      submitFormData.append("operatingDays", day);
    });
    
    // Append image if provided
    if (restaurantImage && restaurantImage.size > 0) {
      submitFormData.append("restaurantImage", restaurantImage);
    }

    const response = await fetch("http://localhost:3000/req_res", {
      method: "POST",
      credentials: "include",
      // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
      body: submitFormData,
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        error:
          result.error || "Application submission failed. Please try again.",
      };
    }

    // Show success popup and redirect to login
    alert(
      "✅ " +
        (result.message ||
          "Application submitted successfully! We will review and contact you soon. You can now login.")
    );
    window.location.href = "/login";
    return null;
  } catch (error) {
    console.error("Application error:", error);
    return { error: "Network error. Please try again." };
  }
}
