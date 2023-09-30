"use strict";
const moment = require("moment");
const utils = require('../helpers/utils.helper');
const historyModel = require('../models/history.model');
const momoModel = require('../models/momo.model');
const settingModel = require('../models/setting.model');
const transferModel = require('../models/transfer.model');
const blockModel = require('../models/block.model');
const missionModel = require("../models/mission.model");
const refundModel = require("../models/refund-bill.model");
const logHelper = require('../helpers/log.helper');
const momoHelper = require('../helpers/momo.helper');
const gameHelper = require('../helpers/game.helper');
const jackpotHelper = require('../helpers/jackpot.helper');
const commentHelper = require('../helpers/comment.helper');
const gameService = require('../services/game.service');
const historyService = require('../services/history.service');
const momoService = require('../services/momo.service');
const jackpotService = require('../services/jackpot.service');
const telegramHelper = require('../helpers/telegram.helper');
const rewardModel = require('../models/reward.model');
const winrateModel = require('../models/winrate.model');
const { setting } = require("../controllers/install.controller");

exports.getHistory = async (phone, configHistory) => {
    try {
        let list = [];
        let dataHistory = await momoHelper.getHistory(phone, configHistory);

        if (!dataHistory || !dataHistory.success) {
            return ({
                phone,
                message: dataHistory.message
            })
        }

        dataHistory.data.length && await momoHelper.getBalance(phone);

        if (configHistory.dataType != 'noti') {
            let details = await utils.runDetails(phone, dataHistory.data);

            for (let detail of details) {
                detail.success && list.push(detail.data);
            }
        } else {
            list.push(...dataHistory.data);
        }

        let detailThread = list.map((history) => this.handleTransId(history));
        let data = await Promise.all(detailThread);

        return ({
            phone,
            count: data.length,
            history: data
        })
    } catch (err) {
        console.log(err);
        await logHelper.create('getHistory', `Lấy lịch sử thất bại!\n* [ ${phone} ]\n* [ ${err.message || err} ]`);

        return ({
            phone,
            message: 'Có lỗi xảy ra ' + err.message || err
        });
    }
}

async function findRate(phone, amount) {
    const dataSetting = await settingModel.findOne();
    let filter = { phone }
    var array = []
    if (await winrateModel.find({ filter })) {
        array = await winrateModel.find({ filter }).lean();
    }
    else {
        array = await winrateModel.find().lean();
    }
    for (let i = 0; i < array.length; i++) {
        if (amount >= array[i].min && amount <= array[i].max) {
            return array[i].rate;
        }
    }
    if (dataSetting.winrate) {
        return dataSetting.winrate;
    }
    return Math.floor(Math.random() * 100)
}


