    let arrLang = {
        'en': {
            'titleUptime': 'Uptimes',
            'titleInformation': 'Information',
            'status': 'Status',
            'down': 'Down',
            'timeDown': 'Down time',
            'code': 'Code',
            'during': 'During',
            'monitoringConfig': 'Monitoring config',
            'interval': 'Interval',
            'downTimeout': 'Down timeout',
            'currentCode': 'Current code'
        },
        'ua': {
            'titleUptime': 'Моніторинг',
            'titleInformation': 'Інформація',
            'status': 'Статус',
            'down': 'Падіння',
            'timeDown': 'Час падіння',
            'code': 'Код',
            'during': 'Час офлайн',
            'monitoringConfig': 'Конфігурація моніторингу',
            'interval': 'Інтервал перевірок',
            'downTimeout': 'Час за який URL вважаеться недоступним',
            'currentCode': 'Поточний код відповіді'
        }
    };

    let currentLang; //язык, который выбран    

    let isCheckedRadio = false; //выбранный сайт
    $(document).ready(function () {
        getLocalLang();
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
                console.log(data['pings'].length);
                if (data['pings'].length == 0) {
                    $('.url').css('display', 'none');
                    $('.alert').css('display', 'block');
                    if (currentLang == 'en') {
                        $('.alertText').text('There is nothing to show. Please go to settings to add your first URL');
                    }
                    if (currentLang == 'ua') {
                        $('.alertText').text('Поки що немає URL. Будь ласка, перейдіть у налаштування, щоб додати');
                    }
                } else {
                    $('.url').css('display', 'block');
                    $('.alert').css('display', 'none');
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
                        $('.alert').css('display', 'block');
                        if (currentLang == 'en') {
                            $('.alertText').text('Please choose the URL');
                        }
                        if (currentLang == 'ua') {
                            $('.alertText').text('Будь ласка оберіть URL');
                        }

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

                                if (currentLang == 'en') {
                                    $('.interval').text(data.pings[key].ping_interval + ' min');
                                    $('.downTimeout').text(data.pings[key].down_timing + ' min');
                                }
                                if (currentLang == 'ua') {
                                    $('.interval').text(data.pings[key].ping_interval + ' хв');
                                    $('.downTimeout').text(data.pings[key].down_timing + ' хв');
                                }



                                $('.currentStatusCode').text(data.pings[key].last_code);

                                if (data.pings[key].downs.length > 0) {
                                    $('.down').slideDown(300);
                                    $('.down').css('display', 'flex');
                                    for (let i = 0; i < data.pings[key].downs.length; i++) {

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
                                                $('<div>').attr({
                                                    class: 'listOfDownPosition'
                                                }).append(
                                                    $('<div>').attr({
                                                        class: 'timeWrapper'
                                                    }).append(
                                                        $('<span>').attr({
                                                            class: `time`
                                                        }).text(day + '.' + month + '.' + year + ' ' + hour + ':' + minutes)
                                                    )
                                                ).append(
                                                    $('<div>').attr({
                                                        class: 'statusWrapper'
                                                    }).append(
                                                        $('<span>').attr({
                                                            class: `statusList`
                                                        }).text(data.pings[key].downs[i].code)
                                                    )
                                                ).append(
                                                    $('<div>').attr({
                                                        class: 'duringWrapper'
                                                    }).append(
                                                        $('<span>').attr({
                                                            class: `during`
                                                        }).text(data.pings[key].downs[i].down_duration + ' min')
                                                    )
                                                )
                                            )

                                        );
                                    }

                                } else {
                                    $('.down').slideUp(300);
                                }
                            }
                        }


                    });
                }
            });

    });

    function isChecked() {
        $("input[name='urls']:checked").each(function () {
            isCheckedRadio = $(this).val();
        });
    }


    function getLocalLang() {
        let langs;
        if (localStorage.getItem('langs') === null) {
            langs = [];

        } else {
            langs = JSON.parse(localStorage.getItem('langs'));
        }
        langs.forEach(function (language) {
            let lang = langs[langs.length - 1];
            currentLang = lang;
            setTimeout(() => {

                $('.langText').each(function (index, item) {
                    $(this).text(arrLang[lang][$(this).attr('key')]);
                });
                $('.langBtn').each(function (index, item) {
                    $(this).val(arrLang[lang][$(this).attr('key')]);
                });
                $('.langPlaceholder').each(function (index, item) {
                    $(this).attr('placeholder', arrLang[lang][$(this).attr('key')]);
                });
                $('.langHtml').each(function (index, item) {
                    $(this).html(arrLang[lang][$(this).attr('key')]);
                });

            }, 0);
        })
    }
