

document.addEventListener('DOMContentLoaded', () => {
  const editProfileBtn = document.getElementById('editProfileBtn');
  const profileEditForm = document.getElementById('profileEditForm');
  const profileDisplay = document.getElementById('profileDisplay');
  const cancelEditBtn = document.getElementById('cancelEditBtn');

  if (editProfileBtn && profileEditForm && profileDisplay && cancelEditBtn) {
    editProfileBtn.addEventListener('click', () => {
      profileDisplay.style.display = 'none';
      profileEditForm.style.display = 'block';
    });

    cancelEditBtn.addEventListener('click', () => {
      profileEditForm.style.display = 'none';
      profileDisplay.style.display = 'block';
    });
  }

  // Function to update statistics dynamically
  // Removed as per user request to not use any API for dynamic updates

  // Removed updateStatistics function and related calls

  const deleteAccountBtn = document.getElementById('deleteAccountBtn');
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', () => {
      if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
        let xhr = new XMLHttpRequest();
        xhr.open("DELETE", "/admin/delete_account", true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send();

        xhr.onload = function () {
          if (xhr.status == 200) {
            alert("Account deleted successfully.");
            window.location.href = "/loginPage"; // Redirect to login
          } else {
            alert("Error deleting account: " + JSON.parse(xhr.responseText).error);
          }
        };
      }
    });
  }
});


let users;

function callAll(){

  document.getElementById("users").innerHTML="";

let xhr = new XMLHttpRequest();

xhr.onload = function(){
if(this.status==200){
console.log(this.response)
users = JSON.parse(this.response);
// Exclude admin users from the UI listing/count
users = users.filter(u => u.role !== 'admin');
console.log(users)
for(let i=0;i<users.length;i++){
  let opt = document.createElement("option");
  opt.value=(users[i].username);
  document.getElementById("users").appendChild(opt);
}


// Only count customer/owner/staff
document.getElementById("totalUsersCount").innerText=users.length;
}
}

xhr.open("GET", "http://localhost:3000/admin/users", true);
xhr.send();


}

callAll();



document.getElementById("see-user").addEventListener("click",function(){

let dispaly = document.getElementById("diplay");
dispaly.innerHTML="";
let inputval = document.getElementById("users-list").value;
let user = users.find(u => u.username === inputval);

if (!user) {
  dispaly.innerHTML = "<p>No user found</p>";
  return;
}

 dispaly.innerHTML = `
        <h3>User Profile</h3>
        <p><b>Username:</b> <span>${user.username}</span></p>
        <p><b>Email:</b> <span>${user.email}</span></p>
        <p><b>Role:</b> <span>${user.role}</span></p>
        <p><b>Restaurant Name:</b> <span>${user.restaurantName ?? ''}</span></p>
        <p><b>Suspended:</b> <span>${user.isSuspended ? 'Yes' : 'No'}</span></p>
        ${user.isSuspended ? `<p><b>Suspension End Date:</b> <span>${user.suspensionEndDate ? new Date(user.suspensionEndDate).toLocaleDateString() : 'Indefinite'}</span></p>` : ''}
        <button id="suspend1">Suspend</button>
        <button id="remove1">Remove</button>
      `;


      document.getElementById("suspend1").addEventListener("click",function(){
        let suspensionEndDate = prompt("Enter suspension end date (YYYY-MM-DD) or leave blank for indefinite:");
        let suspensionReason = prompt("Enter suspension reason (optional):");

        let suspensionData = {
          suspensionEndDate: suspensionEndDate || null,
          suspensionReason: suspensionReason || null
        };

        let xhr = new XMLHttpRequest();
        xhr.open("post","http://localhost:3000/admin/suspend_user/"+user._id,true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify(suspensionData));

        xhr.onload = function() {
          if (xhr.status == 200) {
            callAll();
            dispaly.innerHTML = "<p>User suspended successfully.</p>";
          } else {
            alert("Error suspending user: " + JSON.parse(xhr.responseText).error);
          }
        };
      })



      document.getElementById("remove1").addEventListener("click",function(){
        if (confirm("Are you sure you want to delete this user?")) {
          let xhr = new XMLHttpRequest();
          xhr.open("post", "http://localhost:3000/admin/delete_user/" + user._id, true);

          xhr.setRequestHeader("Content-Type", "application/json");
          xhr.send();

          let dispaly = document.getElementById("diplay");
          dispaly.innerHTML="";
          callAll();
        }
      });


})

let restaurants;

function callAllRestaurants() {
  document.getElementById("restaurants").innerHTML = "";

  let xhr = new XMLHttpRequest();
  xhr.onload = function () {
    if (this.status == 200) {
      console.log(this.response);
      restaurants = JSON.parse(this.response);
      console.log(restaurants);

      for (let i = 0; i < restaurants.length; i++) {
        let opt = document.createElement("option");
        opt.value = restaurants[i].name;
        document.getElementById("restaurants").appendChild(opt);
      }

      document.getElementById("totalRestaurantsCount").innerText = restaurants.length;
    }
  };

  xhr.open("GET", "http://localhost:3000/admin/restaurants", true);
  xhr.send();
}

