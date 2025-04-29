document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const loginForm = document.getElementById("login-form");
  const loginModal = document.getElementById("loginModal");
  const authStatus = document.getElementById("auth-status");

  let authInfo = null;

  // Authentication functions
  function updateAuthUI() {
    if (authInfo) {
      authStatus.innerHTML = `
        <div class="user-info">
          <span>${authInfo}</span>
          <button id="logout-btn">Logout</button>
        </div>
      `;
      document.body.classList.add("is-teacher");
      document.getElementById("logout-btn").addEventListener("click", handleLogout);
    } else {
      authStatus.innerHTML = '<button id="login-btn">Teacher Login</button>';
      document.body.classList.remove("is-teacher");
      document.getElementById("login-btn").addEventListener("click", showLoginModal);
    }
  }

  function showLoginModal() {
    loginModal.classList.add("active");
  }

  function hideLoginModal() {
    loginModal.classList.remove("active");
    loginForm.reset();
  }

  function handleLogout() {
    authInfo = null;
    updateAuthUI();
    fetchActivities();
  }

  // Login form handler
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    
    try {
      const response = await fetch("/auth/verify", {
        headers: {
          "Authorization": "Basic " + btoa(username + ":" + password)
        }
      });

      if (response.ok) {
        const data = await response.json();
        authInfo = data.username;
        updateAuthUI();
        hideLoginModal();
        // Refresh activities to show controls
        fetchActivities();
      } else {
        messageDiv.textContent = "Invalid credentials";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
      }
    } catch (error) {
      messageDiv.textContent = "Login failed. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error during login:", error);
    }
  });

  // Close modal when clicking close button or outside
  document.querySelector(".close-modal").addEventListener("click", hideLoginModal);
  loginModal.addEventListener("click", (e) => {
    if (e.target === loginModal) hideLoginModal();
  });

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Create participants HTML with delete icons only for teachers
        const participantsHTML = details.participants.length > 0
          ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants.map(email => 
                  `<li>
                    <span class="participant-email">${email}</span>
                    <button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button>
                  </li>`
                ).join("")}
              </ul>
            </div>`
          : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    if (!authInfo) {
      messageDiv.textContent = "Please login as a teacher to unregister students.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      return;
    }

    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": "Basic " + btoa(authInfo + ":" + "MergingtonTeacher2025!")
          }
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!authInfo) {
      messageDiv.textContent = "Please login as a teacher to register students.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      return;
    }

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          headers: {
            "Authorization": "Basic " + btoa(authInfo + ":" + "MergingtonTeacher2025!")
          }
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  updateAuthUI();
  fetchActivities();
});