function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function generateUniqueNumber2(timeNum, transId, comment, winRate = 60) {
    let timeStr = String(timeNum).slice(-6);
    var timenew = timeStr.slice(0, -1);
    let transIdStr = transId.toString();
    const lastTranId = Number(transIdStr.slice(-1));
    let soChan = 0;
    if ((lastTranId % 2) == 0) {
        soChan = 1;
    }
    if (comment != null) {
        comment = comment.toUpperCase()
    }
    let last = 0;
    let rd = Math.floor(Math.random() * 101);
    const GameList = await rewardModel.find({});
    let C_ArrayNum = [2, 4, 6, 8]; // chẳn , chẳn 1
    let L_ArrayNum = [1, 3, 5, 7] // lẻ , lẻ 1
    let X_ArrayNum = [1, 2, 3, 4] // xỉu, xỉu 1
    let T_ArrayNum = [5, 6, 7, 8] // tài, tài 1

    let C_Array = GameList.filter(item => {
        return C_ArrayNum.every(number => item.numberTLS.includes(number));
    }).map(item => item.content);
    let L_Array = GameList.filter(item => {
        return L_ArrayNum.every(number => item.numberTLS.includes(number));
    }).map(item => item.content);
    let X_Array = GameList.filter(item => {
        return X_ArrayNum.every(number => item.numberTLS.includes(number));
    }).map(item => item.content);
    let T_Array = GameList.filter(item => {
        return T_ArrayNum.every(number => item.numberTLS.includes(number));
    }).map(item => item.content);
    // console.log(C_Array, L_Array, X_Array, T_Array)
    if ((C_Array.includes(comment) && soChan == 1) ||
        (L_Array.includes(comment) && soChan == 0)
    ) {
        let lastRD = getRndInteger(0, 4);
        if (rd < winRate) {
            last = (2 * lastRD) + 1;
        }
        else {
            last = (2 * lastRD);
        }

    }
    else if ((C_Array.includes(comment) && soChan == 0)
        || (L_Array.includes(comment) && soChan == 1)
    ) {
        let lastRD = getRndInteger(0, 4);
        if (rd < winRate) {
            last = (2 * lastRD);
        }
        else {
            last = (2 * lastRD) + 1;
        }
    }
    else if (T_Array.includes(comment)) {
        let idx = 5 - lastTranId;
        if (idx < 0) {
            idx += 10;
        }
        let lastIdx = idx;
        if (rd < winRate) {
            lastIdx = idx - getRndInteger(1, 5);
            if (lastIdx < 0) {
                lastIdx += 10;
            }
            if (lastIdx > 9) {
                lastIdx = lastIdx - 10;
            }
        }
        else {
            lastIdx = idx + getRndInteger(0, 4);
            if (lastIdx < 0) {
                lastIdx += 10;
            }
            if (lastIdx > 9) {
                lastIdx = lastIdx - 10;
            }
        }
        last = lastIdx;
    } else if (X_Array.includes(comment)) {
        let idx = 5 - lastTranId;
        if (idx < 0) {
            idx += 10;
        }
        let lastIdx = idx;
        if (rd < winRate) {
            lastIdx = idx + getRndInteger(0, 4);
            if (lastIdx < 0) {
                lastIdx += 10;
            }
            if (lastIdx > 9) {
                lastIdx = lastIdx - 10;
            }

        }
        else {
            lastIdx = idx - getRndInteger(1, 5);
            if (lastIdx < 0) {
                lastIdx += 10;
            }
            if (lastIdx > 9) {
                lastIdx = lastIdx - 10;
            }
        }
        last = lastIdx;
    }
    else {
        last = Math.floor(Math.random() * 10);
    }
    let lastStr = last.toString();
    var timeupdated = timenew.concat(lastStr);
    return timeupdated;
}
exports.handleTransId = async (data, find, isCheck) => {
    try {
        if (isCheck == -1) return void await historyModel.findOneAndUpdate({ phone: data.phone, transId: data.transId }, { $set: { isCheck: true } });
        if (await historyModel.findOne({ transId: data.transId }) && !isCheck) return;

        let dataSetting = await settingModel.findOne();
        let { phone, io, transId, partnerId, partnerName, targetId, targetName, amount, comment, time } = data;


        partnerId = momoHelper.convertPhone(partnerId);
        targetId = momoHelper.convertPhone(targetId);

        let { gameName, gameType } = await gameService.checkGame(comment);
        let status = (io == 1) ? 'wait' : 'transfer';

        if (io == 1 && (!gameName || !gameType)) status = comment && comment.includes(dataSetting.paymentComment) ? 'recharge' : 'errorComment';
        if (io == -1) status = comment && comment.includes(dataSetting.withdrawComment) ? 'withdraw' : 'transfer';
        if (status == 'wait' && await momoService.limitBet(phone, amount)) status = !await historyService.refundCount(partnerId, dataSetting.refund.limit || 10) ? 'limitRefund' : 'limitBet';
        let winrate = await findRate(partnerId, amount);//winrate(từ 0 - 100) để càng cao thì tỷ lệ web thằng càng lớn, 0 là 100% người chơi thắng, 100 là 100% web thắng
        var transIdPlus = Number(await generateUniqueNumber2(time, transId, comment, winrate));
        var transIdNew = transId + transIdPlus;

        await historyModel.findOneAndUpdate({ phone, transId }, { $set: { io, transId, transIdNew: transIdNew, transIdPlus, winrate, phone, partnerId, partnerName, targetId, targetName, gameName, gameType, amount, postBalance: data.postBalance || 0, comment, status, find, isCheck, timeTLS: new Date(time) } }, { upsert: true });
        let textnoti = `Mã tham chiếu: ${transId} %0AThời gian giao dịch (Millisecond): ${transIdPlus} %0AMã giao dịch: ${transIdNew} %0ASố tiền: ${Intl.NumberFormat('en-US').format(amount)} %0ANội dung: ${comment || null} %0ANgười chơi: ${partnerId}`

        await telegramHelper.sendText(process.env.privateTOKEN, process.env.privateID, textnoti)
        return ({
            transId,
            transIdNew,
            transIdPlus,
            amount,
            comment
        })
    } catch (err) {
        console.log(err);
        await logHelper.create('handleTransId', `Xử lý giao dịch thất bại!\n* [ ${data.phone} | ${data.transId} ]\n* [ Có lỗi xảy ra ${err.message || err} ]`);
        return;
    }
}

exports.rewardPhone = async (phone) => {
    let dataHistory = await historyModel.find({ phone, io: 1, status: 'wait' });
    let list = [];

    for (let data of dataHistory) {
        list.push(this.rewardTransId(phone, data.transId));
    }

    return ({
        phone,
        reward: await Promise.all(list)
    })
}