callAllRestaurants();

document.getElementById("seerest").addEventListener("click", function () {
  let display = document.getElementById("diplay-rest");
  display.innerHTML = "";

  let inputval = document.getElementById("rest-list").value;
  let rest = restaurants.find(r => r.name === inputval);

  if (!rest) {
    display.innerHTML = "<p>No restaurant found</p>";
    return;
  }

  display.innerHTML = `
    <h3>Restaurant Profile</h3>
    <p><b>Name:</b> <input id="edit-name" value="${rest.name}"></p>
    <p><b>Location:</b> <input id="edit-location" value="${rest.location}"></p>
    <p><b>Payment Amount:</b> <input id="edit-amount" type="number" value="${rest.amount}"></p>
    <p><b>Date Joined:</b> <input id="edit-date" type="date" value="${new Date(rest.date).toISOString().split('T')[0]}"></p>
    <button id="save-restaurant">Save</button>
    <button id="remove-restaurant">Remove</button>
  `;

  
  document.getElementById("save-restaurant").addEventListener("click", function () {
    let suspensionEndDate = prompt("Enter suspension end date (YYYY-MM-DD) or leave blank for indefinite:");
    let suspensionReason = prompt("Enter suspension reason (optional):");

    let suspensionData = {
      suspensionEndDate: suspensionEndDate || null,
      suspensionReason: suspensionReason || null
    };

    let xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:3000/admin/suspend_restaurant/" + rest._id, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify(suspensionData));

    xhr.onload = function () {
      if (xhr.status == 200) {
        callAllRestaurants();
        display.innerHTML = "<p>Restaurant suspended successfully.</p>";
      } else {
        alert("Error suspending restaurant: " + JSON.parse(xhr.responseText).error);
      }
    };
  });


  document.getElementById("remove-restaurant").addEventListener("click", function () {
    if (confirm("Are you sure you want to delete this restaurant?")) {
      let xhr = new XMLHttpRequest();
      xhr.open("POST", "http://localhost:3000/admin/delete_restaurant/" + rest._id, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send();

      xhr.onload = function () {
        if (xhr.status == 200) {
          callAllRestaurants();
          display.innerHTML = "";
        }
      };
    }
  });
});



async function getAllReq() {
  const container = document.getElementById("requestslist");
  if (!container) return;
  container.innerHTML = '<p>Loading requests...</p>';
  try {
    const res = await fetch("http://localhost:3000/admin/requests", { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`Failed to load requests (${res.status})`);
    const reqs = await res.json();

    container.innerHTML = ""; // Clear previous content
    if (!reqs || reqs.length === 0) {
      const noReq = document.createElement('p');
      noReq.innerText = 'No new rest req';
      container.appendChild(noReq);
      return;
    }

    for (let i = 0; i < reqs.length; i++) {
      const doc = reqs[i];
      const di = document.createElement("div");
      di.innerHTML = `
        <p><strong>Name:</strong> ${doc.name}</p>
        <p><strong>Location:</strong> ${doc.location}</p>
        <p><strong>Amount:</strong> ${doc.amount}</p>
        <p><strong>Owner Username:</strong> ${doc.owner_username}</p>
        <p><strong>Owner Password:</strong> ${doc.owner_password}</p>
        <p><strong>Created At:</strong> ${new Date(doc.created_at).toLocaleString()}</p>
        <button class="accept-btn" data-username="${doc.owner_username}">Accept</button>
        <button class="reject-btn" data-username="${doc.owner_username}">Reject</button>
      `;
      container.appendChild(di);
    }

    // Attach async handlers
    container.querySelectorAll('.accept-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const username = e.currentTarget.getAttribute('data-username');
        await acceptRequest(username, e.currentTarget);
      });
    });

    container.querySelectorAll('.reject-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const username = e.currentTarget.getAttribute('data-username');
        await rejectRequest(username, e.currentTarget);
      });
    });

  } catch (err) {
    console.error('Error loading requests:', err);
    container.innerHTML = `<p style="color:#dc3545">Failed to load requests</p>`;
  }
}

async function acceptRequest(username, btnEl) {
  try {
    if (btnEl) btnEl.disabled = true;
    const res = await fetch(`http://localhost:3000/admin/accept_request/${encodeURIComponent(username)}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`Accept failed (${res.status})`);
  } catch (err) {
    console.error('Accept error:', err);
    alert('Failed to accept request. Please try again.');
  } finally {
    if (btnEl) btnEl.disabled = false;
    await getAllReq();
  }
}

async function rejectRequest(username, btnEl) {
  try {
    if (btnEl) btnEl.disabled = true;
    const res = await fetch(`http://localhost:3000/admin/reject_request/${encodeURIComponent(username)}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`Reject failed (${res.status})`);
  } catch (err) {
    console.error('Reject error:', err);
    alert('Failed to reject request. Please try again.');
  } finally {
    if (btnEl) btnEl.disabled = false;
    await getAllReq();
  }
}

getAllReq();
