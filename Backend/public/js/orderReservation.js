document.addEventListener("DOMContentLoaded", () => {
  const orderForm = document.querySelector(".order-section form");
  if (orderForm) {
    orderForm.addEventListener("submit", (event) => {
      if (!confirm("Are you sure you want to place this order?")) {
        event.preventDefault();
      }
    });
  }

  const reservationForm = document.querySelector(".reservation-section form");
  if (reservationForm) {
    reservationForm.addEventListener("submit", (event) => {
      if (!confirm("Confirm your table reservation?")) {
        event.preventDefault();
      }
    });
  }

  // Date validation functions
  function isValidDate(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    const twoDaysLater = new Date();
    twoDaysLater.setDate(today.getDate() + 2);
    twoDaysLater.setHours(0, 0, 0, 0);

    return selectedDate >= today && selectedDate <= twoDaysLater;
  }

  function isValidTime(time) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  function validateDateTime(date, time) {
    const now = new Date();
    const selectedDateTime = new Date(`${date}T${time}`);

    // Check if selected time is in the future for today's date
    if (new Date(date).setHours(0, 0, 0, 0) === now.setHours(0, 0, 0, 0)) {
      return selectedDateTime > now;
    }

    return true;
  }

  // Form validation
  const orderReservationForm = document.getElementById("orderReservationForm");
  const validationError = document.getElementById("validationError");

  if (orderReservationForm) {
    orderReservationForm.addEventListener("submit", (event) => {
      const dateInput = document.getElementById("date");
      const timeInput = document.getElementById("time");

      let errorMessage = "";

      if (!isValidDate(dateInput.value)) {
        errorMessage = "Date must be today or within the next 2 days.";
      } else if (!isValidTime(timeInput.value)) {
        errorMessage = "Please enter a valid time.";
      } else if (!validateDateTime(dateInput.value, timeInput.value)) {
        errorMessage = "Selected time must be in the future.";
      }

      if (errorMessage) {
        event.preventDefault();
        validationError.textContent = errorMessage;
        validationError.style.display = "block";
      } else if (
        !confirm("Are you sure you want to place this order and reservation?")
      ) {
        event.preventDefault();
      }
    });
  }

  // Set minimum and maximum date for the date picker
  const dateInput = document.getElementById("date");
  if (dateInput) {
    const today = new Date();
    const twoDaysLater = new Date();
    twoDaysLater.setDate(today.getDate() + 2);

    const formatDate = (date) => {
      return date.toISOString().split("T")[0];
    };

    dateInput.min = formatDate(today);
    dateInput.max = formatDate(twoDaysLater);
  }
});
