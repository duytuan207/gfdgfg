const historyHelper = require('../helpers/history.helper');
const userModel = require('../models/user.model');
const utils = require('../helpers/utils.helper');

const cronController = {
    getHistory: async (req, res, next) => {
        try {
            let { token } = req.params;
            let user = await userModel.findOne({ token });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication failed!'
                })
            }

            if (!user.permission.useCron) {
                return res.status(401).json({
                    success: false,
                    message: 'Không có quyền thao tác!'
                })
            }

            var startTime = performance.now();

            let data = await utils.runHistory();

            var endTime = performance.now()
            console.log(`Done, ${Math.round((endTime - startTime) / 1000)}s`);

            res.status(200).json({
                success: true,
                message: 'Lấy thành công',
                data
            })

        } catch (err) {
            next(err);
        }
    },
    reward: async (req, res, next) => {
        try {
            let { token } = req.params;
            let user = await userModel.findOne({ token });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication failed!'
                })
            }

            if (!user.permission.useCron) {
                return res.status(401).json({
                    success: false,
                    message: 'Không có quyền thao tác!'
                })
            }

            var startTime = performance.now();

            let data = await utils.runReward();

            var endTime = performance.now()
            console.log(`Done, ${Math.round((endTime - startTime) / 1000)}s`);

            res.status(200).json({
                success: true,
                message: 'Trả thưởng thành công!',
                data
            })

        } catch (err) {
            next(err);
        }
    },
    refund: async (req, res, next) => {
        try {
            let { token } = req.params;
            let user = await userModel.findOne({ token });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication failed!'
                })
            }

            if (!user.permission.useCron) {
                return res.status(401).json({
                    success: false,
                    message: 'Không có quyền thao tác!'
                })
            }

            var startTime = performance.now();

            let error = ['errorComment', 'limitBet'];
            let data = await utils.runError(error);

            var endTime = performance.now()
            console.log(`Done, ${Math.round((endTime - startTime) / 1000)}s`);

            res.status(200).json({
                success: true,
                message: 'Hoàn tiền thành công!',
                data
            })

        } catch (err) {
            next(err);
        }
    },
    rewardID: async (req, res, next) => {
        try {
            let { token, transId } = req.params;
            let user = await userModel.findOne({ token });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication failed!'
                })
            }

            if (!user.permission.useCron) {
                return res.status(401).json({
                    success: false,
                    message: 'Không có quyền thao tác!'
                })
            }

            var startTime = performance.now();

            let data = await historyHelper.rewardTransId(null, transId);

            var endTime = performance.now()
            console.log(`Done, ${Math.round((endTime - startTime) / 1000)}s`);

            res.status(200).json({
                success: true,
                message: 'Trả thưởng thành công!',
                data
            })

        } catch (err) {
            next(err);
        }
    },
    rewardError: async (req, res, next) => {
        try {
            let { token } = req.params;
            let user = await userModel.findOne({ token });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication failed!'
                })
            }

            if (!user.permission.useCron) {
                return res.status(401).json({
                    success: false,
                    message: 'Không có quyền thao tác!'
                })
            }

            var startTime = performance.now();

            let error = ['errorPhone', 'limitPhone', 'errorMoney'];
            let data = await utils.runError(error);

            var endTime = performance.now()
            console.log(`Done, ${Math.round((endTime - startTime) / 1000)}s`);

            res.status(200).json({
                success: true,
                message: 'Trả thưởng đơn lỗi thành công!',
                data
            })

        } catch (err) {
            next(err);
        }
    },
    rewardTOP: async (req, res, next) => {
        try {
            let { token } = req.params;
            let user = await userModel.findOne({ token });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication failed!'
                })
            }

            if (!user.permission.useCron) {
                return res.status(401).json({
                    success: false,
                    message: 'Không có quyền thao tác!'
                })
            }

            if (res.locals.settings.topData.status != 'active') {
                return res.status(401).json({
                    success: false,
                    message: 'Đua TOP đang bảo trì!'
                })
            }

            var startTime = performance.now();

            let data = await utils.runTOP();

            var endTime = performance.now()
            console.log(`Done, ${Math.round((endTime - startTime) / 1000)}s`);

            res.status(200).json({
                success: true,
                message: 'Trả thưởng top thành công!',
                data
            })

        } catch (err) {
            next(err);
        }
    },
    refreshError: async (req, res, next) => {
        try {
            let { token } = req.params;
            let user = await userModel.findOne({ token });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication failed!'
                })
            }

            if (!user.permission.useCron) {
                return res.status(401).json({
                    success: false,
                    message: 'Không có quyền thao tác!'
                })
            }

            var startTime = performance.now();

            let data = await utils.runRefresh();

            var endTime = performance.now()
            console.log(`Done, ${Math.round((endTime - startTime) / 1000)}s`);

            res.status(200).json({
                success: true,
                message: 'Thành công!',
                data
            })
        } catch (err) {
            console.log(err);
            next(err);
        }
    },
    rewardMission: async (req, res, next) => {
        try {
            let { token } = req.params;
            let user = await userModel.findOne({ token });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication failed!'
                })
            }

            if (!user.permission.useCron) {
                return res.status(401).json({
                    success: false,
                    message: 'Không có quyền thao tác!'
                })
            }

            if (res.locals.settings.missionData.status != 'active') {
                return res.status(401).json({
                    success: false,
                    message: 'Nhiệm vụ ngày đang bảo trì!'
                })
            }

            var startTime = performance.now();

            let data = await utils.runMission();

            var endTime = performance.now()
            console.log(`Done, ${Math.round((endTime - startTime) / 1000)}s`);

            res.status(200).json({
                success: true,
                message: 'Thành công!',
                data
            })
        } catch (err) {
            console.log(err);
            next(err);
        }
    },
    refundBill: async (req, res, next) => {
        try {
            let { token } = req.params;
            let user = await userModel.findOne({ token });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication failed!'
                })
            }

            if (!user.permission.useCron) {
                return res.status(401).json({
                    success: false,
                    message: 'Không có quyền thao tác!'
                })
            }

            if (res.locals.settings.refundBill.status != 'active') {
                return res.status(401).json({
                    success: false,
                    message: 'Không hỗ trợ hoàn tiền thua '
                })
            }

            var startTime = performance.now();

            let data = await utils.runRefund();

            var endTime = performance.now()
            console.log(`Done, ${Math.round((endTime - startTime) / 1000)}s`);

            res.status(200).json({
                success: true,
                message: 'Thành công!',
                data
            })
        } catch (err) {
            console.log(err);
            next(err);
        }
    },
    checkError: async (req, res, next) => {
        try {
            let { token } = req.params;
            let user = await userModel.findOne({ token });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication failed!'
                })
            }

            if (!user.permission.useCron) {
                return res.status(401).json({
                    success: false,
                    message: 'Không có quyền thao tác!'
                })
            }

            var startTime = performance.now();

            let data = await utils.checkError(10);

            var endTime = performance.now()
            console.log(`Done, ${Math.round((endTime - startTime) / 1000)}s`);

            res.status(200).json({
                success: true,
                message: 'Thành công!',
                data
            })
        } catch (err) {
            console.log(err);
            next(err);
        }
    }
}

module.exports = cronController;