

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
});


let users;

function callAll(){

  document.getElementById("users").innerHTML="";

let xhr = new XMLHttpRequest();

xhr.onload = function(){
if(this.status==200){
console.log(this.response)
users = JSON.parse(this.response);
console.log(users)
for(let i=0;i<users.length;i++){
  let opt = document.createElement("option");
  opt.value=(users[i].username);
  document.getElementById("users").appendChild(opt);
}

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
        <p><b>Username:</b> <input id="edit-username" value="${user.username}"></p>
        <p><b>Email:</b> <input id="edit-email" value="${user.email}"></p>
        <p><b>Role:</b> <input id="edit-role" value="${user.role}"></p>
        <p><b>Restaurant Name:</b> <input id="edit-restaurantName" value="${user.restaurantName ?? ''}"></p>
        <button id="save">Save</button>
        <button id="remove">Remove</button>
      `;


      document.getElementById("save").addEventListener("click",function(){

         let updatedUser = {
          _id: user._id, 
          username: document.getElementById("edit-username").value,
          email: document.getElementById("edit-email").value,
          role: document.getElementById("edit-role").value,
          restaurantName: document.getElementById("edit-restaurantName").value,
          rest_id: document.getElementById("edit-rest_id").value
        };

        let xhr = new XMLHttpRequest();
        xhr.open("post","http://localhost:3000/admin/edit_user"+user._id,true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify(updatedUser));

        callAll();

      })



      document.getElementById("remove").addEventListener("click",function(){



        let xhr = new XMLHttpRequest();
        xhr.open("post", "http://localhost:3000/admin/users/" + user._id, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send();


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
    let updatedRest = {
      _id: rest._id,
      name: document.getElementById("edit-name").value,
      location: document.getElementById("edit-location").value,
      amount: document.getElementById("edit-amount").value,
      date: document.getElementById("edit-date").value,
    };

    let xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:3000/admin/edit_restaurant/" + rest._id, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify(updatedRest));

    xhr.onload = function () {
      if (xhr.status == 200) {
        callAllRestaurants();
      }
    };
  });


  document.getElementById("remove-restaurant").addEventListener("click", function () {
   
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
  });
});



function getAllReq(){

let xhr = new XMLHttpRequest();

 xhr.open("GET", "http://localhost:3000/admin/requests", true);
 xhr.send();

    xhr.onload = function () {
      if (xhr.status == 200) {

        const reqs = JSON.parse(this.response);
        document.getElementById("requestslist").innerHTML = ""; // Clear previous content
        for(let i=0;i<reqs.length;i++){
          let doc = reqs[i];
            let di = document.createElement("div");
            di.innerHTML=`
        <p><strong>Name:</strong> ${doc.name}</p>
        <p><strong>Location:</strong> ${doc.location}</p>
        <p><strong>Amount:</strong> ${doc.amount}</p>
        <p><strong>Owner Username:</strong> ${doc.owner_username}</p>
        <p><strong>Owner Password:</strong> ${doc.owner_password}</p>
        <p><strong>Date Joined:</strong> ${new Date(doc.date_joined).toLocaleDateString()}</p>
        <p><strong>Created At:</strong> ${new Date(doc.created_at).toLocaleString()}</p>

          <button onclick="acceptRequest('${doc.owner_username}')">Accept</button>
  <button onclick="rejectRequest('${doc.owner_username}')">Reject</button>

            `
          document.getElementById("requestslist").appendChild(di);
        }


      }
    };


}

function acceptRequest(username) {
  let xhr = new XMLHttpRequest();
  xhr.open("GET", `http://localhost:3000/admin/accept_request/${username}`, true);
  xhr.onload = function () {
    getAllReq();
  };
  xhr.send();
}

function rejectRequest(username) {
  let xhr = new XMLHttpRequest();
  xhr.open("GET", `http://localhost:3000/admin/reject_request/${username}`, true);
  xhr.onload = function () {
    if (this.status === 200) {
      getAllReq();
    }
  };
  xhr.send();
}

getAllReq();