exports.rewardTransId = async (phone, transId) => {
    try {
        const dataSetting = await settingModel.findOne();
        const dataHistory = await historyModel.findOne({ transId, io: 1 });
        let transIdNew = dataHistory.transIdNew;
        let transIdPlus = dataHistory.transIdPlus;
        if (!dataHistory) {
            console.log('Không tìm thấy lịch sử #' + transId);
            return;
        }

        if (!phone) {
            let newData = await momoService.phoneActive('all', dataHistory.amount * 2);

            if (!newData) {
                console.log('Không tìm thấy số mới #' + transId);
                return;
            }

            phone = newData;
        }

        const dataPhone = await momoModel.findOne({ phone, status: 'active', loginStatus: 'active' });

        if (!dataPhone) {
            console.log(`Số điện thoại không hoạt động, ${phone} #${transId}`);
            await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'errorPhone', description: `Số điện thoại không hoạt động, ${phone} #${transId}` } });
            return;
        }

        // Check User Block
        if (await blockModel.findOne({ phone: dataHistory.partnerId, status: 'active' })) {
            await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'phoneBlock' } });
            console.log(`${dataHistory.partnerId} đã bị chặn, bỏ qua!`);
            return;
        }

        let { gameName, gameType, status, win, won, bonus } = await gameHelper.checkWin(dataHistory.phone, dataHistory.amount, transIdNew, dataHistory.comment);

        if (await historyModel.findOne({
            transId,
            io: 1,
            $and: [
                {
                    $or: [
                        { status: "waitReward" },
                        { status: "waitRefund" },
                        { status: "win" },
                        { status: "won" },
                        { status: "refund" },
                        { status: "limitRefund" },
                    ]
                }
            ]
        })) {
            console.log('Mã giao dịch này đang xử lý hoặc đã xử lý, bỏ qua! #' + transId);
            return;
        }
        let textnoti = `┏━━━━━━━━━━━━━┓
┣➤ Mã tham chiếu: ${transId}
┣➤ Mã Milisecond: ${Intl.NumberFormat('en-US').format(transIdPlus)}
┣➤ Mã giao dịch: ${transIdNew} 
┣➤ Nội dung: ${dataHistory.comment} (${gameName})
┣➤ Tiền chơi: ${Intl.NumberFormat('en-US').format(dataHistory.amount)}đ
┣➤ Số Momo: ${dataHistory.partnerId.slice(0, 6)}****
┗━━━━━━━━━━━━━┛`
        await telegramHelper.sendText(dataSetting.telegram.token, dataSetting.telegram.chatId, textnoti)
        if (dataHistory.status == 'limitBet' || dataHistory.status == 'errorComment' || status == 'errorComment' || status == 'limitBet') {
            await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'waitRefund', description: `Hoàn tiền lý do: ${(dataHistory.status == 'limitBet' || status == 'limitBet') ? 'Sai hạn mức!' : 'Sai nội dung!'}` } });

            if (dataSetting.refund.status != 'active') {
                await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'limitRefund', description: 'Không hoàn tiền!' } });
                console.log('Hệ thống không hỗ trợ hoàn tiền #' + transId);
                return;
            }

            if (!await historyService.refundCount(dataHistory.partnerId, dataSetting.refund.limit || 10)) {
                await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'limitRefund', description: 'Không hoàn tiền, vì đã quá hạn ngày hôm nay!' } });
                console.log('Vượt qua giới hạn hoàn tiền #' + transId);
                return;
            }

            let moneyRefund = dataHistory.amount;
            let commentData = [
                {
                    name: 'transId',
                    value: transId,
                },
                {
                    name: 'transIdNew',
                    value: transIdNew,
                },
                {
                    name: 'transIdPlus',
                    value: transIdPlus,
                },
                {
                    name: 'status',
                    value: (dataHistory.status == 'limitBet' || status == 'limitBet') ? 'Sai hạn mức!' : 'Sai nội dung!',
                }
            ];
            let refundComment = await commentHelper.dataComment(dataSetting.commentSite.refundGD, commentData);

            moneyRefund = Math.round(dataHistory.status == 'errorComment' && status == 'errorComment' ? dataSetting.refund.fail * moneyRefund / 100 : (win ? (dataSetting.refund.win * moneyRefund / 100) : (dataSetting.refund.won * moneyRefund / 100)));

            if (moneyRefund < 100) {
                return await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'refund', description: `${moneyRefund} không đủ điều kiện để chuyển, miễn hoàn!` } });
            }

            let checkLimit = await momoService.limitCheck(phone, moneyRefund);

            if (checkLimit) {
                checkLimit == 1 ? await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'limitPhone' } }) : await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'errorPhone', description: 'Lỗi số, không tìm thấy hoặc trạng thái đã được thay đổi!' } });
                socket.emit('phoneData', await momoService.getPhone({ status: 'active', loginStatus: 'active' }, dataSetting.limitPhone));

                let phoneNew = await momoService.phoneActive('all', moneyRefund);

                if (!phoneNew) {
                    console.log('Không tìm thấy số mới #' + transId);
                    return;
                }

                checkLimit == 1 ? await logHelper.create('rewardTransId', `Trả thưởng thất bại!\n* [ ${phone} | ${transId} ]\n* [ ${phone} đã đạt giới hạn, đổi sang số ${phoneNew} để hoàn tiền ]`) : await logHelper.create('rewardTransId', `Trả thưởng thất bại!\n* [ ${phone} | ${transId} ]\n* [ ${phone} không tìm thấy hoặc trạng thái khác, đổi sang số ${phoneNew} để hoàn tiền! ]`);
                await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'wait' } });

                return await this.rewardTransId(phoneNew, transId);
            }

            if (!await historyModel.findOne({ transId, io: 1, status: 'waitRefund' })) {
                console.log(`${transId} đã xử lý hoặc không tồn tại!`);
                return;
            }

            if (await transferModel.findOne({ receiver: dataHistory.partnerId, amount: moneyRefund, comment: refundComment })) {
                console.log(`#${transId} đã được hoàn tiền trước đó, bỏ qua!`);
                await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'refund' } });
                return;
            }

            let transfer = await momoHelper.moneyTransfer(phone, { phone: dataHistory.partnerId, amount: moneyRefund, comment: refundComment });
            console.log(transfer);

            if (!transfer || !transfer.success) {
                if (await this.handleTransfer(phone, transId, transfer.message)) return;

                await logHelper.create('rewardTransId', `Trả thưởng thất bại!\n* [ ${phone} | ${transId} ]\n* [ Hoàn tiền thất bại: ${transfer.message} ]`);

                let phoneNew = await momoService.phoneActive('money', moneyRefund);

                if (!phoneNew) {
                    console.log('Không tìm thấy số mới #' + transId);
                    return;
                }

                await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: dataHistory.status, description: `${phone} chuyển tiền thất bại: ${transfer.message}, chuyển sang số ${phoneNew} để hoàn tiền!` } });
                return await this.rewardTransId(phoneNew, transId);
            }

            await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'refund', bonus: moneyRefund } });
            socket.emit('phoneData', await momoService.getPhone({ status: 'active', loginStatus: 'active' }, dataSetting.limitPhone));

            return ({
                phone,
                transId,
                status: 'refund',
                data: transfer.data
            });

        }

        let checkJackpot = await jackpotService.checkJoin(dataHistory.partnerId);

        status && await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status } });

        if (checkJackpot.isJoin == 1) {
            let jackpot = await jackpotHelper.checkWin(transId, dataSetting.jackpot.numberTLS);
            console.log(jackpot)
            jackpot && await jackpotHelper.rewardJackpot(null, dataHistory.partnerId, transId, jackpot);
        }

        if (!win || status != 'waitReward') return;

        let commentData = [
            {
                name: 'transId',
                value: dataHistory.transId,
            },
            {
                name: 'transIdNew',
                value: transIdNew,
            },
            {
                name: 'transIdPlus',
                value: transIdPlus,
            },
            {
                name: 'comment',
                value: dataHistory.comment,
            },
            {
                name: 'amount',
                value: dataHistory.amount,
            },
            {
                name: 'bonus',
                value: bonus,
            }

        ];
        let rewardComment = await commentHelper.dataComment(dataSetting.commentSite.rewardGD, commentData);
        let moneyBonus = Math.round(dataHistory.amount * bonus);
        let isJackpot;

        if (dataSetting.jackpot.status == 'active' && checkJackpot.isJoin == 1 && Math.round(moneyBonus - dataSetting.jackpot.amount) > 100) {
            moneyBonus = Math.round(moneyBonus - dataSetting.jackpot.amount);
            rewardComment += `, trừ ${dataSetting.jackpot.amount}đ tiền hũ`;
            isJackpot = true;
        }

        if (!await historyModel.findOne({ transId, io: 1, status: 'waitReward' })) return;

        let checkLimit = await momoService.limitCheck(phone, moneyBonus);

        if (checkLimit) {
            checkLimit == 1 ? await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'limitPhone' } }) : await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'errorPhone' } });
            socket.emit('phoneData', await momoService.getPhone({ status: 'active', loginStatus: 'active' }, dataSetting.limitPhone));

            let phoneNew = await momoService.phoneActive('limit', moneyBonus);

            if (!phoneNew) {
                console.log('Không tìm thấy số mới #' + transId);
                return;
            }

            checkLimit == 1 ? await logHelper.create('rewardTransId', `Trả thưởng thất bại!\n* [ ${phone} | ${transId} ]\n* [ ${phone} đã đạt giới hạn, đổi sang số ${phoneNew} để trả thưởng! ]`) : await logHelper.create('rewardTransId', `Trả thưởng thất bại!\n* [ ${phone} | ${transId} ]\n* [ ${phone} không tìm thấy hoặc trạng thái khác, đổi sang số ${phoneNew} để trả thưởng! ]`);

            await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'wait' } });
            return await this.rewardTransId(phoneNew, transId);
        }

        if (!await historyModel.findOne({ transId, io: 1, status: 'waitReward' })) return;

        if (await transferModel.findOne({ receiver: dataHistory.partnerId, amount: moneyBonus, comment: rewardComment })) {
            console.log(`#${transId} đã được trả thưởng trước đó, bỏ qua!`);
            await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'win' } });
            return;
        }

        let transfer = await momoHelper.moneyTransfer(phone, { phone: dataHistory.partnerId, amount: moneyBonus, comment: rewardComment });

        if (!transfer || !transfer.success) {
            if (await this.handleTransfer(phone, transId, transfer.message)) {
                return;
            }

            await logHelper.create('rewardTransId', `Trả thưởng thất bại!\n* [ ${phone} | ${transId} ]\n* [ ${transfer.message} ]`);

            let phoneNew = await momoService.phoneActive('money', moneyBonus);

            if (!phoneNew) {
                console.log('Không tìm thấy số mới #' + transId);
                return;
            }

            await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'wait', description: `${phone} chuyển tiền thất bại: ${transfer.message}, chuyển sang số ${phoneNew} để trả thưởng!` } });
            return await this.rewardTransId(phoneNew, transId);
        }
        await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'win', bonus: moneyBonus } });

        socket.emit('phoneData', await momoService.getPhone({ status: 'active', loginStatus: 'active' }, dataSetting.limitPhone));
        socket.emit('historyData', await historyService.getHistory());
        socket.emit('notiWin', {
            phone: `${dataHistory.partnerId.slice(0, 6)}****`,
            gameName,
            amount: moneyBonus
        });

        isJackpot && await jackpotService.updateJackpot(dataHistory.partnerId, dataSetting.jackpot.amount);

        return ({
            phone,
            transId,
            status: 'win',
            data: transfer.data
        });

    } catch (err) {
        console.log(err);
        await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'wait' } });
        await logHelper.create('rewardTransId', `Trả thưởng thất bại!\n* [ ${phone} | ${transId} ]\n* [ Có lỗi xảy ra ${err.message || err} ]`);
        return;
    }
}

