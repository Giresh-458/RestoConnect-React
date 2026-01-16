import { Form, useActionData } from "react-router-dom";
import "./RestaurantApplication.css";

export function RestaurantApplication() {
  const actionData = useActionData();

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

        <Form method="post" className="app-form">
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

            <div className="form-field">
              <label>Cuisine Types (Select all that apply)</label>
              <div className="cuisine-checkboxes">
                <label className="checkbox-item">
                  <input type="checkbox" name="cuisineType" value="italian" />
                  <span>Italian</span>
                </label>
                <label className="checkbox-item">
                  <input type="checkbox" name="cuisineType" value="mexican" />
                  <span>Mexican</span>
                </label>
                <label className="checkbox-item">
                  <input type="checkbox" name="cuisineType" value="japanese" />
                  <span>Japanese</span>
                </label>
                <label className="checkbox-item">
                  <input type="checkbox" name="cuisineType" value="chinese" />
                  <span>Chinese</span>
                </label>
                <label className="checkbox-item">
                  <input type="checkbox" name="cuisineType" value="indian" />
                  <span>Indian</span>
                </label>
                <label className="checkbox-item">
                  <input type="checkbox" name="cuisineType" value="american" />
                  <span>American</span>
                </label>
                <label className="checkbox-item">
                  <input type="checkbox" name="cuisineType" value="thai" />
                  <span>Thai</span>
                </label>
                <label className="checkbox-item">
                  <input type="checkbox" name="cuisineType" value="french" />
                  <span>French</span>
                </label>
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    name="cuisineType"
                    value="mediterranean"
                  />
                  <span>Mediterranean</span>
                </label>
                <label className="checkbox-item">
                  <input type="checkbox" name="cuisineType" value="korean" />
                  <span>Korean</span>
                </label>
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    name="cuisineType"
                    value="vietnamese"
                  />
                  <span>Vietnamese</span>
                </label>
                <label className="checkbox-item">
                  <input type="checkbox" name="cuisineType" value="other" />
                  <span>Other</span>
                </label>
              </div>
              <small className="field-hint">
                Select all cuisine types your restaurant serves
              </small>
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

  const data = {
    ownerName: formData.get("ownerName")?.trim(),
    email: formData.get("email")?.trim(),
    password: formData.get("password")?.trim(),
    restaurantName: formData.get("restaurantName")?.trim(),
    address: fullAddress,
    city: city,
    contactNumber: formData.get("contactNumber")?.trim(),
    amount: formData.get("amount"),
    cuisineTypes: cuisineTypes, // Array of selected cuisines
    additionalNotes: formData.get("additionalNotes")?.trim(),
  };

  // Validation
  if (
    !data.ownerName ||
    !data.email ||
    !data.password ||
    !data.restaurantName ||
    !data.address ||
    !data.city ||
    !data.contactNumber ||
    !data.amount
  ) {
    return { error: "Please fill in all required fields" };
  }

  if (parseFloat(data.amount) < 0) {
    return { error: "Registration fee must be a positive number" };
  }

  if (cuisineTypes.length === 0) {
    return { error: "Please select at least one cuisine type" };
  }

  if (data.password.length < 6) {
    return { error: "Password must be at least 6 characters long" };
  }

  try {
    const response = await fetch("http://localhost:3000/req_res", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ownerName: data.ownerName,
        ownerEmail: data.email,
        password: data.password,
        restaurantName: data.restaurantName,
        location: data.address,
        city: data.city,
        contactNumber: data.contactNumber,
        amount: parseFloat(data.amount),
        cuisineTypes: data.cuisineTypes, // Send array of cuisines
        additionalNotes: data.additionalNotes || "",
      }),
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
