# Staff Management Feature Implementation

## Frontend
- [x] Add new route in App.jsx: { path: "staffmanagement", element: <StaffManagement></StaffManagement> } under owner children.
- [x] Create new component StaffManagement.jsx in Frontend/src/pages/ with sections for:
  - [x] Add Task: Form to input task description, assign to staff (fetch staff list), set priority.
  - [x] Add Announcement: Form to input message, set priority.
  - [x] Assign Shift: Form to input shift name, date, start/end time, assign to staff.
  - [x] View Support Messages: Display list of support messages from staff.

## Backend
- [x] Add routes in ownerRoutes.js: POST /add-task, POST /add-announcement, POST /add-shift, GET /support-messages, GET /staff-list.
- [x] Add controller methods in ownerController.js: addTask, addAnnouncement, addShift, getSupportMessages, getStaffList.

## Testing
- [ ] Test the new page by navigating to /owner/staffmanagement.
- [ ] Test adding items and verify they appear in database and frontend.
- [ ] Ensure authentication middleware is applied.
