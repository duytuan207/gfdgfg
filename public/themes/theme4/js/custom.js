$(document).ready(function (e) {
    typingEffect("#mainTitle", [$('#mainTitle').data('text')]);
    setInterval(colorComment, 1000);

    $('body').on('click', '.games', function (e) {
        $('html, body').animate({
            scrollTop: $(".box-cl").offset().top
        }, 500);
    })
    $('body').on('click', '.games[data-type]', function (e) {
        $('.tab-panel[data-type="game"]').show();
        $('.tab-panel[data-type="mini-game"]').hide();
    })

    $('body').on('click', 'button[data-game]', function (e) {
        let game = $(this).data('game');
        $('.tab-panel[data-type="game"]').hide();
        $('.tab-panel[data-type="mini-game"]').hide();
        $(`.tab-panel[data-type="mini-game"][data-name="${game}"]`).show();
    })

    $('body').on('click', '.button-muster', function (e) {
        let id = $(this).data('key');

        $('#muster-guide').hide();
        $('#muster-history').hide();
        $(`#${id}`).show();
    })

    $('body').on('click', '#checkTransId button', function (e) {
        let transId = $(`#checkTransId input[name="transId"]`).val();

        axios.post('../api/v2/checkTransId', { transId })
            .then(res => {
                (!res.data.success && res.data.data) ? checkByPhone(transId) : loadTransId(null, res.data)
            }).catch(err => {
                loadTransId(err, null);
            })
    })

    $('body').on('click', '#jackpot button', function (e) {
        let action = $('#jackpot button').attr('data-action');
        let phone = $('#jackpot input[name="phone"]').val();

        if (!action) return swal('Thông Báo', 'Thiếu dữ liệu hoặc lỗi!', 'warning');

        jackpotAction();
        axios.post(`../api/v2/jackpot/${action}`, { phone })
            .then(res => {
                jackpotAction(null, null, res.data);
            }).catch(err => {
                jackpotAction(null, err);
            })
    })

    $('body').on('click', '.transId-refund', function (e) {
        let transId = $(this).data('id');

        if (!transId) return swal('Thông Báo', 'Có lỗi xảy ra, hãy thử lại!', 'warning');

        refundTransId();
        axios.post('../api/v2/refundTransId', { transId })
            .then(res => {
                refundTransId(null, null, res.data);
            }).catch(err => {
                refundTransId(null, err, null);
            })
    })

})

function numberCopy(data) {
    let _this = $(data.trigger);

    swal({
        title: 'Thông báo',
        text: `Đã sao chép số điện thoại ${data.text} ${_this.data('name')}\nVui lòng cược tối thiểu ${Intl.NumberFormat('en-US').format(_this.data('min'))}đ và tối đa ${Intl.NumberFormat('en-US').format(_this.data('max'))}đ\nChúc bạn may mắn ❤\nTrả thưởng chỉ 5 giây!`,
        icon: 'success',
        timer: 10000,
    }).then(() => swal('HÃY CHÚ Ý', 'SỐ TRẢ THƯỞNG CHỈ DÙNG ĐỂ TRẢ THƯỞNG,\n KHÔNG ĐÁNH VÀO SỐ TRẢ THƯỞNG NHA!', 'warning'));
}

function loadGame(err, response) {
    err && swal('Thông Báo', `Có lỗi xảy ra ${err.message}`, 'warning');
    !response.success && swal('Thông Báo', response.message, 'error');

    if (response.success) {
        $('#list-game').html('');

        response.data.map((data, index) => {
            $('#list-game').append(`<button class="btn btn-${index == 0 ? 'primary' : 'default'} mt-1 rounded-pill games" data-name="${data.name}" data-description="${data.description}" data-type="${data.gameType}">${data.name}</button>`);
        });
    }
}

function loadReward(err, response) {
    let colors = [
        'comment-red',
        'comment-green',
        'comment-blue',
        'comment-orange'
    ]
    let dataGame = $('.games.btn-primary');

    err && swal('Thông Báo', `Có lỗi xảy ra ${err.message}`, 'warning');
    !response.success && swal('Thông Báo', response.message, 'error');

    if (response.success) {
        $('#gameNoti').html(dataGame.data('description'));
        $('#tableReward').html('');

        response.data.map((data) => {
            $('#tableReward').append(`<tr><td><span class="fa-stack"><span class="fa fa-circle fa-stack-2x ${colors[Math.floor(Math.random() * colors.length)]}"></span><span class="fa-stack-1x text-white">${data.content}</span></span></td><td><code>${data.numberTLS.join(`</code> - <code>`)}</code></td><td><b>x${data.amount} tiền cược</b></td></tr>`);
        });
    }

}

