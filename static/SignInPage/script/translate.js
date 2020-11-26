    document.addEventListener('DOMContentLoaded', getLocalLang);
    //localization
    let arrLang = {
        'en': {
            'titleRegistr': 'Registration',
            'question': 'Already have an account?',
            'goToAuth': 'Go to auth',
            'accept': 'I accept',
            'agreement': 'user agreement',
            'signUp': 'Sign Up',
            'pass': 'Password',
            'mail': 'Email',
            'understand': 'Ok'
        },
        'ua': {
            'titleRegistr': 'Реєстрація',
            'question': 'Вже маєте аккаунт?',
            'goToAuth': 'Увійти',
            'accept': 'Я приймаю',
            'agreement': 'угоду користувача',
            'signUp': 'Зареєструватися',
            'pass': 'Пароль',
            'mail': 'Електронна пошта',
            'understand': 'Ок'
        }
    };


    $(function () {

        $('.translate').click(function () {

            let lang = $(this).attr('id');
            saveLocalLang(lang);

            $('.langText').each(function (index, item) {
                $(this).text(arrLang[lang][$(this).attr('key')]);
            });
            $('.langBtn').each(function (index, item) {
                $(this).val(arrLang[lang][$(this).attr('key')]);
            });
            $('.langPlaceholder').each(function (index, item) {
                $(this).attr('placeholder', arrLang[lang][$(this).attr('key')]);
            });

            if (lang == 'ua') {
                $.validator.messages.required = "Це поле обов'язкове";
                $.validator.messages.validMail = "Введіть правильну пошту, наприклад example@something.com";
                $.validator.messages.minlength = "Введіть щонайменше 8 символів";
                $.validator.messages.validPass = "Введіть щонайменше одну велику літеру та цифру";

            }
            if (lang == 'en') {
                $.validator.messages.required = "This field must be filled";
                $.validator.messages.validMail = "Enter valid mail like example@something.com";
                $.validator.messages.minlength = "At least 8 characters long";
                $.validator.messages.validPass = "Enter at least 1 capital letter and 1 number";
            }
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
                if (lang == 'ua') {
                    $.validator.messages.required = "Це поле обов'язкове";
                    $.validator.messages.validMail = "Введіть правильну пошту, наприклад example@something.com";
                    $.validator.messages.minlength = "Введіть щонайменше 8 символів";
                    $.validator.messages.validPass = "Введіть щонайменше одну велику літеру та цифру";
                }
                if (lang == 'en') {
                    $.validator.messages.required = "This field must be filled";
                    $.validator.messages.validMail = "Enter valid mail like example@something.com";
                    $.validator.messages.minlength = "At least 8 characters long";
                    $.validator.messages.validPass = "Enter at least 1 capital letter and 1 number";
                }
                $('.langText').each(function (index, item) {
                    $(this).text(arrLang[lang][$(this).attr('key')]);
                });
                $('.langBtn').each(function (index, item) {
                    $(this).val(arrLang[lang][$(this).attr('key')]);
                });
                $('.langPlaceholder').each(function (index, item) {
                    $(this).attr('placeholder', arrLang[lang][$(this).attr('key')]);
                });

            }, 0);
        })
    }
