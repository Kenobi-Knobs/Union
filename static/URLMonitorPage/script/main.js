    let isCheckedRadio = false; //выбранный сайт
    $(document).ready(function () {

        $('#home').on('click', function () {
            $(location).attr('href', '/');
        });

        $('#settings').on('click', function () {
            $(location).attr('href', '/settings');
        });

        $('#statistic').on('click', function () {
            $(location).attr('href', '/statistic');
        });

        $('#monitoring').on('click', function () {
            $(location).attr('href', '/url-monitor');
        });

        $(".quit").on('click', function () {
            $(location).attr('href', '/logout');
        });

        //    checking authorized user or not
        $.get(
            "api/isAuth", {},
            function (data) {
                data = JSON.parse(data);

                let userName;

                if (data.auth == "true") {
                    console.log("Auth is true");
                    $('#userName').text(data.mail);
                    $('html').css('display', 'block');
                    userName = data.mail.split('@');
                    $('#userName').text(userName[0]);
                }
                if (data.auth == "false") {
                    $(location).attr('href', '/login');
                }
            }
        );

        //получаем список URL
        $.get(
            "/api/getActivePingData", {},
            function (data) {
                data = JSON.parse(data);
                console.log(data);
                for (var key in data['pings']) {
                    //                console.log(data.pings[key]);
                    $('.listOfURL').append(
                        $('<li>').append(
                            $('<input>').attr({
                                type: 'radio',
                                name: 'urls',
                                id: data.pings[key].address,
                                value: data.pings[key].address
                            })
                        ).append(
                            $('<label>').attr({
                                for: data.pings[key].address
                            }).append(
                                $('<span>').text(data.pings[key].address)
                            )
                        )
                    );
                }

                if (isCheckedRadio == false) {
                    $('.alertText').text('Please choose the URL');
                }

                let urls = $('input[name=urls]')
                urls.on('change', function () {
                    $('.infoCard').slideDown(300);
                    $('.alertText').slideUp(300);
                    $('.list').remove();
                    $('.listOfURL').css('opacity', '0.1');
                    urls.prop('disabled', 'true');

                    setTimeout(function () {
                        $('.listOfURL').css('opacity', '1');
                        urls.removeAttr('disabled');
                    }, 800);

                    isChecked();
                    //                console.log(isCheckedRadio);

                    for (var key in data['pings']) {
                        if (data.pings[key].address == isCheckedRadio) {
                            if (data.pings[key].current_down == 'false') {
                                $('.currentStatus').text('Online');
                                $('.indicator').css('backgroundColor', '#7FFF6B');
                                $('.indicator').css('boxShadow', '0px 0px 0.1em 0.1em rgba(127,255,107,0.73)');
                            }
                            if (data.pings[key].current_down == 'true') {
                                $('.currentStatus').text('Offline');
                                $('.indicator').css('backgroundColor', '#FF2950');
                                $('.indicator').css('boxShadow', '0px 0px 0.1em 0.1em rgba(255,41,80,0.73)');
                            }

                            $('.interval').text(data.pings[key].ping_interval + ' min');
                            $('.downTimeout').text(data.pings[key].down_timing + ' min');

                            let sumOfDuring = 0;
                            if (data.pings[key].downs.length > 0) {
                                $('.down').slideDown(300);
                                $('.down').css('display', 'flex');
                                for (let i = 0; i < data.pings[key].downs.length; i++) {
                                    sumOfDuring += data.pings[key].downs[i].down_duration;

                                    let date = new Date(data.pings[key].downs[i].start_time * 1000);
                                    let year = date.getFullYear();
                                    let month = date.getMonth() + 1;
                                    let day = date.getDate();
                                    let hour = date.getHours();
                                    let minutes = date.getMinutes();

                                    $('.listOfDown').append(
                                        $('<li>').attr({
                                            class: 'list'
                                        }).append(
                                            $('<span>').attr({
                                                class: `time`
                                            }).text(day + '.' + month + '.' + year + ' ' + hour + ':' + minutes)
                                        ).append(
                                            $('<span>').attr({
                                                class: `during`
                                            }).text(data.pings[key].downs[i].down_duration + ' min')
                                        )
                                    );
                                }
                                $('.sumOfDuration').text(sumOfDuring + ' min');

                            } else {
                                $('.sumOfDuration').text(sumOfDuring + ' min');
                                $('.down').slideUp(300);
                            }
                        }
                    }


                });

            });

    });

    function isChecked() {
        $("input[name='urls']:checked").each(function () {
            isCheckedRadio = $(this).val();
        });
    }