function loadPhone(err, response) {
    err && swal('Thông Báo', `Có lỗi xảy ra ${err.message}`, 'warning');
    !response.success && swal('Thông Báo', response.message, 'error');

    if (response.success) {
        $('#tablePhone, #tableStatus').html('');

        response.data.map((data) => {
            data.status == 'active' && (data.amountDay + 2 * data.betMax >= data.limitDay || data.amountMonth + 2 * data.betMax >= data.limitMonth || data.count + 10 >= data.number) && (data.status = "pendingStop");
            $('#tablePhone').append(`<tr><td><b>${data.phone}</b> <span class="label label-success text-uppercase copy-text" data-clipboard-text="${data.phone}" data-name="${data.name}" data-min="${data.betMin}" data-max="${data.betMax}"><i class="fa fa-clipboard" aria-hidden="true"></i></span><br><b class="text-phone"><font color="green">${convertCurrency(data.amountDay)}</font>/<font color="6861b1">${convertCurrency(data.limitDay)}</font> ~ <font color="blue">${data.count}</font>/<font color="6861b1">${data.number}</font></b></td><td>${Intl.NumberFormat('en-US').format(data.betMin)} VNĐ</td><td>${Intl.NumberFormat('en-US').format(data.betMax)} VNĐ</td> </tr>`);
            $('#tableStatus').append(`<tr><td><b>${data.phone}</b> <span class="label label-success text-uppercase copy-text" data-clipboard-text="${data.phone}" data-name="${data.name}" data-min="${data.betMin}" data-max="${data.betMax}"><i class="fa fa-clipboard" aria-hidden="true"></i></span></td><td>${data.status == 'active' ? '<span class="label label-success text-uppercase">Hoạt động</span>' : (data.status == 'pendingStop' ? '<span class="label label-warning text-uppercase">Sắp bảo trì</span>' : `<span class="label label-danger text-uppercase">Bảo trì</span>`)}</td><td><b style="color:blue;font-size: 12px;">${Intl.NumberFormat('en-US').format(data.count)}</b></td><td>${convertCurrency(data.amountDay)} VNĐ</td></tr>`);
        });
    }

}

function loadHistory(err, response) {
    err && swal('Thông Báo', `Có lỗi xảy ra ${err.message}`, 'warning');
    !response.success && swal('Thông Báo', response.message, 'error');

    if (response.success) {
        $('#tableHistory').html('');

        response.data.map((data) => {
            $('#tableHistory').append(`<tr><td>${data.phone}</td><td>${Intl.NumberFormat('en-US').format(data.amount)}</td><td>${Intl.NumberFormat('en-US').format(data.bonus)}</td><td>${data.gameName}</td><td><span class="fa-stack"><span class="fa fa-circle fa-stack-2x color-comment" style="color:#${Math.floor(Math.random() * 16777215).toString(16)}"></span><span class="fa-stack-1x text-white text-uppercase">${data.content}</span></span></td><td><span class="label label-success text-uppercase">Thắng</span></td></tr>`);
        })
    }
}

function loadMission(action, err, response) {
    if (action == 'start') {
        $('#checkMission button').prop('disabled', true).html('Đang truy vấn...');
        return;
    }
    err && swal('Thông Báo', `Có lỗi xảy ra ${err.message}`, 'warning');

    $('#checkMission button').prop('disabled', false).html('Kiểm Tra');
    $('.result-mission').remove();
    !response.success && swal('Thông Báo', response.message, 'error');
    response.success && $('#checkMission').append(`<div class="form-group box-success result-mission"><h5 class="text-red">Xin Chào </h5><h4>${response.data.name}</h4><p style="color:blue;">Bạn đã chơi : ${Intl.NumberFormat('en-US').format(response.data.count)}đ</p></div>`)
}

function loadMuster(err, response) {
    err && swal('Thông Báo', `Có lỗi xảy ra ${err.message}`, 'warning');
    !response.success && swal('Thông Báo', response.message, 'error');

    if (response.success && response.data) {

        $('#muster-session').html(`#${response.data.code}`);
        $('.muster-count').html(Intl.NumberFormat('en-US').format(response.data.count));
        $('#muster-winner').html(response.data.win);
        $('#muster-bonus').html(`${Intl.NumberFormat('en-US').format(response.data.bonus)}`);
        $('.muster-time').html(response.data.second);
    }

}

function loadHistoryMuster(err, response) {
    err && swal('Thông Báo', `Có lỗi xảy ra ${err.message}`, 'warning');
    !response.success && swal('Thông Báo', response.message, 'error');

    if (response.success) {
        $('#tableMuster').html('');

        response.data.map((data) => {
            $('#tableMuster').append(`<tr><td><small>#${data.code}</small></td><td>${data.phone}</td><td>${Intl.NumberFormat('en-US').format(data.amount)}</td></tr>`);
        })
    }
}

function addMuster(action = 'start', err, response) {
    if (action == 'start') {
        $('#addMuster button').prop('disabled', true).html('Đang xử lý...');
        return;
    }

    err && swal('Thông Báo', `Có lỗi xảy ra ${err.message}`, 'warning');

    $('#addMuster button').prop('disabled', false).html('Điểm danh'), !err && swal('Thông Báo', response.message, response.success ? 'success' : 'error');
}

