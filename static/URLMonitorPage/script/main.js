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
            'currentCode': 'Current code',
            'responseTime': 'Response time'
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
            'currentCode': 'Поточний код відповіді',
            'responseTime': 'Час відгуку'
        }
    };

    let currentLang; //язык, который выбран    
    let idOfRadioURL; //ид радиобатона урла
    let isCheckedRadio = false; //выбранный сайт
    $(document).ready(function () {
        getLocalLang();
        AcceptCookie = AcceptCookie();
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

        $('#dashboard').on('click', function () {
            $(location).attr('href', '/create-dashboard');
        });

        //    checking authorized user or not
        $.get(
            "api/isAuth", {},
            function (data) {
                data = JSON.parse(data);

                let userName;

                if (data.auth == "true") {
                    //                    console.log("Auth is true");
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
                //                console.log(data);
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
                                    id: `url_${key}`,
                                    value: data.pings[key].address
                                })
                            ).append(
                                $('<label>').attr({
                                    class: 'labelText'
                                }).append(
                                    $('<input>').attr({
                                        type: 'text',
                                        class: 'nameURL',
                                        readonly: true,
                                        value: data.pings[key].address
                                    })
                                )
                            ).append(
                                $('<label>').attr({
                                    class: 'labelCheck',
                                    for: `url_${key}`
                                }).append(
                                    $('<span>').attr({
                                        class: `check`,
                                        id: `url_${key}-check`
                                    })
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

                    let urls = $('input[name=urls]');
                    let checks = $('.check');

                    for (let i = 0; i < checks.length; i++) {
                        if (currentLang == 'en') {
                            $(`.check`).text('check');
                        }
                        if (currentLang == 'ua') {
                            $(`.check`).text('перевірити');
                        }

                    }
                    //                    console.log(checks);
                    urls.on('change', function () {
                        isChecked();
                        //                        console.log(isCheckedRadio);
                        for (let i = 0; i < checks.length; i++) {
                            if (currentLang == 'en') {
                                $(`.check`).text('check');
                            }
                            if (currentLang == 'ua') {
                                $(`.check`).text('перевірити');
                            }

                        }

                        for (let i = 0; i < checks.length; i++) {
                            if (checks.eq(i).attr('id').split('-')[0] == idOfRadioURL) {
                                if (currentLang == 'en') {
                                    $(`#${idOfRadioURL}-check`).text('checking');
                                }
                                if (currentLang == 'ua') {
                                    $(`#${idOfRadioURL}-check`).text('перевіряється');
                                }

                            }
                        }

                        $('.infoCard').slideDown(300);
                        $('.alertText').slideUp(300);
                        $('.list').remove();
                        $('.listOfURL').css('opacity', '0.1');
                        urls.prop('disabled', 'true');

                        setTimeout(function () {
                            $('.listOfURL').css('opacity', '1');
                            urls.removeAttr('disabled');
                        }, 800);


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
                                    $('.responseTime').text(data.pings[key].response_time / 1000 + ' s');
                                }
                                if (currentLang == 'ua') {
                                    $('.interval').text(data.pings[key].ping_interval + ' хв');
                                    $('.downTimeout').text(data.pings[key].down_timing + ' хв');
                                    $('.responseTime').text(data.pings[key].response_time / 1000 + ' с');
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
            idOfRadioURL = $(this).attr('id');
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

    //cookieBar
    (function (window, undefined) {
        "use strict";
        var document = window.document;

        function log() {
            if (window.console && window.console.log) {
                for (var x in arguments) {
                    if (arguments.hasOwnProperty(x)) {
                        window.console.log(arguments[x]);
                    }
                }
            }
        }

        function AcceptCookie() {
            if (!(this instanceof AcceptCookie)) {
                return new AcceptCookie();
            }
            this.init.call(this);
            return this;
        }
        AcceptCookie.prototype = {
            init: function () {
                var self = this;
                if (self.readCookie('pjAcceptCookie') == null) {
                    self.appendCss();
                    self.addCookieBar();
                }
                var clear_cookie_arr = self.getElementsByClass("pjClearCookie", null, "a");
                if (clear_cookie_arr.length > 0) {
                    self.addEvent(clear_cookie_arr[0], "click", function (e) {
                        if (e.preventDefault) {
                            e.preventDefault();
                        }
                        self.eraseCookie('pjAcceptCookie');
                        document.location.reload();
                        return false;
                    });
                }
            },
            getElementsByClass: function (searchClass, node, tag) {
                var classElements = new Array();
                if (node == null) {
                    node = document;
                }
                if (tag == null) {
                    tag = '*';
                }
                var els = node.getElementsByTagName(tag);
                var elsLen = els.length;
                var pattern = new RegExp("(^|\\s)" + searchClass + "(\\s|$)");
                for (var i = 0, j = 0; i < elsLen; i++) {
                    if (pattern.test(els[i].className)) {
                        classElements[j] = els[i];
                        j++;
                    }
                }
                return classElements;
            },
            addEvent: function (obj, type, fn) {
                if (obj.addEventListener) {
                    obj.addEventListener(type, fn, false);
                } else if (obj.attachEvent) {
                    obj["e" + type + fn] = fn;
                    obj[type + fn] = function () {
                        obj["e" + type + fn](window.event);
                    };
                    obj.attachEvent("on" + type, obj[type + fn]);
                } else {
                    obj["on" + type] = obj["e" + type + fn];
                }
            },
            createCookie: function (name, value, days) {
                var expires;
                if (days) {
                    var date = new Date();
                    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                    expires = "; expires=" + date.toGMTString();
                } else {
                    expires = "";
                }
                document.cookie = name + "=" + value + expires + "; path=/";
            },
            readCookie: function (name) {
                var nameEQ = name + "=";
                var ca = document.cookie.split(';');
                for (var i = 0; i < ca.length; i++) {
                    var c = ca[i];
                    while (c.charAt(0) === ' ') {
                        c = c.substring(1, c.length);
                    }
                    if (c.indexOf(nameEQ) === 0) {
                        return c.substring(nameEQ.length, c.length);
                    }
                }
                return null;
            },
            eraseCookie: function (name) {
                var self = this;
                self.createCookie(name, "", -1);
            },
            appendCss: function () {
                var self = this;
                var cssId = 'pjAcceptCookieCss';
                if (!document.getElementById(cssId)) {
                    var head = document.getElementsByTagName('head')[0];
                    var link = document.createElement('link');
                    link.id = cssId;
                    link.rel = 'stylesheet';
                    link.type = 'text/css';
                    link.href = 'https://fonts.googleapis.com/css?family=Open+Sans';
                    link.media = 'all';
                    head.appendChild(link);
                }
                var cssCode = "";
                cssCode += "#pjAcceptCookieBar .pjAcceptCookieBarBtn,";
                cssCode += "#pjAcceptCookieBar .pjAcceptCookieBarBtn:after { -webkit-transition: all .5s ease-in-out; -moz-transition: all .5s ease-in-out; -ms-transition: all .5s ease-in-out; -o-transition: all .5s ease-in-out; transition: all .5s ease-in-out; }";
                cssCode += "#pjAcceptCookieBar { position: fixed; bottom: 0; left: 0; z-index: 9999; overflow-x: hidden; overflow-y: auto; width: 100%; max-height: 100%; padding: 10px 0; background: #F26B6B; opacity: 0.8; font-family: 'Open Sans', sans-serif; text-align: center;}";
                cssCode += "#pjAcceptCookieBar * { padding: 0; margin: 0; outline: 0; -webkit-box-sizing: border-box; -moz-box-sizing: border-box; box-sizing: border-box; }";
                cssCode += "#pjAcceptCookieBar .pjAcceptCookieBarShell { width: 90%; margin: 0 auto; }";
                cssCode += "#pjAcceptCookieBar a[href^=tel] { color: inherit; }";
                cssCode += "#pjAcceptCookieBar a:focus,";
                cssCode += "#pjAcceptCookieBar button:focus { outline: unset; outline: none; }";
                cssCode += "#pjAcceptCookieBar p { font-size: 14px; line-height: 1.4; color: #fff; font-weight: 400; }";
                cssCode += "#pjAcceptCookieBar .pjAcceptCookieBarActions { padding-top: 10px; }";
                cssCode += "#pjAcceptCookieBar .pjAcceptCookieBarBtn { position: relative; display: inline-block; height: 20px; padding: 0 30px; border: 0; background: #F2BDBD; opacity: 0.9; font-size: 14px; line-height: 14px; color: #fff; text-decoration: none; vertical-align: middle; cursor: pointer; border-radius: 0; -webkit-appearance: none; -webkit-border-radius: 0; -webkit-transform: translateZ(0); transform: translateZ(0); -webkit-backface-visibility: hidden; backface-visibility: hidden; -moz-osx-font-smoothing: grayscale; }";
                cssCode += "@media only screen and (max-width: 767px) {";
                cssCode += "#pjAcceptCookieBar { padding: 15px 0; }";
                cssCode += "#pjAcceptCookieBar .pjAcceptCookieBarShell { width: 96%; }";
                cssCode += "#pjAcceptCookieBar p { font-size: 14px; }";
                cssCode += "}";
                var styleElement = document.createElement("style");
                styleElement.type = "text/css";
                if (styleElement.styleSheet) {
                    styleElement.styleSheet.cssText = cssCode;
                } else {
                    styleElement.appendChild(document.createTextNode(cssCode));
                }
                document.getElementsByTagName("head")[0].appendChild(styleElement);
            },
            addCookieBar: function () {
                var self = this;
                var htmlBar = '';
                htmlBar += '<div class="pjAcceptCookieBarShell"><form action="#" method="post">';
                if (currentLang == 'en') {
                    htmlBar += '<p>We use cookies to improve the site and user experience. By continuing to browse the site, you agree to our use of cookies. You can always disable cookies in your browser settings.</p>';
                }
                if (currentLang == 'ua') {
                    htmlBar += '<p>Ми використовуємо файли cookie для поліпшення роботи сайту та зручності користувачів. Продовжуючи переглядати сайт, ви погоджуєтеся на використання файлів cookie. Ви завжди можете відключити файли cookie в налаштуваннях свого браузера.</p>';
                }

                htmlBar += '<div class="pjAcceptCookieBarActions"><button type="button" class="pjAcceptCookieBarBtn">ОК</button></div></form></div>';
                var barDiv = document.createElement('div');
                barDiv.id = "pjAcceptCookieBar";
                document.body.appendChild(barDiv);
                barDiv.innerHTML = htmlBar;
                self.bindCookieBar();
            },
            bindCookieBar: function () {
                var self = this;
                var btn_arr = self.getElementsByClass("pjAcceptCookieBarBtn", null, "button");
                if (btn_arr.length > 0) {
                    self.addEvent(btn_arr[0], "click", function (e) {
                        if (e.preventDefault) {
                            e.preventDefault();
                        }
                        self.createCookie('pjAcceptCookie', 'YES', 365);
                        document.getElementById("pjAcceptCookieBar").remove();
                        return false;
                    });
                }
            }
        };
        window.AcceptCookie = AcceptCookie;
    })(window);
