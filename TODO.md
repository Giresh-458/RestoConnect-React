# Bug Fixes TODO List

## Issues to Fix:

1. **[FIXED]** Table number not updating for new orders - Order creation doesn't include tableNumber
2. **[FIXED]** Feedback stars not displaying - Need to use diningRating/orderRating instead of rating
3. **[FIXED]** Today's performance not updating - avgServeTime calculation needs completionTime
4. **[FIXED]** Same as #3 - Performance metrics
5. **[FIXED]** Duration showing NaNh NaNm - Invalid date handling for new reservations
6. **[FIXED]** Serving order for free reserved tables - Need validation check
7. **[FIXED]** Announcement priority always normal - Form state issue
8. **[FIXED]** Invalid date for new reservations - Date parsing fix
9. **[FIXED]** Confirmed reservations showing for empty tables - Need to update status after completion

## Files to Modify:

1. Backend/Controller/customerController.js - Add tableNumber to order creation
2. Backend/Controller/staffController.js - Fix performance calculations, update completionTime
3. Frontend/src/pages/StaffHomePage.jsx - Fix feedback display, reservation time handling
4. Frontend/src/pages/StaffDashBoardPage.jsx - Fix feedback display
5. Frontend/src/pages/OwnerHomepage.jsx - Fix feedback display
6. Frontend/src/pages/StaffManagement.jsx - Fix announcement priority default
7. Frontend/src/pages/OwnerReservations.jsx - Fix table status check for serving, update completed reservations

## Implementation Progress:

- [ ] Issue 1: Table number in orders
- [ ] Issue 2: Feedback stars display
- [ ] Issue 3 & 4: Performance metrics
- [ ] Issue 5: Duration NaN
- [ ] Issue 6: Serve validation
- [ ] Issue 7: Announcement priority
- [ ] Issue 8: Invalid date
- [ ] Issue 9: Confirmed reservations
