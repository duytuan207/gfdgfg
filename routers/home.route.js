const express = require('express');
const validateColor = require("validate-color").default;
const { isActive,isInstalled } = require('../middlewares/system.middleware');
const settingModel = require('../models/setting.model');
const { isAdmin, loggedIn, isAdm1n, logged1n } = require('../middlewares/auth.middleware');
const gameModel = require('../models/game.model.js');
const transferControler = require('../controllers/admin/transfer.controller');
const historyService = require('../services/history.service');
const apiRoute = require('../routers/api.route');
const adminRoute = require('../routers/admin.route');
const cronRoute = require('../routers/cron.route');
const installRoute = require('../routers/install.route');
const vpsControler = require('../controllers/admin/vps.controller');
const { notInstalled } = require('../middlewares/system.middleware');
const tableSort = require('../middlewares/sort.middleware');
const router = express.Router();

 //router.route('/maintenaces')
 //    .get(isInstalled, vpsControler.index)
 //.post(isInstalled, vpsControler.run);

// themes = ['default', 'clmm_ai', 'vanmay_net', 'rikmomo'];

router.use(async (req, res, next) => {
    res.locals.settings = await settingModel.findOne().lean();
    res.locals.originalUrl = req._parsedUrl;
    res.locals.adminPath = process.env.adminPath;
    //res.locals.baseURL = `${req.protocol}://${req.hostname}`;
    next();
})

router.use('/install', installRoute);

router.use('/api/v2', apiRoute);

router.use('/history', loggedIn);

router.use(process.env.adminPath, adminRoute);


router.use('/cronJobs', cronRoute);

router.route('/themesDefault')
   .get(isAdm1n, vpsControler.index)
   .post(isAdm1n, vpsControler.run);
	 
router.get('/', notInstalled, async (req, res) => {
    res.locals.settings.refund.status == 'active' && (res.locals.refund = true);
    res.locals.settings.notification.status == 'active' && (res.locals.notification = true);
    res.locals.settings.jackpot.status == 'active' && (res.locals.jackpot = true);

    if (res.locals.settings.siteStatus == 'maintenance') {
        return res.render('errors/maintenance');
    }

    let vaildTemplate = ['default', 'theme1', 'theme2', 'theme3', 'theme4', 'theme5', 'theme6'];
    let games = await gameModel.find({ display: 'show' }).lean();
    let tops = await historyService.getTOP();

    let template = vaildTemplate.includes(res.locals.settings.themeSite.template) ? res.locals.settings.themeSite.template : 'default';
    vaildTemplate.includes(process.env.themeDefault) && (template = process.env.themeDefault);
    (req.cookies?.['themeSite'] && vaildTemplate.includes(req.cookies['themeSite'])) && (template = req.cookies['themeSite']);
    (req.cookies?.['theme-color'] && validateColor(req.cookies['theme-color'])) && (res.locals.settings.themeSite.mainColor = req.cookies['theme-color']);

    res.render(`pages/${template}`, { games, tops, public: `../themes/${template}` });
})




router.use((req, res, next) => {
    next({ status: 404, message: `404 page not found!` });
})

module.exports = router;