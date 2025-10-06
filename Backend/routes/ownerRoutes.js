const express = require('express');
const router = express.Router();
const ownerController = require('../Controller/ownerController');

router.get("/", ownerController.getOwnerHomepage);
router.get("/dashboard", ownerController.getDashboard);
router.get('/menuManagement', ownerController.getMenuManagement);
router.post('/menuManagement/add', ownerController.addProduct);
router.post('/menuManagement/edit/:id', ownerController.editProduct);
router.post('/menuManagement/delete/:id', ownerController.deleteProduct);

// Staff management routes for owner
router.get('/staffManagement', ownerController.getStaffList);
router.post('/staffManagement/add', ownerController.addStaff);
router.post('/staffManagement/edit/:id', ownerController.editStaff);
router.post('/staffManagement/delete/:id', ownerController.deleteStaff);
router.post('/staffManagement/task/delete/:id', ownerController.deleteTask);

// Table management routes for owner
router.get('/tables', ownerController.getTables);
router.post('/tables/add', ownerController.addTable);
router.post('/tables/delete/:number', ownerController.deleteTable);

router.delete('/restaurant/delete/:id', ownerController.deleteRestaurant);

router.get("/staffManagement/task", ownerController.getTasks);

module.exports = router;
