function goToDashboard() {
  const restaurant = document.getElementById("restaurantSelect").value;
  window.location.href = `/owner/dashboard?restaurant=${restaurant}`;
}


window.onload = function () {
  callAllStaff();
  addAllTasks();
  loadTables();
};



function deleteStaff(id) {
  console.log("to delte");
  const xhr = new XMLHttpRequest();
  xhr.open("POST", `/owner/staffManagement/delete/${id}`, true);
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        callAllStaff();
      } else {
        console.error("Delete failed:", xhr.responseText);
      }
    }
  };

  xhr.send();
}

function editStaff(id) {
  
  const staff = {
    id,
    username: document.getElementById(`username-${id}`).value,
    password: document.getElementById(`password-${id}`).value,
  };

  const xhr = new XMLHttpRequest();
  xhr.open("POST", `/owner/staffManagement/edit/${id}`, true);
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
       callAllStaff();
      } else {
        console.error("Edit failed:", xhr.responseText);
      }
    }
  };

  xhr.send(JSON.stringify(staff));
}




function callAllStaff(){
  document.getElementById("staff").innerHTML=``;
const xhr = new XMLHttpRequest();

document.getElementById("staff").innerHTML=``;
xhr.onload = function(){
if(this.status==200){

let responce = JSON.parse(this.response);


for(let i=0;i<responce.length;i++){
  let staff = document.createElement("div");

  staff.innerHTML = `
  <input type="text" id="username-${responce[i]._id}" value="${responce[i].username}">
  <input type="password" id="password-${responce[i]._id}" value="${responce[i].password || ''}">

 <button onclick="editStaff('${responce[i]._id}')">Edit</button>
<button onclick="deleteStaff('${responce[i]._id}')">Delete</button>

`;


document.getElementById("staff").append(staff);
}


}
}

xhr.open("get","/owner/staffManagement",true)
xhr.withCredentials = true;
xhr.send();
}




document.getElementById("addStaffForm").addEventListener("submit", function (e) {
    e.preventDefault(); 

    const data = {
      username: document.getElementById("username").value,
      restaurantName: document.getElementById("restaurantName").value,
      email:document.getElementById("email").value,
      password: document.getElementById("password").value,
    };

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/owner/staffManagement/add", true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
         callAllStaff()
          document.getElementById("addStaffForm").reset(); // clear form
        } else {
          alert("Error adding staff: " + xhr.responseText);
        }
      }
    };
    xhr.withCredentials = true;
    xhr.send(JSON.stringify(data));
  });



  document.getElementById("addTableForm").addEventListener("submit", function (e) {
    e.preventDefault(); 

    const data = {
      number: document.getElementById("tableNumber").value,
      seats: document.getElementById("seats").value,
    };

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/owner/tables/add", true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
         
          document.getElementById("addTableForm").reset();
          loadTables();
          // clear form
        } else {
          alert("Error adding table: " + xhr.responseText);
        }
      }
    };
    xhr.withCredentials = true;
    xhr.send(JSON.stringify(data));
  });



  function deleteTask(id) {
  const xhr = new XMLHttpRequest();
  xhr.open("POST", `/owner/staffManagement/task/delete/${id}`, true);
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        addAllTasks();
    }
  };
  xhr.withCredentials = true;
  xhr.send(); 
}
}






  function addAllTasks(){

document.getElementById("tasks").innerHTML=``;

    const xhr = new XMLHttpRequest();
    xhr.open("get","/owner/staffManagement/task/",true);
    xhr.onload = function(){
        if(this.status==200){

          const tasks = JSON.parse(this.response);
          
       for (let i = 0; i < tasks.length; i++) {
          let di = document.createElement("div");
          di.id = `task-${tasks[i]._id}`;
          di.innerHTML = `
            ${tasks[i].name}
            <button onclick="deleteTask('${tasks[i]._id}')" class="delete-btn">Delete</button>
          `;
          document.getElementById("tasks").appendChild(di);
        }



        }
    }
     xhr.withCredentials = true;
    xhr.send();


  }





  function deleteTable(number) {
  
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/owner/tables/delete/${number}`, true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          loadTables();
        } else {
          alert("Error deleting table: " + xhr.responseText);
        }
      }
    };
    xhr.withCredentials = true;
    xhr.send(); 
  }


  function loadTables() {

    document.getElementById("tables").innerHTML=``;

  const xhr = new XMLHttpRequest();
  xhr.open("GET", "/owner/tables", true);
  xhr.withCredentials = true;

  xhr.onload = function () {
    if (xhr.status === 200) {
      const response = JSON.parse(this.response); // response = { tables: [...] }
      const tables = response.tables;             // extract actual array

      const container = document.getElementById("tables");
      container.innerHTML = "";

      if (!tables || tables.length === 0) {
        container.innerHTML = "<p>No tables found.</p>";
        return;
      }

      const ul = document.createElement("ul");

      // ✅ Using classic for loop
      for (let i = 0; i < tables.length; i++) {
        const li = document.createElement("li");
        li.id = `table-${tables[i].number}`;
        li.innerHTML = `
          Table ${tables[i].number} - Seats: ${tables[i].seats} - Status: ${tables[i].status}
          <button onclick="deleteTable('${tables[i].number}')" class="delete-btn">Delete</button>
        `;
        ul.appendChild(li);
      }

      container.appendChild(ul);
    } else {
      alert("Error loading tables");
    }
  };

  xhr.send();
}