exports.handleTransfer = async (phone, transId, message) => {
    try {

        if (!message) {
            await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'errorPhone', description: 'Chuyển tiền thất bại, lỗi không xác định!' } });
            console.log(`${phone} lỗi không xác định #` + transId);
            return true;
        }

        if (message.includes('không đủ')) {
            await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'errorMoney' } });
            console.log(`${phone} số dư không đủ #` + transId);
            return;
        }

        if (message.includes('User has been blocked')) {
            await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'errorPhone', description: 'User has been blocked' } });
            console.log(`${phone} block get money #` + transId);
            return true;
        }

        if (message.includes(' người nhận tạm thời bị khóa')) {
            await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'win', description: 'Người nhận tạm thời bị khóa, không trả thưởng!' } });
            console.log(`${phone} => người nhận tạm thời bị khóa #` + transId);
            return true;
        }

        if (message.includes('Unexpected token u in JSON at position 0')) {
            await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'errorPhone', description: 'Error Disconnect!' } });
            console.log(`${phone} error disconnect #` + transId);
            return true;
        }

        if (message.includes('ECONNRESET')) {
            await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'errorPhone', description: 'Chuyển tiền thất bại, ECONNRESET!' } });
            console.log(`${phone} lỗi mất kết nối #` + transId);
            return true;
        }

        if (message.includes('The "data" argument must be of type string or an instance of Buffer')) {
            await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'errorPhone', description: `Chuyển tiền thất bại, ${message}!` } });
            return true;
        }

        if (message.includes('0.000.000đ')) {
            await momoModel.findOneAndUpdate({ phone }, { $set: { status: 'limit' } });
            await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'limitPhone', description: `Chuyển tiền thất bại, ${message}!` } });
            return;
        }

        await momoModel.findOneAndUpdate({ phone }, { $set: { status: 'error' } });
        await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'errorPhone', description: `Chuyển tiền thất bại, ${message}` } });
    } catch (err) {
        console.log(err);
        await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'errorPhone', description: `Chuyển tiền thất bại, ${err.message || err}` } });
        return;
    }
}

