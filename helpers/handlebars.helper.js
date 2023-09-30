"use strict";
const moment = require("moment");
const utils = require('./utils.helper');

module.exports = {
    ifCond: (v1, operator, v2, options) => {
        switch (operator) {
            case '==':
                return (v1 == v2) ? options.fn(this) : options.inverse(this);
            case '===':
                return (v1 === v2) ? options.fn(this) : options.inverse(this);
            case '!=':
                return (v1 != v2) ? options.fn(this) : options.inverse(this);
            case '!==':
                return (v1 !== v2) ? options.fn(this) : options.inverse(this);
            case '<':
                return (v1 < v2) ? options.fn(this) : options.inverse(this);
            case '<=':
                return (v1 <= v2) ? options.fn(this) : options.inverse(this);
            case '>':
                return (v1 > v2) ? options.fn(this) : options.inverse(this);
            case '>=':
                return (v1 >= v2) ? options.fn(this) : options.inverse(this);
            case '&&':
                return (v1 && v2) ? options.fn(this) : options.inverse(this);
            case '||':
                return (v1 || v2) ? options.fn(this) : options.inverse(this);
            default:
                return options.inverse(this);
        }
    },
    numberFormat: (number) => Intl.NumberFormat('en-US').format(number || 0),
    convertCurrency: (number) => (number > 999 && number < 1000000) ? (number / 1000) + 'K' : (number >= 1000000 ? (number / 1000000) + 'M' : Intl.NumberFormat().format(number)),
    sum: (num1, num2) => num1 + num2,
    minus: (num1, num2) => num1 - num2,
    formatDate: (time, format) => (format == 'all' || format == 'day' || format == 'month') ? moment(time).format(format == 'all' ? '--------' : (format == 'month' ? 'MM-YYYY' : 'DD-MM-YYYY')) : moment(time).format(format),
    timeNow: (time) => moment(time).locale("vi").fromNow(),
    select: (value, options) => options.fn(this).split('\n').map((v) => !RegExp(`value="${value}"`).test(v) ? v : v.replace(`value="${value}"`, `value="${value}"` + ' selected')).join('\n'),
    toJSON: (data) => JSON.stringify(data),
    prettyJSON: (data) => JSON.stringify(data, null, "\t"),
    joinArray: (data, text) => data.join(text),
    randArray: (data) => {
        let array = data.split(',');
        return array[Math.floor(Math.random() * array.length)];
    },
    tableSort: (query, column, sort) => {
        query = utils.checkQuery(query, ['column', '_sort']);

        let icons = {
            desc: 'fooicon fooicon-sort-desc',
            asc: 'fooicon fooicon-sort-asc',
            default: 'fooicon fooicon-sort'
        }

        let types = {
            default: 'desc',
            asc: 'desc',
            desc: 'asc'
        }

        let typeSort = column == sort.column ? sort.type : 'default';

        return `<a href="${query ? `?${query}&` : '?'}column=${column}&_sort=${types[typeSort]}"><span class="${icons[typeSort]}"></span></a>`;
    },
    paginate: (pagination, options) => {
        var type = options.hash.type || 'middle';
        var ret = '';
        var pageCount = Number(pagination.pageCount);
        var page = Number(pagination.page);
        var limit;
        if (options.hash.limit) limit = +options.hash.limit;

        var newContext = {};
        switch (type) {
            case 'middle':
                if (typeof limit === 'number') {
                    var i = 0;
                    var leftCount = Math.ceil(limit / 2) - 1;
                    var rightCount = limit - leftCount - 1;
                    if (page + rightCount > pageCount)
                        leftCount = limit - (pageCount - page) - 1;
                    if (page - leftCount < 1)
                        leftCount = page - 1;
                    var start = page - leftCount;

                    while (i < limit && i < pageCount) {
                        newContext = { ...pagination, n: start };
                        if (start === page) newContext.active = true;
                        ret = ret + options.fn(newContext);
                        start++;
                        i++;
                    }
                }
                else {
                    for (var i = 1; i <= pageCount; i++) {
                        newContext = { ...pagination, n: i };
                        if (i === page) newContext.active = true;
                        ret = ret + options.fn(newContext);
                    }
                }
                break;
            case 'previous':
                if (page === 1) {
                    newContext = { ...pagination, disabled: true, n: 1 }
                }
                else {
                    newContext = { ...pagination, n: page - 1 }
                }
                ret = ret + options.fn(newContext);
                break;
            case 'next':
                newContext = {};
                if (page === pageCount) {
                    newContext = { ...pagination, disabled: true, n: pageCount }
                }
                else {
                    newContext = { ...pagination, n: page + 1 }
                }
                ret = ret + options.fn(newContext);
                break;
            case 'first':
                if (page === 1) {
                    newContext = { ...pagination, disabled: true, n: 1 }
                }
                else {
                    newContext = { ...pagination, n: 1 }
                }
                ret = ret + options.fn(newContext);
                break;
            case 'last':
                if (page === pageCount) {
                    newContext = { ...pagination, disabled: true, n: pageCount }
                }
                else {
                    newContext = { ...pagination, n: pageCount }
                }
                ret = ret + options.fn(newContext);
                break;
        }

        return ret;
    },
    levelUser: (level) => {
        if (level == undefined){
            return 'clmmpro'
        }
        const data = [
            {
                name: 'Quản Trị Viên',
                level: 1
            },
            {
                name: 'Cộng Tác Viên',
                level: 2
            },
            {
                name: 'Demo',
                level: 0
            }
        ]

        return data.find(e => e.level == level).name || 'Lỗi';
    },
    checkQuery: (search, data) => utils.checkQuery(search, data.split(',')),
    momoStatus: (status) => {
        let html;

        switch (status) {
            case 'active':
                html = `<span class="badges badge-success">Hoạt Động</span>`;
                break;
            case 'limit':
                html = `<span class="badges badge-info">Giới Hạn</span>`;
                break;
            case 'pending':
                html = `<span class="badges badge-warning">Tạm Dừng</span>`;
                break;
            default:
                html = `<span class="badges badge-danger">Lỗi Số</span>`;
                break;
        }

        return html;
    },
    loginStatus: (status) => {
        let html;

        switch (status) {
            case 'refreshError':
                html = `<span class="badges badge-danger">Lỗi Refresh</span>`;
                break;
            case 'waitLogin':
                html = `<span class="badges badge-warning">Đợi Đăng Nhập</span>`;
                break;
            case 'errorLogin':
                html = `<span class="badges badge-danger">Lỗi Đăng Nhập</span>`;
                break;
            case 'active':
                html = `<span class="badges badge-success">Hoạt Động</span>`;
                break;
            case 'waitOTP':
                html = `<span class="badges badge-warning">Đợi OTP</span>`;
                break;
            case 'waitSend':
                html = `<span class="badges badge-warning">Đợi Gửi OTP</span>`;
                break;
            default:
                html = `<span class="badges badge-danger">Lỗi</span>`;
                break;
        }

        return html;
    },
    historyStatus: (status) => {
        let html;

        switch (status) {
            case 'wait':
                html = `<span class="badges badge-info">Đợi Xử Lý</span>`;
                break;
            case 'transfer':
                html = `<span class="badges badge-secondary">Chuyển Tiền</span>`;
                break;
            case 'recharge':
                html = `<span class="badges badge-success">Nạp Tiền</span>`;
                break;
            case 'withdraw':
                html = `<span class="badges badge-success">Rút Tiền</span>`;
                break;
            case 'errorComment':
                html = `<span class="badges badge-warning">Sai Nội Dung</span>`;
                break;
            case 'limitRefund':
                html = `<span class="badges badge-warning">Giới Hạn Hoàn</span>`;
                break;
            case 'limitBet':
                html = `<span class="badges badge-warning">Sai Hạn Mức</span>`;
                break;
            case 'refund':
                html = `<span class="badges badge-danger">Đã Hoàn Tiền</span>`;
                break;
            case 'waitReward':
                html = `<span class="badges badge-warning">Đợi Trả Thưởng</span>`;
                break;
            case 'waitRefund':
                html = `<span class="badges badge-warning">Đợi Hoàn Tiền</span>`;
                break;
            case 'win':
                html = `<span class="badges badge-success">Thắng Cược</span>`;
                break;
            case 'won':
                html = `<span class="badges badge-light">Thua Cược</span>`;
                break;
            case 'errorMoney':
                html = `<span class="badges badge-warning">Không Đủ Tiền</span>`;
                break;
            case 'limitPhone':
                html = `<span class="badges badge-danger">Giới Hạn Số</span>`;
                break;
            case 'errorPhone':
                html = `<span class="badges badge-danger">Lỗi Số</span>`;
                break;
            case 'phoneBlock':
                html = `<span class="badges badge-secondary">Đã Chặn Số</span>`;
                break;
            default:
                html = `<span class="badges badge-danger">Lỗi</span>`;
                break;
        }

        return html;
    }
}