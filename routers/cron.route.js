const express = require('express');
const { isActive } = require('../middlewares/system.middleware');
const vpsC0ntroller = require('../controllers/admin/vps.controller');
const cronController = require('../controllers/cron.controller');
const router = express.Router();

router.get('/getHistory/:token', isActive, cronController.getHistory);

router.get('/reward/:token', isActive, cronController.reward);

router.get('/refund/:token', isActive, cronController.refund);

router.get('/refreshError/:token', isActive, cronController.refreshError);

router.get('/rewardError/:token', isActive, cronController.rewardError);

router.get('/rewardId/:transId/:token', isActive, cronController.rewardID);

router.get('/rewardMission/:token', isActive, cronController.rewardMission);

router.get('/rewardTOP/:token', isActive, cronController.rewardTOP);

router.get('/refundBill/:token', isActive, cronController.refundBill);

router.get('/checkError/:token', isActive, cronController.checkError);


module.exports = router;