exports.checkTransId = async (transId, phone) => {
    try {
        const dataSetting = await settingModel.findOne();

        if (!phone) {
            let data = await historyModel.findOne({ transId, io: 1 });
            var { transIdNew, transIdPlus } = data
            if (!data) {
                return ({
                    success: false,
                    message: 'Không tìm thấy mã giao dịch này!',
                    data: []
                });
            }

            let resultData = await gameHelper.checkWin(data.phone, data.amount, transIdNew, data.comment);
            let result = resultData.status == 'errorComment' ? 'unknown' : (resultData.win ? 'win' : 'won');
            let status;

            if (data.status == 'limitBet' || data.status == 'errorComment' || data.status == 'limitRefund') {
                status = data.status;
            } else if (data.status == 'errorMoney' || data.status == 'limitPhone' || data.status == 'errorPhone' || data.status == 'phoneBlock') {
                status = 'error';
            } else if (data.status == 'refund' || data.status == 'win' || data.status == 'won') {
                status = 'done';
            } else {
                status = 'wait';
            }

            return ({
                success: true,
                message: 'Lấy thành công!',
                data: {
                    phone: `${data.partnerId.slice(0, 6)}****`,
                    transId: data.transId,
                    transIdPlus: transIdPlus,
                    transIdNew: transIdNew,
                    gameName: data.gameName,
                    amount: data.amount,
                    comment: data.comment,
                    bonus: data.bonus || 0,
                    limit: dataSetting.refund.status != 'active' ? null : await historyService.refundCount(data.partnerId, dataSetting.refund.limit || 10),
                    result,
                    status,
                    time: moment(data.timeTLS).format('YYYY-MM-DD HH:mm:ss')
                }
            })
        }

        let data = await historyModel.findOne({ transId, io: 1 });

        if (data) return await this.checkTransId(transId);

        let details = await momoHelper.getDetails(phone, transId);

        if (!details || !details.success) {
            return ({
                success: false,
                message: 'Không tìm thấy mã giao dịch này!',
                data: []
            });
        }

        let checkTime = Number(momoHelper.diffHours(moment(), moment(details.data.time).valueOf()));

        if (checkTime > (dataSetting.checkTransId.limitHour || 24)) {
            return ({
                success: false,
                message: `Chỉ hỗ trợ tìm lịch sử gần nhất #${transId}!`,
            })
        }

        let partnerId = momoHelper.convertPhone(details.data.partnerId);

        if ((await historyModel.find({ partnerId, find: true, updatedAt: { $gte: moment().startOf('day').toDate(), $lt: moment().endOf('day').toDate() } })).length >= dataSetting.checkTransId.limit) {
            return ({
                success: false,
                message: `Hệ thống chỉ hỗ trợ bạn tìm tối đa ${dataSetting.checkTransId.limit} giao dịch mỗi ngày`
            })
        }

        await this.handleTransId(details.data, true);
        this.rewardTransId(null, transId);

        return await this.checkTransId(transId);
    } catch (err) {
        console.log(err);
        return ({
            success: false,
            message: 'Có lỗi khi tìm mã giao dịch!',
        });
    }
}

