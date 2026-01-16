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
    
    const selectedDateOnly = new Date(date);
    selectedDateOnly.setHours(0, 0, 0, 0);
    const todayOnly = new Date();
    todayOnly.setHours(0, 0, 0, 0);

    // Check if selected date is in the past
    if (selectedDateOnly < todayOnly) {
      return false;
    }

    // Check if selected time is at least 1 hour from now for today's date
    if (selectedDateOnly.getTime() === todayOnly.getTime()) {
      const [selectedHour, selectedMinute] = time.split(':').map(Number);
      const selectedTimeMinutes = selectedHour * 60 + selectedMinute;
      const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
      const oneHourFromNow = currentTimeMinutes + 60;
      
      return selectedTimeMinutes >= oneHourFromNow;
    }

    return true;
  }
  
  // Get minimum time based on selected date
  function getMinTime(selectedDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    
    // If selected date is today, use current time + 1 hour (rounded to next 15 min)
    if (selected.getTime() === today.getTime()) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      // Round up to next 15-minute interval, then add 1 hour
      const roundedMinute = Math.ceil(currentMinute / 15) * 15;
      let nextHour = currentHour;
      let nextMinute = roundedMinute + 60; // Add 1 hour
      
      if (nextMinute >= 60) {
        nextHour += Math.floor(nextMinute / 60);
        nextMinute = nextMinute % 60;
      }
      
      // Ensure it's within restaurant hours
      if (nextHour >= 23) {
        return "23:00";
      }
      
      const pad = (n) => String(n).padStart(2, '0');
      return `${pad(nextHour)}:${pad(nextMinute)}`;
    }
    
    // For future dates, use opening time
    return "08:00";
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
        errorMessage = "Selected time must be at least 1 hour from now.";
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
  const timeInput = document.getElementById("time");
  
  if (dateInput) {
    const today = new Date();
    const twoDaysLater = new Date();
    twoDaysLater.setDate(today.getDate() + 2);

    const formatDate = (date) => {
      return date.toISOString().split("T")[0];
    };

    dateInput.min = formatDate(today);
    dateInput.max = formatDate(twoDaysLater);
    
    // Update time input min when date changes
    dateInput.addEventListener('change', function() {
      if (timeInput && this.value) {
        timeInput.min = getMinTime(this.value);
        // If current time value is less than min, reset it
        if (timeInput.value && timeInput.value < timeInput.min) {
          timeInput.value = timeInput.min;
        }
      }
    });
  }
  
  // Set initial min time if date is already selected
  if (dateInput && timeInput && dateInput.value) {
    timeInput.min = getMinTime(dateInput.value);
  }
});
