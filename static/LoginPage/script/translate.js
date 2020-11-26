    document.addEventListener('DOMContentLoaded', getLocalLang);
    //localization
    let arrLang = {
        'en': {
            'auth': 'Authorization',
            'question': "Don't have an account?",
            'signUp': 'Sign up',
            'logIn': 'Log in',
            'resetPass': 'Reset password',
            'inputMail': 'Email',
            'inputPass': 'Password',
            'confirmed': 'Mail was confirmed',
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
            'confirmed': 'Пошта успішно підтверджена',
            'understand': 'Ок'
        }
    };

    $(function () {
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