exports.rewardTOP = async (phone, top, amount, bonus) => {
    try {
        const dataSetting = await settingModel.findOne();

        let commentData = [
            {
                name: 'top',
                value: top,
            },
            {
                name: 'bonus',
                value: Intl.NumberFormat('en-US').format(bonus),
            },
            {
                name: 'count',
                value: Intl.NumberFormat('en-US').format(amount)
            },
            {
                name: 'time',
                value: moment().format('YYYY-MM-DD')
            }
        ];
        let comment = await commentHelper.dataComment(dataSetting.commentSite.rewardTOP, commentData);

        if (await transferModel.findOne({ receiver: phone, amount: bonus, comment })) {
            return ({
                success: true,
                message: 'Đã trả thưởng trước đó!',
                data: {
                    phone,
                    amount,
                    bonus
                }
            })
        }

        if (await blockModel.findOne({ phone })) {
            await logHelper.create('rewardTOP', `Trả thưởng thất bại!\n* [ 👑 ${top} 👑 | ${phone} | ${Intl.NumberFormat('en-US').format(amount)} | ${Intl.NumberFormat('en-US').format(bonus)} ]\n* [ Người chơi này đã bị chặn, không trả thưởng! ]`);
            return ({
                success: true,
                message: 'Người chơi này đã bị chặn, không trả thưởng!',
                data: {
                    phone,
                    amount,
                    bonus
                }
            })
        }

        let phoneRun = await momoService.phoneActive('all', bonus);

        if (!phoneRun) {
            await logHelper.create('rewardTOP', `Trả thưởng thất bại!\n* [ 👑 ${top} 👑 | ${phone} | ${Intl.NumberFormat('en-US').format(amount)} | ${Intl.NumberFormat('en-US').format(bonus)} ]\n* [ Không tìm thấy số nào đủ điều kiện để trả thưởng, vui lòng trả thưởng tay! ]`);
            return ({
                success: false,
                message: 'Không tìm thấy số nào đủ điều kiện để trả thưởng!',
                data: {
                    phone,
                    amount,
                    bonus
                }
            })
        }

        let transfer = await momoHelper.moneyTransfer(phoneRun, { phone, amount: bonus, comment });

        if (!transfer || !transfer.success) {
            await logHelper.create('rewardTOP', `Trả thưởng thất bại!\n* [ 👑 ${top} 👑 | ${phone} | ${Intl.NumberFormat('en-US').format(amount)} | ${Intl.NumberFormat('en-US').format(bonus)} ]\n* [ ${transfer.message} ]`);
            return ({
                success: false,
                message: transfer.message,
                data: {
                    phone,
                    amount,
                    bonus
                }
            })
        }

        await logHelper.create('rewardTOP', `Trả thưởng thành công!\n* [ 👑 ${top} 👑 | ${phone} | ${Intl.NumberFormat('en-US').format(amount)} | ${Intl.NumberFormat('en-US').format(bonus)} ]`);
        return ({
            success: true,
            message: 'Thành công!',
            data: {
                phone,
                amount,
                bonus
            }
        })
    } catch (err) {
        await logHelper.create('rewardTOP', `Trả thưởng thất bại!\n* [ 👑 ${top} 👑 | ${phone} | ${Intl.NumberFormat('en-US').format(amount)} | ${Intl.NumberFormat('en-US').format(bonus)} ]\n* [ ${err.message || err} ]`);
        return;
    }
}