function checkGift(action = 'start', err, response) {
    if (action == 'start') {
        $('#checkGift button').prop('disabled', true).html('Đang xử lý...');
        return;
    }

    err && swal('Thông Báo', `Có lỗi xảy ra ${err.message}`, 'warning');

    $('#checkGift button').prop('disabled', false).html('Kiểm tra'), !err && swal('Thông Báo', response.message, response.success ? 'success' : 'error');
}

function checkByPhone(transId) {
    swal({
        text: 'Bạn đã chuyển tiền đến số nào trên hệ thống',
        content: {
            element: "input",
            attributes: {
                placeholder: "Nhập số bạn đã chuyển tiền trên hệ thống",
                type: "number",
            },
        },
        buttons: [true, 'Tìm tiếp'],
        icon: `https://i.imgur.com/52hY3gx.png`
    }).then((result) => {
        if (result) {
            axios.post('../api/v2/checkTransId', { phone: result, transId })
                .then(res => {
                    loadTransId(null, res.data);
                }).catch(err => {
                    loadTransId(err, null);
                })
        }
    })
}

function loadTransId(err, response) {
    err && swal('Thông Báo', `Có lỗi xảy ra ${err.message}`, 'warning');
    !response.success && swal('Thông Báo', response.message, 'error');

    if (response.success) {
        let status, refund;
        let data = response.data;

        switch (data.status) {
            case 'wait':
                status = 'Đang xử lý';
                break;
            case 'done':
                status = 'Đã xử lý';
                break;
            case 'limitBet':
                refund = true;
                status = 'Sai hạn mức';
                break;
            case 'errorComment':
                refund = true;
                status = 'Sai nội dung';
                break;
            case 'limitRefund':
                status = 'Giới hạn hoàn';
                break;
            default:
                status = 'Lỗi xử lý';
                break;
        }

        $('.transId-refund').remove();
        refund && $('#modalDetail .modal-footer').append(`<button class="btn btn-warning transId-refund" data-id="${data.transId}">Hoàn tiền</button>`);
        $('#modalDetail .modal-body').html(`<p>Mã GD: <b style="color:#00cc66;">${data.transId}</b></p><p>SĐT: <b style="color:brown;">${data.phone}</b></p><p>Số Tiền: <b style="color:#ff0066;">${Intl.NumberFormat('en-US').format(data.amount)} VNĐ</b></p><p>Nội Dung: <b style="color:blue;">${data.content}</b></p><hr><h3 class="text-success"><b>Thông Tin Trò Chơi</b></h3><div style="margin: 0px; float: center; border: 1px dashed rgb(226, 93, 219); padding: 5px;"><p>Loại Trò Chơi: <b style="color:#ff0066;">${data.gameName}</b></p><p>Kết Quả: <b style="color:#00cc66;">${data.result == 'unknown' ? 'Không xác định' : (data.result == 'win' ? 'Thắng' : 'Thua')}</b></p><p>Tiền Nhận: <b style="color:#ff0066;">${Intl.NumberFormat('en-US').format(data.bonus)} VNĐ</b></p><p>Trạng Thái: <b style="color:#0000ff;">${status}</b></p><p>Thời Gian: <b style="color:#000000;">${data.time}</b></p></div>`);
        $("#modalDetail").modal('show');
    }
}

function refundTransId(action = 'start', err, response) {
    if (action == 'start') {
        $('#modalDetail .transId-refund').prop('disabled', true).html('Đang xử lý...');
        return;
    }

    $('#modalDetail').modal('hide'), $('#modalDetail .transId-refund').remove();
    err && swal('Thông Báo', `Có lỗi xảy ra ${err.message}`, 'warning');
    !err && swal('Thông Báo', response.message, response.success ? 'success' : 'error');
}

function jackpotCheck(action = 'start', err, response) {
    if (action == 'start') {
        $('#jackpot button').html('Đang xử lý...').prop('disabled', true);
        return;
    }

    err && swal('Thông Báo', `Có lỗi xảy ra ${err.message}`, 'warning');
    !response.success && swal('Thông Báo', response.message, 'error');

    $('#jackpot button').html('Tham Gia').prop('disabled', false);

    response.success && $('#jackpot button').attr('data-action', response.data.isJoin == 1 ? 'out' : 'join').html(response.data.isJoin == 1 ? 'Huỷ' : 'Tham Gia').prop('disabled', false);
}

function jackpotAction(action = 'start', err, response) {
    if (action == 'start') {
        $('#jackpot button').html('Đang xử lý...').prop('disabled', true);
        return;
    }

    err && swal('Thông Báo', `Có lỗi xảy ra ${err.message}`, 'warning');

    $('#jackpot input[name="phone"]').val(''), $('#jackpot button').html('Tham Gia').prop('disabled', false), !err && swal('Thông Báo', response.message, response.success ? 'success' : 'error');
}


function colorComment() {
    $(".color-comment").each(function () {
        $(this).css("color", `#${Math.floor(16777215 * Math.random()).toString(16)}`);
    })
}