const express = require('express');
const router = express.Router();


const staffController = require('../Controller/staffController');


router.get('/Dashboard', staffController.getDashBoard);

router.post('/Dashboard/update-order', staffController.postUpdateOrder);
router.post('/Dashboard/allocate-table', staffController.postAllocateTable);





router.get('/HomePage', staffController.getHomePage);
router.post('/HomePage/tasks', staffController.postHomePageTask);
router.delete('/HomePage/tasks/:id', staffController.deleteHomePageTasks);

router.delete('/Dashboard/remove-reservation/:id', staffController.postRemoveReservation);

// New POST routes for deletion without method-override
router.post('/HomePage/tasks/delete/:id', staffController.deleteHomePageTasks);
router.post('/Dashboard/remove-reservation/delete/:id', staffController.postRemoveReservation);




module.exports = router;