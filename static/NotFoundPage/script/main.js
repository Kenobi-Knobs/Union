    let arrLang = {
        'en': {
            'bada': 'Bada bim, Bada bum!',
            'noPage': 'No such page',
            'noServers': 'no servers :)',
            'back': `<a href="../">Back to home</a>`


        },
        'ua': {
            'bada': 'Бада бім, бада бум!',
            'noPage': 'Такої сторінки немає,',
            'noServers': 'а значить немає і серверів :)',
            'back': `<a href="../">Повернутися</a>`

        }
    };


    let currentLang;
    $(document).ready(function () {
        getLocalLang();
    });




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
                $('.langHtml').each(function (index, item) {
                    $(this).html(arrLang[lang][$(this).attr('key')]);
                });
            }, 0);
        })
    }
