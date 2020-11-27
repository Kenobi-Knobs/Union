    let arrLang = {
        'en': {
            'auth': 'Authorization',
            'question': "Don't have an account?",
            'signUp': 'Sign up',
            'logIn': 'Log in',
            'resetPass': 'Reset password',
            'inputMail': 'Email',
            'inputPass': 'Password',
            'understand': 'Ok'
        },
        'ua': {
            'auth': 'Авторизація',
            'question': "Не маєте аккаунту?",
            'signUp': 'Зареєструватися',
            'logIn': 'Увійти',
            'resetPass': 'Відновити пароль',
            'inputMail': 'Електронна пошта',
            'inputPass': 'Пароль',
            'understand': 'Ок'
        }
    };
    let currentLang;
    $(document).ready(function () {
        getLocalLang();
        //checking authorized use or not
        $.get(
            "api/isAuth", {},
            function (data) {
                data = JSON.parse(data);

                if (data.auth == "true") {
                    //                console.log("Auth is true");
                    $(location).attr('href', '/');
                }
            }
        );

        //sending form by clicking Enter
        $('body').keydown(function (e) {
            if (e.keyCode === 13) {
                if ($('.infoWrapper').css('display') == 'block') {
                    understandInfo();
                } else {
                    submitForm();
                }
            }
        });

        //get "confirm" from URL
        let url = window.location.href;
        let isConfirmed = getURLParameter(url, 'info');
        //    console.log(isConfirmed);

        if (isConfirmed == 'confirmed') {
            $('.infoWrapper').fadeIn(300);
            $('.infoWrapper').css({
                'display': 'block',
            });
            if (currentLang == 'en') {
                $('#singInInfo').text('Mail was confirmed');
            }
            if (currentLang == 'ua') {
                $('#singInInfo').text('Пошта успішно підтверджена');
            }

        }

        $('#submit').on('click', function () {
            submitForm();
        });

        $('.circle').on('click', function () {
            $(location).attr('href', '/reset');
        });


        $('#understandInfo').on('click', function () {
            understandInfo();
        });

        $(function () {
            if (localStorage.getItem('langs') === null) {
                saveLocalLang('en');
            }
            $('.translate').click(function () {

                let lang = $(this).attr('id');
                saveLocalLang(lang);
                $('.langBtn').each(function (index, item) {
                    $(this).val(arrLang[lang][$(this).attr('key')]);
                })
                $('.langToolTip').each(function (index, item) {
                    $(this).attr('data-tooltip', arrLang[lang][$(this).attr('key')]);
                });
                $('.langPlaceholder').each(function (index, item) {
                    $(this).attr('placeholder', arrLang[lang][$(this).attr('key')]);
                });
                $('.langText').each(function (index, item) {
                    $(this).text(arrLang[lang][$(this).attr('key')]);
                });
            });
        });

    });


    function understandInfo() {
        $('.infoWrapper').fadeOut(300);
        setTimeout(function () {
            $('.infoWrapper').css({
                'display': 'none'
            });
            //        location.reload();
        }, 400);
    }

    function getURLParameter(sUrl, sParam) {
        let sPageURL = sUrl.substring(sUrl.indexOf('?') + 1);
        let sURLVariables = sPageURL.split('&');
        for (let i = 0; i < sURLVariables.length; i++) {
            let sParameterName = sURLVariables[i].split('=');
            if (sParameterName[0] == sParam) {
                return sParameterName[1];
            }
        }
    }

    function submitForm() {
        $.post(
            "/api/auth", {
                mail: $('#mail').val(),
                pass: $('#password').val()
            },
            function (data) {
                getLocalLang();
                data = JSON.parse(data);
                console.log(data);

                if (data.auth == "true") {
                    //                    console.log("ok");
                    $(location).attr('href', '/');
                }
                if (data.auth == "false" && data.info == "wrong mail") {
                    $('.infoWrapper').fadeIn(300);
                    $('.infoWrapper').css({
                        'display': 'block'
                    });
                    if (currentLang == 'en') {
                        $('#singInInfo').text('Login or password are wrong');
                    }
                    if (currentLang == 'ua') {
                        $('#singInInfo').text('Логін або пароль невірний');
                    }

                }
                if (data.auth == "false" && data.info == "wrong pass") {
                    $('.infoWrapper').fadeIn(300);
                    $('.infoWrapper').css({
                        'display': 'block'
                    });
                    if (currentLang == 'en') {
                        $('#singInInfo').text('Login or password are wrong');
                    }
                    if (currentLang == 'ua') {
                        $('#singInInfo').text('Логін або пароль невірний');
                    }
                }
                if (data.auth == "false" && data.info == "confirm account with mail") {
                    $('.infoWrapper').fadeIn(300);
                    $('.infoWrapper').css({
                        'display': 'block'
                    });
                    if (currentLang == 'en') {
                        $('#singInInfo').text('Please confirm your email');
                    }
                    if (currentLang == 'ua') {
                        $('#singInInfo').text('Будь ласка підтвердіть пошту');
                    }

                }
            }
        );
    }

    function saveLocalLang(language) {
        let langs;
        if (localStorage.getItem('langs') === null) {
            langs = [];
        } else {
            langs = JSON.parse(localStorage.getItem('langs'));
        }
        langs.push(language);
        localStorage.setItem('langs', JSON.stringify(langs));
    }

    function getLocalLang() {
        let langs;
        if (localStorage.getItem('langs') === null) {
            langs = [];
            $('#changeEN').prop('checked', 'true');
        } else {
            langs = JSON.parse(localStorage.getItem('langs'));
        }
        langs.forEach(function (language) {
            let lang = langs[langs.length - 1];
            currentLang = lang;
            if (lang == 'ua') {
                $('#changeUA').prop('checked', 'true');
            }
            if (lang == 'en') {
                $('#changeEN').prop('checked', 'true');
            }
            setTimeout(() => {
                $('.langBtn').each(function (index, item) {
                    $(this).val(arrLang[lang][$(this).attr('key')]);
                })
                $('.langToolTip').each(function (index, item) {
                    $(this).attr('data-tooltip', arrLang[lang][$(this).attr('key')]);
                });
                $('.langPlaceholder').each(function (index, item) {
                    $(this).attr('placeholder', arrLang[lang][$(this).attr('key')]);
                });
                $('.langText').each(function (index, item) {
                    $(this).text(arrLang[lang][$(this).attr('key')]);
                });

            }, 0);
        })
    }
