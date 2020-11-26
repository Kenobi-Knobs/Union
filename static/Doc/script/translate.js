    document.addEventListener('DOMContentLoaded', getLocalLang);
    //localization
    let arrLang = {
        'en': {
            'title': 'User agreement',
            'overview': 'Overview.',
            'overview_1': 'This user agreement is a legally binding agreement between the User and the Site Administration, the subject of which is to provide the Site Administration to the User with access to the use of the Site and its functionality.',
            'overview_2': 'The software product is a completely free application. Usage of which does not bear any material responsibility for the user.',
            'confidentiality': 'Confidentiality. Consent to the use of data.',
            'confidentiality_1': `The site administration treats the confidential information of any person who has become a visitor to this site with respect and responsibility. The user is obliged to fully familiarize himself with these Rules before registering on the Site. Registration of the User on the Site means full and unconditional acceptance by the User of these Rules in accordance with the provisions of the Law of Ukraine "On the Protection of Personal Data" and the Site Administration's policy on the protection of personal data.`,
            'confidentiality_2': 'We care about your privacy. Some software components send or receive data when they are used.',
            'confidentiality_3': `So, the user automatically agrees that the Site Administration can collect, use, transfer, process and maintain information associated with the User's account in order to provide the relevant services.`,
            'obligations': 'Obligations of the user.',
            'obligations_1': `Any actions performed using the user's login and password are considered to have been committed by the corresponding user.`,
            'obligations_2': `In case of unauthorized access to the login and password and / or the user's personal page, or distribution of the login and password, the user is obliged to immediately inform the administration of the resource about this.`,
            'liability': 'Liability of the parties.',
            'liability_1': 'The user acknowledges and agrees that no software, including the Software, is free from software errors, instability in operation, can interact in different ways with various operating systems, programs and (or) their components, hardware components, etc. The copyright holder is released from liability for all kinds of losses caused by the circumstances specified in this clause, and does not accept claims from the User, his affiliates, counterparties, business partners or any other persons.',
            'back': 'Go back'
        },
        'ua': {
            'title': 'Угода користувача',
            'overview': 'Огляд.',
            'overview_1': `Ця угода користувача є юридично обов'язковою угодою між Користувачем та Адміністрацією Сайту, предметом якої є надання Адміністрації Сайту Користувачеві доступу до використання Сайту та його функціональних можливостей.`,
            'overview_2': 'Наш програмний продукт - це абсолютно безкоштовна програма, використовуючи його користувач не несе ніякої матеріальної відповідальності.',
            'confidentiality': 'Конфіденційність. Згода на використання даних.',
            'confidentiality_1': `Адміністрація сайту ставиться до конфіденційної інформації будь-якої особи, яка стала відвідувачем цього сайту, з повагою та відповідальністю. Користувач зобов'язаний повністю ознайомитися з цими Правилами перед реєстрацією на Сайті. Реєстрація Користувача на Сайті означає повне та безумовне прийняття Користувачем цих Правил відповідно до положень Закону України "Про захист персональних даних" та політики Адміністрації Сайту щодо захисту персональних даних.`,
            'confidentiality_2': `Ми дбаємо про вашу конфіденційність. Деякі програмні компоненти надсилають або отримують дані, коли вони використовуються.`,
            'confidentiality_3': `Таким чином, користувач автоматично погоджується, що Адміністрація Сайту може збирати, використовувати, передавати, обробляти та підтримувати інформацію, пов’язану з обліковим записом Користувача, з метою надання відповідних послуг.`,
            'obligations': `Зобов'язання користувача.`,
            'obligations_1': `Будь-які дії, що виконуються з використанням логіна та пароля користувача, вважаються вчиненими відповідним користувачем.`,
            'obligations_2': `У разі несанкціонованого доступу до логіна та пароля та / або персональної сторінки користувача, або розповсюдження логіна та пароля, користувач зобов’язаний негайно повідомити про це адміністрацію ресурсу.`,
            'liability': 'Відповідальність сторін.',
            'liability_1': `Користувач визнає та погоджується з тим, що жодне програмне забезпечення не містить програмних помилок, нестабільності в роботі, може по-різному взаємодіяти з різними операційними системами, програмами та (або) їх компонентами, апаратними компонентами тощо. Власник авторських прав звільнений від відповідальності за всі види збитків, спричинених обставинами, зазначеними в цьому пункті, і не приймає претензій від Користувача, його афілійованих осіб, контрагентів, ділових партнерів або будь-яких інших осіб.`,
            'back': 'Повернутися'
        }
    };


    $(function () {

        $('.translate').click(function () {

            let lang = $(this).attr('id');
            saveLocalLang(lang);

            $('.langText').each(function (index, item) {
                $(this).text(arrLang[lang][$(this).attr('key')]);
            });
        });
    });

    function saveLocalLang(language) {
        let langs;
        if (localStorage.getItem('langs') === null) {
            langs = [];
            langs.push('en');
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
            langs.push('en');
        } else {
            langs = JSON.parse(localStorage.getItem('langs'));
        }
        langs.forEach(function (language) {
            let lang = langs[langs.length - 1];
            setTimeout(() => {
                $('.langText').each(function (index, item) {
                    $(this).text(arrLang[lang][$(this).attr('key')]);
                });

            }, 0);
        })
    }
