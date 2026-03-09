# TODO: Add csrfHeader: [] to all data-modifying routes (POST, PUT, PATCH, DELETE)

## Files to edit:
1. [x] Backend/routes/staffRouter.js
2. [x] Backend/routes/ownerRoutes.js (partially done - need to check)
3. [x] Backend/routes/adminroutes.js
4. [x] Backend/routes/authRoutes.js
5. [ ] Backend/routes/customer.js
6. [ ] Backend/routes/customerPublic.js
7. [ ] Backend/routes/dishRoutes.js
8. [ ] Backend/routes/reservationRoutes.js

## Plan:
Add `csrfHeader: []` to security section for routes with:
- POST
- PUT
- PATCH
- DELETE

(Only where bearerAuth: [] exists without csrfHeader: [])