exports.rewardMission = async (phone, amount, bonus, count) => {
    try {
        let dataSetting = await settingModel.findOne();
        let check = await missionModel.findOne({
            phone,
            amount,
            bonus,
            createdAt: {
                $gte: moment().startOf('day').toDate(),
                $lt: moment().endOf('day').toDate()
            }
        });

        let commentData = [
            {
                name: 'amount',
                value: amount,
            },
            {
                name: 'bonus',
                value: bonus,
            },
            {
                name: 'count',
                value: Intl.NumberFormat('en-US').format(count)
            },
            {
                name: 'time',
                value: moment().format('YYYY-MM-DD')
            }
        ];
        let comment = await commentHelper.dataComment(dataSetting.commentSite.rewardMission, commentData);
        let checkTrans = await transferModel.findOne({ receiver: phone, amount: bonus, comment });

        if (check || checkTrans) {
            checkTrans && await missionModel.findOneAndUpdate({ phone, amount, bonus, createdAt: { $gte: moment().startOf('day').toDate(), $lt: moment().endOf('day').toDate() } }, { $set: { phone, amount, bonus, count } }, { upsert: true });
            return ({
                success: true,
                message: 'Đã trả thưởng trước đó!',
                data: {
                    phone,
                    amount,
                    bonus,
                    count
                }
            })
        }

        if (await blockModel.findOne({ phone })) {
            await missionModel.findOneAndUpdate({ phone, amount, bonus, createdAt: { $gte: moment().startOf('day').toDate(), $lt: moment().endOf('day').toDate() } }, { $set: { phone, amount, bonus, count } }, { upsert: true });
            await logHelper.create('rewardMission', `Trả thưởng thất bại!\n* [ ${phone} | ${Intl.NumberFormat('en-US').format(amount)} | ${Intl.NumberFormat('en-US').format(bonus)} ]\n* [ Người chơi này đã bị chặn, không trả thưởng! ]`);
            return ({
                success: true,
                message: 'Người dùng đã bị chặn, không trả thưởng!',
                data: {
                    phone,
                    amount,
                    bonus,
                    count
                }
            })
        }

        let phoneActive = await momoService.phoneActive('all', bonus);

        if (!phoneActive) {
            await logHelper.create('rewardMission', `Trả thưởng thất bại!\n* [ ${phone} | ${Intl.NumberFormat('en-US').format(amount)} | ${Intl.NumberFormat('en-US').format(bonus)} ]\n* [ Không tìm thấy số nào đủ điều kiện để trả thưởng, vui lòng kiểm tra! ]`);
            return ({
                success: false,
                message: 'Không tìm thấy số nào đủ điều kiện để trả thưởng!',
                data: {
                    phone,
                    amount,
                    bonus,
                    count
                }
            })
        }

        let transfer = await momoHelper.moneyTransfer(phoneActive, { phone, amount: bonus, comment });

        if (!transfer || !transfer.success) {
            await logHelper.create('rewardMission', `Trả thưởng thất bại!\n* [ ${phone} | ${Intl.NumberFormat('en-US').format(amount)} | ${Intl.NumberFormat('en-US').format(bonus)} ]\n* [ ${transfer.message} ]`);
            return ({
                success: false,
                message: transfer.message,
                data: {
                    phone,
                    amount,
                    bonus,
                    count
                }
            })
        }

        await new missionModel({ phone, amount, bonus, count }).save();
        return ({
            success: true,
            message: 'Thành công!',
            data: {
                phone,
                amount,
                bonus,
                count
            }
        })

    } catch (err) {
        console.log(err);
        await logHelper.create('rewardMission', `Trả thưởng thất bại!\n* [ ${phone} | ${Intl.NumberFormat('en-US').format(amount)} | ${Intl.NumberFormat('en-US').format(bonus)} ]\n* [ Có lỗi xảy ra ${err.message || err} ]`);
        return ({
            success: false,
            message: `Có lỗi xảy ra ${err.message || err}`,
            data: {
                phone,
                amount,
                bonus,
                count
            }
        })
    }
}

