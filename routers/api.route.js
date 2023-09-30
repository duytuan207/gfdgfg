const express = require('express');
const apiController = require('../controllers/api.controller');
const { isActive } = require('../middlewares/system.middleware');
const momoRoute = require('../routers/momo.route');
const musterRoute = require('../routers/muster.route');
const jackpotRoute = require('../routers/jackpot.route');
const router = express.Router();

router.use('/momo', momoRoute);

router.use('/muster', musterRoute);

router.use('/jackpot', jackpotRoute);

router.get('/getGame', isActive, apiController.getGame);

router.get('/getPhone', isActive, apiController.getPhone);

router.post('/getReward', isActive, apiController.getReward);

router.get('/getHistory', isActive, apiController.getHistory);

router.post('/checkMission', isActive, apiController.checkMission);

router.post('/checkGift', isActive, apiController.checkGift);

router.post('/checkTransId', isActive, apiController.checkTransId);

router.post('/refundTransId', isActive, apiController.refundTransId);


module.exports = router;