    let arrLang = {
        'en': {
            'titleSettings': 'Settings',
            'titleLanguage': 'Language',
            'titleDocs': 'Docs',
            'readThe': `Read the <a href="/doc">privacy policy</a> or <a href="/javadoc">javadoc</a>`,
            'titleAdmin': 'Admin',
            'goToAdmin': `Go to <a href='/admin'> admin page</a>`,
            'titleServers': 'Servers',
            'addNew': 'Add new',
            'deleteYes': 'Yes',
            'deleteCancel': 'Cancel',
            'address': 'Address',
            'pingInterval': 'Ping interval (min)',
            'downTime': 'Down timing (min)',
            'save': 'Save',
            'public': 'Public key',
            'secret': 'Secret key',
            'host': 'Host',
            'bugReportQuestion': `Did you find bugs and didn't even tell us?`,
            'bugReportMail': `Write here faster t5@tss2020.repositoryhosting.com`,
            'passwordHeader': 'Password',
            'passwordLink': `<a href="/reset">Change</a>`,
            'deleteText': 'Delete me',
            'deleteButton': `<a class='deleteButton'>Delete</a>`

        },
        'ua': {
            'titleSettings': 'Налаштування',
            'titleLanguage': 'Мова',
            'titleDocs': 'Документи',
            'readThe': `Прочитати <a href="/doc">угоду користувача</a> або <a href="/javadoc">javadoc</a>`,
            'titleAdmin': 'Адмін',
            'goToAdmin': `Перейти до <a href='/admin'> адмін сторінки</a>`,
            'titleServers': 'Сервери',
            'addNew': 'Додати новий',
            'deleteYes': 'Так',
            'deleteCancel': 'Відміна',
            'address': 'Адреса',
            'pingInterval': 'Інтервал перевірок (хв)',
            'downTime': 'Час за який URL вважаеться недоступним (хв)',
            'save': 'Зберегти',
            'public': 'Публічний ключ',
            'secret': 'Секретний ключ',
            'host': 'Хост',
            'bugReportQuestion': `Ви знайшли баги та не повідомили нас?`,
            'bugReportMail': `Швидше пишіть сюди t5@tss2020.repositoryhosting.com`,
            'passwordHeader': 'Пароль',
            'passwordLink': `<a href="/reset">Змінити</a>`,
            'deleteText': 'Видалити аккаунт',
            'deleteButton': `<a class='deleteButton'>Видалити</a>`

        }
    };

    let currentLang; //язык, который выбран
    let public_keyToDelete; //сервер, который надо удалить
    let addresToDelete; //сервер, который надо удалить



    $(document).ready(function () {
        let pingIntervalStart; //начало диапазона для ping interval
        let pingIntervalEnd; //конец диапазона для ping interval
        let maxDownTiming; //максимальный dowmtiming
        //        $('html').css('overflowY', 'hidden');
        $('.loaderWrapper').css('display', 'block');
        getLocalLang();
        AcceptCookie = AcceptCookie();
        //    checking authorized user or not
        $.get(
            "api/isAuth", {},
            function (data) {
                data = JSON.parse(data);

                let userName;

                if (data.auth == "true") {
                    //                    console.log("Auth is true");
                    $('#userName').text(data.mail);
                    $('.pageWrapper').css('display', 'flex');
                    userName = data.mail.split('@');
                    $('#userName').text(userName[0]);

                    $('.deleteButtonBlock').on('click', function () {

                        $.get('api/getUser', {}, function (data) {
                            data = JSON.parse(data);
                            if (data.settings.status == 'admin') {
                                alert('Can`t delete admin`s account');
                            } else {
                                //                                console.log(data.mail);
                                $.ajax({
                                    url: 'api/deleteUser',
                                    type: 'get',
                                    headers: {
                                        'csrf': getCookie('csrf_token')
                                    },
                                    data: {
                                        mail: data.mail
                                    },
                                    dataType: 'json',
                                    success: function (data) {
                                        //                                data = JSON.parse(data);
                                        //                                        console.log(data);
                                        if (data.user_delete == 'true') {
                                            $(location).attr('href', '/logout');
                                        }
                                        if (data.user_delete == 'false') {
                                            alert('Something went wrong');
                                        }

                                    }
                                });
                                //                    });
                            }
                        });
                    });
                }
                if (data.auth == "false") {
                    $(location).attr('href', '/login');
                }
            }
        );




        $(".quit").on('click', function () {
            $(location).attr('href', '/logout');
        });

        $('#home').on('click', function () {
            $(location).attr('href', '/');
        });

        $('#settings').on('click', function () {
            $(location).attr('href', '/settings');
        });

        $('#average').on('click', function () {
            $(location).attr('href', '/statistic');
        });

        $('#monitoring').on('click', function () {
            $(location).attr('href', '/url-monitor');
        });
        $('#dashboard').on('click', function () {
            $(location).attr('href', '/create-dashboard');
        });

        //смотрим статус юзера, является ли он админом
        $.get('api/getUser', {}, function (data) {
            data = JSON.parse(data);
            //            console.log(data);
            localStorage.clear();
            if (data.settings.lang == 'en') {
                $('#changeEN').prop('checked', 'true');
                currentLang = 'en';
                saveLocalLang(currentLang);
            }
            if (data.settings.lang == 'ua') {
                $('#changeUA').prop('checked', 'true');
                currentLang = 'ua';
                saveLocalLang(currentLang);
            }

            if (data.settings.status == 'admin') {
                $('#settingsList').append(
                    $('<li>').append(
                        $('<div>').attr({
                            class: 'option'
                        }).append(
                            $('<span>').attr({
                                class: 'titleOption langText',
                                key: 'titleAdmin'
                            })
                            .text('Admin')
                        ).append(
                            $('<span>').attr({
                                class: 'langHtml',
                                key: 'goToAdmin'
                            })
                            .html(`Go to <a href='/admin'> admin page</a>`)
                        )
                    )
                )
                getLocalLang();
                pingIntervalStart = 1;
                pingIntervalEnd = 100;
                maxDownTiming = 100;
            }
            if (data.settings.status == 'user') {
                pingIntervalStart = 5;
                pingIntervalEnd = 60;
                maxDownTiming = 60;
            }
            if (data.settings.status == 'premium_user') {
                pingIntervalStart = 1;
                pingIntervalEnd = 100;
                maxDownTiming = 100;

            }

            //            console.log(pingIntervalStart);
            //            console.log(pingIntervalEnd);



            //валидация добавление URL
            $('#formAddURL').validate({
                rules: {
                    address: {
                        required: true,
                        validAddress: true
                    },
                    pingInterval: {
                        required: true,
                        range: [pingIntervalStart, pingIntervalEnd]
                    },
                    downTiming: {
                        required: true,
                        greaterThan: '#addPingInterval',
                        max: maxDownTiming
                    }
                },
                messages: {
                    address: {

                    },
                    pingInterval: {

                    },
                    downTiming: {

                    }
                },
                submitHandler: function () {
                    addNewURL();
                }
            });

            $.validator.addMethod("greaterThan",
                function (value, element, param) {
                    var $otherElement = $(param);
                    return parseInt(value, 10) >= parseInt($otherElement.val(), 10);
                });


            $.validator.addMethod("validAddress", function (value, element) {
                return this.optional(element) || /^([\w0-9-.]+)\.(\w{2,})((\/[\w-.]+)*\/?)([\w?=#&.-]*)?(#[\w\-]+)?$/gm.test(value);
            });

        });

        let langsInput = $('input[name=changeLanguage]');

        langsInput.on('change', function () {
            let currentLang = $(this).val();
            $.get(
                'api/changeLang', {
                    lang: currentLang
                },
                function (data) {
                    data = JSON.parse(data);
                    //                console.log(data);
                    if (data.change == 'true') {
                        saveLocalLang(currentLang);
                        //                        AcceptCookie = AcceptCookie();
                    }
                }
            );
        });


        //валидация добавление агентов
        $('#formAddServer').validate({
            rules: {
                public: {
                    required: true,
                    validPublic: true
                },
                secret: {
                    required: true,
                    validSecret: true
                },
                host: {
                    required: true,
                    validHost: true
                }
            },
            messages: {
                public: {

                },
                secret: {

                },
                host: {

                }
            },
            submitHandler: function () {
                addNewServer();
            }
        });

        $.validator.addMethod("validPublic", function (value, element) {
            return this.optional(element) || /^[a-zA-Z]+[a-zA-Z0-9_-]*$/gi.test(value);
        });
        $.validator.addMethod("validSecret", function (value, element) {
            return this.optional(element) || /^[a-zA-Z0-9\-]+$/gm.test(value);
        });
        $.validator.addMethod("validHost", function (value, element) {
            return this.optional(element) || /^[\w0-9.]+\.\w{2,}$/gm.test(value);
        });

        //получаем список агентов
        $.get(
            "/api/getAgentList", {},
            function (data) {
                data = JSON.parse(data);

                for (var key in data['agents']) {
                    //                console.log(data.agents[key].public_key);
                    $('.listOfServers').append(
                        $('<li>').append(
                            $('<span>').attr({
                                class: "nameServer",
                                id: data.agents[key].public_key,
                            }).text(data.agents[key].public_key)
                        ).append(
                            $('<span>').attr({
                                class: `trashIcon`,
                                id: data.agents[key].public_key + "_Delete"
                            }).append(
                                $('<i>').attr({
                                    class: "far fa-trash-alt",
                                })
                            )
                        )
                    );
                }

                let trashIconsServers = $('.trashIcon');
                for (let i = 0; i < trashIconsServers.length; i++) {
                    $(trashIconsServers[i]).on('click', function () {
                        public_keyToDelete = $(this).attr('id').split('_')[0];

                        $('.formWrapper').css('display', 'block');
                        $('.form').css('display', 'none');

                        if (currentLang == 'ua') {
                            $('.titleCard').text('Видалення серверу');
                        }
                        if (currentLang == 'en') {
                            $('.titleCard').text('Delete server');
                        }

                        $('.infoDeletingWrapper').css('display', 'block');

                        if (currentLang == 'en') {
                            $('#infoDelete').text(`Are you sure you want to delete ${public_keyToDelete}?`);
                        }
                        if (currentLang == 'ua') {
                            $('#infoDelete').text(`Ви впевнені, що хочете видалити  ${public_keyToDelete}?`);
                        }


                        $('.infoWrapper').fadeIn(300);

                        $('#Yes').on('click', function () {

                            $.ajax({
                                url: '/api/deleteAgent',
                                type: 'post',
                                headers: {
                                    'csrf': getCookie('csrf_token')
                                },
                                data: {
                                    public_key: public_keyToDelete
                                },
                                dataType: 'json',
                                success: function (data) {
                                    if (data.delete == 'true') {
                                        $('.infoWrapper').fadeOut(300);
                                        setTimeout(function () {
                                            location.reload();
                                        }, 350);

                                    }
                                }
                            });
                        });
                    });
                }


                $('#Cancel').on('click', function () {
                    public_keyToDelete = '';
                    $('.formWrapper').css('display', 'none');
                    $('.infoDeletingWrapper').css('display', 'none');
                    $('.infoWrapper').fadeOut(300);
                    setTimeout(function () {
                        $('.infoWrapper').css({
                            'display': 'none'
                        });
                    }, 400);
                });
            }
        );



        //получаем список URL
        $.get(
            "/api/getActivePingData", {},
            function (data) {
                data = JSON.parse(data);
                //            console.log(data);
                for (var key in data['pings']) {
                    //                console.log(data.pings[key]);
                    $('.listOfURL').append(
                        $('<li>').append(
                            $('<input>').attr({
                                type: 'text',
                                readonly: 'true',
                                class: 'nameURL',
                                value: data.pings[key].address
                            })
                        ).append(
                            $('<span>').attr({
                                class: 'trashIcon_URL',
                                id: `${data.pings[key].address}_Delete`
                            }).append(
                                $('<i>').attr({
                                    class: 'far fa-trash-alt'
                                })
                            )
                        )
                    );
                }

                let trashIconsURL = $('.trashIcon_URL');
                for (let i = 0; i < trashIconsURL.length; i++) {
                    $(trashIconsURL[i]).on('click', function () {
                        addresToDelete = $(this).attr('id').split('_')[0];

                        $('.formWrapper').css('display', 'block');
                        $('.form').css('display', 'none');

                        //                        console.log(currentLang);
                        if (currentLang == 'en') {
                            $('.titleCard').text('Delete URL');
                            $('#infoDelete').text(`Are you sure you want to delete ${addresToDelete}?`);
                        }
                        if (currentLang == 'ua') {
                            $('.titleCard').text('Видалення URL');
                            $('#infoDelete').text(`Ви впевнені, що хочете видалити ${addresToDelete}?`);
                        }

                        $('.infoDeletingWrapper').css('display', 'block');

                        $('.infoWrapper').fadeIn(300);

                        $('#Yes').on('click', function () {


                            $.ajax({
                                url: '/api/deleteActivePing',
                                type: 'post',
                                headers: {
                                    'csrf': getCookie('csrf_token')
                                },
                                data: {
                                    address: addresToDelete
                                },
                                dataType: 'json',
                                success: function (data) {
                                    if (data.delete == 'true') {
                                        $('.infoWrapper').fadeOut(300);
                                        setTimeout(function () {
                                            location.reload();
                                        }, 350);

                                    }
                                }
                            });
                        });
                    });
                }
                setTimeout(function () {
                    //                    $('html').css('overflowY', 'auto');
                    $('.loaderWrapper').fadeOut(300);
                }, 2000);
            });




        $('#addNewURL').on('click', function () {
            getLocalLang();
            //            AcceptCookie = AcceptCookie();
            $('#formAddServer').css('display', 'none');

            select();
            $('#formAddURL').css('display', 'block');
            $('.formWrapper').css('display', 'block');
            $('.form').css('display', 'block');
            $('.infoDeletingWrapper').css('display', 'none');

            if (currentLang == 'ua') {
                $('.titleCard').text('Додати новий URL');
            }
            if (currentLang == 'en') {
                $('.titleCard').text('Add new URL');
            }

            $('.infoWrapper').fadeIn(300);
            setTimeout(function () {
                $('.infoWrapper').css({
                    'display': 'block'
                });
            }, 400);

        });


        $('#addNewServer').on('click', function () {
            getLocalLang();
            //            AcceptCookie = AcceptCookie();
            $('#formAddURL').css('display', 'none');
            $('#formAddServer').css('display', 'block');
            $('.formWrapper').css('display', 'block');
            $('.form').css('display', 'block');
            $('.infoDeletingWrapper').css('display', 'none');

            if (currentLang == 'en') {
                $('.titleCard').text('Add new server');
            }
            if (currentLang == 'ua') {
                $('.titleCard').text('Додавання нового серверу');
            }


            $('.infoWrapper').fadeIn(300);
            setTimeout(function () {
                $('.infoWrapper').css({
                    'display': 'block'
                });
            }, 400);

        });


        $('#close').on('click', function () {

            var validatorServer = $("#formAddServer").validate();
            validatorServer.resetForm();
            var validatorUrl = $("#formAddURL").validate();
            validatorUrl.resetForm();

            $('#addPublicKey').val('');
            $('#addSecretKey').val('');
            $('#addHost').val('');

            $('#addAddress').val('');
            $('#addPingInterval').val('');
            $('#addDownTiming').val('');

            //        $('.formWrapper').css('display', 'none');
            //        $('.infoDeletingWrapper').css('display', 'none');
            $('.emptyWrapper').css('display', 'none');
            $('.infoWrapper').fadeOut(300);

            setTimeout(function () {
                $('.infoWrapper').css({
                    'display': 'none'
                });
            }, 400);

        });

        $(function () {

            $('.translate').click(function () {

                let lang = $(this).attr('id');

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

                if (lang == 'ua') {
                    //URL
                    $.validator.messages.required = "Це поле обов'язкове";
                    $.validator.messages.validAddress = "Будь ласка, введіть правильну адресу";
                    $.validator.messages.greaterThan = "Значення повинно бути більше або дорівнювати інтервалу перевірок";

                    $.extend($.validator.messages, {
                        range: $.validator.format("Будь ласка, введіть число від {0} до {1}.")
                    });
                    $.extend($.validator.messages, {
                        max: $.validator.format("Максимальне значення поля {0}.")
                    });

                    //servers
                    $.validator.messages.validPublic = "Перша повинна бути літера. Пробіли не допускаються";
                    $.validator.messages.validSecret = "Не допускаються пробіли та спец символи окрім '-' ";
                    $.validator.messages.validHost = "Мінімум одна літера, потім крапка та мінімум 2 літери";



                }
                if (lang == 'en') {
                    //URL
                    $.validator.messages.required = "This field must be filled";
                    $.validator.messages.validAddress = "Enter a valid address";
                    $.validator.messages.greaterThan = "Value must be greater or equal to ping interval";

                    $.extend($.validator.messages, {
                        range: $.validator.format("Please, enter numbers between {0} and {1}.")
                    });

                    $.extend($.validator.messages, {
                        max: $.validator.format("Max value is {0}.")
                    });

                    //servers
                    $.validator.messages.validPublic = "First character must be letter. Without spaces";
                    $.validator.messages.validSecret = "Without spaces and special characters except '-'";
                    $.validator.messages.validHost = "At least 1 letter then dot then at least 2 letters";

                }

            });
        });

    });


    function addNewServer() {
        getLocalLang();
        //        AcceptCookie = AcceptCookie();
        let public_key = $('#addPublicKey').val().replace(/\s/gi, '');
        let secret_key = $('#addSecretKey').val().replace(/\s/gi, '');
        let host = $('#addHost').val().replace(/\s/gi, '');
        $.ajax({
            url: 'api/addAgent',
            type: 'post',
            headers: {
                'csrf': getCookie('csrf_token')
            },
            data: {
                public_key: public_key,
                secret_key: secret_key,
                host: host
            },
            dataType: 'json',
            success: function (data) {
                //                data = JSON.parse(data);
                //                console.log(data);

                if (data.add == 'true' && data.info == 'Added') {
                    location.reload();
                    $('.emptyWrapper').css('display', 'none');
                }
                if (data.add == 'false' && data.info == 'Is exist') {
                    if (currentLang == 'en') {
                        $('#info').text('This server is already exist');
                    }
                    if (currentLang == 'ua') {
                        $('#info').text('Такий сервер вже існує');
                    }

                    $('.emptyWrapper').fadeIn(300);
                }
                if (data.add == 'false' && data.info == 'no premium') {
                    if (currentLang == 'en') {
                        $('#info').text('You need premium to add more');
                    }
                    if (currentLang == 'ua') {
                        $('#info').text('Аби додати більше серверів потрібен преміум');
                    }
                    $('.emptyWrapper').fadeIn(300);
                }
            }
        });
    }

    function addNewURL() {
        let address = `${$('.select__current').text()}${$('#addAddress').val()}`;
        let pingInterval = $('#addPingInterval').val();
        let downTiming = $('#addDownTiming').val();

        $.ajax({
            url: 'api/addActivePing',
            type: 'post',
            headers: {
                'csrf': getCookie('csrf_token')
            },
            data: {
                address: address,
                ping_interval: pingInterval,
                down_timing: downTiming
            },
            dataType: 'json',
            success: function (data) {
                //                data = JSON.parse(data);
                //                console.log(data);
                if (data.add_ping == 'true') {
                    $('.infoWrapper').fadeOut(300);
                    setTimeout(function () {
                        location.reload();
                    }, 350);
                }
                if (data.add_ping == 'false' && data.info == 'is exist') {
                    if (currentLang == 'en') {
                        $('#info').text('This URL is already exist');
                    }
                    if (currentLang == 'ua') {
                        $('#info').text('Такий URL вже існує');
                    }

                    $('.emptyWrapper').fadeIn(300);
                }
                if (data.add_ping == 'false' && data.info == 'no premium') {
                    if (currentLang == 'en') {
                        $('#info').text('Need premium to add more');
                    }
                    if (currentLang == 'ua') {
                        $('#info').text('Потрібен преміум, щоб додати більше');
                    }

                    $('.emptyWrapper').fadeIn(300);
                }
            }
        });

    }

    //create select element
    let select = function () {
        $('.select__icon').html('&#9660;');
        let selectHeader = document.querySelectorAll('.select__header');
        let selectItem = document.querySelectorAll('.select__item');

        selectHeader.forEach(item => {
            item.addEventListener('click', selectToggle);
        });

        selectItem.forEach(item => {
            item.addEventListener('click', selectChoose);
        });

        function selectToggle() {
            this.parentElement.classList.toggle('is-active');
            if ($('.select').hasClass('is-active')) {
                $('.select__icon').html('&#9650;');
            } else {
                $('.select__icon').html('&#9660;');
            }

        }

        function selectChoose() {
            let text = this.innerText;
            let select = this.closest('.select')
            let currentText = select.querySelector('.select__current');
            currentText.innerText = text;
            select.classList.remove('is-active');
            $('.select__icon').html('&#9660;');
        }
    };

    //сохранить выбранный язык в local storage
    function saveLocalLang(language) {
        let langs;
        if (localStorage.getItem('langs') === null) {
            langs = [];
            langs.push(language);
        } else {
            langs = JSON.parse(localStorage.getItem('langs'));
        }
        langs.push(language);
        //        console.log(langs);
        localStorage.setItem('langs', JSON.stringify(langs));
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

                if (lang == 'ua') {
                    //URL
                    $.validator.messages.required = "Це поле обов'язкове";
                    $.validator.messages.validAddress = "Будь ласка, введіть правильну адресу";
                    $.validator.messages.greaterThan = "Значення повинно бути більше або дорівнювати інтервалу перевірок";

                    $.extend($.validator.messages, {
                        range: $.validator.format("Будь ласка, введіть число від {0} до {1}.")
                    });
                    $.extend($.validator.messages, {
                        max: $.validator.format("Максимальне значення поля {0}.")
                    });

                    //servers
                    $.validator.messages.validPublic = "Перша повинна бути літера. Пробіли не допускаються";
                    $.validator.messages.validSecret = "Не допускаються пробіли та спец символи окрім '-' ";
                    $.validator.messages.validHost = "Мінімум одна літера/цифра, потім крапка та мінімум 2 літери/цифри";



                }
                if (lang == 'en') {
                    //URL
                    $.validator.messages.required = "This field must be filled";
                    $.validator.messages.validAddress = "Enter a valid address";
                    $.validator.messages.greaterThan = "Value must be greater or equal to ping interval";

                    $.extend($.validator.messages, {
                        range: $.validator.format("Please, enter numbers between {0} and {1}.")
                    });

                    $.extend($.validator.messages, {
                        max: $.validator.format("Max value is {0}.")
                    });

                    //servers
                    $.validator.messages.validPublic = "First character must be letter. Without spaces";
                    $.validator.messages.validSecret = "Without spaces and special characters except '-'";
                    $.validator.messages.validHost = "At least 1 letter/number then dot then at least 2 letters/numbers";

                }

            }, 0);
        })
    }

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
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