exports.refundBill = async (phone, dataConfig) => {
    try {
        let check = await refundModel.findOne({
            phone,
            createdAt: {
                $gte: moment().startOf('day').toDate(),
                $lt: moment().endOf('day').toDate()
            }
        });

        if (check) {
            return ({
                phone,
                message: 'Đã được hoàn tiền bill đầu trong ngày!',
            })
        }

        let filters = {
            partnerId: phone,
            timeTLS: {
                $gte: moment().startOf('day').toDate(),
                $lt: moment().endOf('day').toDate()
            }
        };

        dataConfig.refundBill.typeAction == 'all' && (filters.status == 'won');

        let { transId, amount, status } = await historyModel.findOne(filters);

        if (amount < dataConfig.refundBill.min || (status != 'won' && dataConfig.refundBill.typeAction != 'all')) {
            await new refundModel({
                phone,
                transId,
                amount,
                bonus: 0,
                percent: dataConfig.refundBill.percent
            }).save();

            return ({
                phone,
                transId,
                amount,
                bonus: 0,
                percent: dataConfig.refundBill.percent,
                message: 'Không đủ điều kiện hoàn tiền bill đầu trong ngày!'
            })
        }

        let commentData = [
            {
                name: 'transId',
                value: transId,
            },
            {
                name: 'time',
                value: moment().format('DD-MM-YYYY'),
            }
        ];
        let comment = await commentHelper.dataComment(dataConfig.commentSite.refundBill, commentData);
        let bonus = Math.round(dataConfig.refundBill.percent * amount / 100);

        bonus > dataConfig.refundBill.max && (bonus = dataConfig.refundBill.max);

        if (await transferModel.findOne({ receiver: phone, amount: bonus, comment })) {
            !check && await refundModel.findOneAndUpdate({ phone, createdAt: { $gte: moment().startOf('day').toDate(), $lt: moment().endOf('day').toDate() } }, { $set: { phone, transId, amount: amount, bonus, percent: dataConfig.refundBill.percent } }, { upsert: true });

            return ({
                phone,
                transId,
                amount,
                bonus,
                percent: dataConfig.refundBill.percent,
                message: 'Đã được hoàn tiền bill đầu trong ngày!'
            })
        }


        let phoneActive = await momoService.phoneActive('all', bonus);

        if (!phoneActive) {
            await logHelper.create('refundBill', `Hoàn tiền thất bại!\n* [ ${phone} | ${transId} | ${Intl.NumberFormat('en-US').format(amount)} | ${Intl.NumberFormat('en-US').format(bonus)} | ${dataConfig.refundBill.percent}% ]\n* [ Không tìm thấy số nào đủ điều kiện để hoàn tiền! ]`);
            return ({
                phone,
                transId,
                amount,
                bonus,
                percent: dataConfig.refundBill.percent,
                message: 'Không tìm thấy số nào đủ điều kiện để hoàn tiền!',
            })
        }

        let transfer = await momoHelper.moneyTransfer(phoneActive, { phone, amount: bonus, comment });

        if (!transfer || !transfer.success) {
            await logHelper.create('refundBill', `Hoàn tiền thất bại!\n* [ ${phone} | ${transId} | ${Intl.NumberFormat('en-US').format(amount)} | ${Intl.NumberFormat('en-US').format(bonus)} | ${dataConfig.refundBill.percent}% ]\n* [ ${transfer.message}]`);
            return ({
                phone,
                transId,
                amount,
                bonus,
                percent: dataConfig.refundBill.percent,
                message: transfer.message
            })
        }

        await new refundModel({
            phone,
            transId,
            amount,
            bonus,
            percent: dataConfig.refundBill.percent,
            message: 'Hoàn thành công!'
        }).save();
        await logHelper.create('refundBill', `Hoàn tiền thành công!\n* [ ${phone} | ${transId} | ${Intl.NumberFormat('en-US').format(amount)} | ${Intl.NumberFormat('en-US').format(bonus)} | ${dataConfig.refundBill.percent}% ]`);

        return ({
            phone,
            transId,
            amount,
            bonus,
            percent: dataConfig.refundBill.percent,
            message: 'Hoàn thành công!'
        })

    } catch (err) {
        console.log(err);
        await logHelper.create('refundBill', `Hoàn tiền thất bại!\n* [ ${phone} ]\n* [ ${err.message || err}]`);

        return ({
            phone,
            message: `Có lỗi xảy ra ${err.message || err}`
        })
    }
}
