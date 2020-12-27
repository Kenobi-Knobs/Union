    let arrLang = {
        'en': {
            'titleAdmin': 'Union Admin',
            'placeholder': 'All or * or mail',
            'find': 'Find',
            'agents': 'Agents:',
            'remove': 'Remove',
            'ok': 'Ok'
            //            ,
            //            'upgradePlan': 'Upgrade plan'

        },
        'ua': {
            'titleAdmin': 'Union Адмін',
            'placeholder': 'All або * або пошту',
            'find': 'Знайти',
            'agents': 'Агенти:',
            'remove': 'Видалити',
            'ok': 'Ок'
            //            ,
            //            'upgradePlan': 'Надати преміум'

        }
    };
    let currentLang;
    $(document).ready(function () {

        $('body').keydown(function (e) {
            if (e.keyCode === 13) {
                getUsers();
            }
        });

        getLocalLang();
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

        $('#find').on('click', function () {
            getUsers();
        });
    });

    function upgradeUser(mailToUpgrade, i) {

        $.ajax({
            url: 'api/upgradeUser',
            type: 'get',
            headers: {
                'csrf': getCookie('csrf_token')
            },
            data: {
                mail: mailToUpgrade
            },
            dataType: 'json',
            success: function (data) {
                //                data = JSON.parse(data);
                //                console.log(data);
                if (data.user_upgrade == 'true') {
                    $('.popupWrapper').fadeIn(500);

                    if (currentLang == 'en') {
                        $('#popupInfo').text(mailToUpgrade + ' was successfully upgraded to premium');
                        $(`.status_${i} > span`).text('Premium plan');
                    }
                    if (currentLang == 'ua') {
                        $('#popupInfo').text(mailToUpgrade + ' успішно підвищений до преміуму');
                        $(`.status_${i} > span`).text('Преміум');
                    }

                    $(`.status_${i}`).css('backgroundColor', '#ACACAC');
                    $(`.status_${i}`).css('cursor', 'auto');


                    getUsers();
                }
            }
        });
    }

    function getUsers() {
        $('#usersList').empty();
        let usersList = []; //массив всех пользователей
        $.get(
            'api/getUsers', {},
            function (data) {
                data = JSON.parse(data);
                //                console.log(data);

                for (let i = 0; i < data.users.length; i++) {
                    usersList.push(data.users[i]);
                }

                for (let i = 0; i < usersList.length; i++) {
                    if ($('#mail').val().toLowerCase() == '*' || $('#mail').val().toLowerCase() == 'all') {

                        $('#usersList').append(
                            $('<li>').attr({
                                id: `list_${i}`
                            }).append(
                                $('<div>').attr({
                                    class: `selectWrapper wrapper_${i}`
                                }).append(
                                    $('<div>').attr({
                                        class: `select select_${i}`
                                    }).append(
                                        $('<div>').attr({
                                            class: `select__header header_${i}`
                                        }).append(
                                            $('<div>').attr({
                                                class: `select__mail mail_${i}`
                                            }).append(
                                                $('<span>').attr({
                                                    class: `select__current current_${i}`
                                                }).text(data.users[i].mail)
                                            )
                                        ).append(
                                            $('<div>').attr({
                                                class: `select__options option_${i}`
                                            }).append(
                                                $('<div>').attr({
                                                    class: `select__status status_${i} status_${data.users[i].mail}`
                                                }).append(
                                                    $('<span>')
                                                )
                                            ).append(
                                                $('<div>').attr({
                                                    class: `select__remove remove_${i} remove_${data.users[i].mail}`
                                                }).append(
                                                    $('<span>').attr({
                                                        class: 'langText',
                                                        key: 'remove'
                                                    })
                                                ))
                                        )
                                    )
                                )
                            )
                        );

                        if (usersList[i].agents.length > 0) {
                            $(`.mail_${i}`).append(
                                $('<div>').attr({
                                    class: `select__icon icon_${i}`
                                })
                            );

                            $(`.select_${i}`).append(
                                $('<div>').attr({
                                    class: `select__body body_${i}`
                                }).append(
                                    $('<div>').attr({
                                        class: `select__item item_${i}`,
                                        id: `infoUser`
                                    }).append(
                                        $('<span>').attr({
                                            class: `agentTitle langText`,
                                            key: 'agents'
                                        })
                                    ).append(
                                        $('<ul>').attr({
                                            class: `agentList agentList_${i}`
                                        })
                                    )
                                )
                            )
                        }

                    }
                    if ($('#mail').val().toLowerCase() == usersList[i].mail) {

                        $('#usersList').append(
                            $('<li>').attr({
                                id: `list_${i}`
                            }).append(
                                $('<div>').attr({
                                    class: `selectWrapper wrapper_${i}`
                                }).append(
                                    $('<div>').attr({
                                        class: `select select_${i}`
                                    }).append(
                                        $('<div>').attr({
                                            class: `select__header header_${i}`
                                        }).append(
                                            $('<div>').attr({
                                                class: `select__mail mail_${i}`
                                            }).append(
                                                $('<span>').attr({
                                                    class: `select__current current_${i}`
                                                }).text(data.users[i].mail)
                                            )
                                        ).append(
                                            $('<div>').attr({
                                                class: `select__options option_${i}`
                                            }).append(
                                                $('<div>').attr({
                                                    class: `select__status status_${i} status_${data.users[i].mail}`
                                                }).append(
                                                    $('<span>')
                                                )
                                            ).append(
                                                $('<div>').attr({
                                                    class: `select__remove remove_${i} remove_${data.users[i].mail}`
                                                }).append(
                                                    $('<span>').attr({
                                                        class: 'langText',
                                                        key: 'remove'
                                                    })
                                                ))
                                        )
                                    )
                                )
                            )
                        );


                        if (usersList[i].agents.length > 0) {
                            $(`.mail_${i}`).append(
                                $('<div>').attr({
                                    class: `select__icon icon_${i}`
                                })
                            );

                            $(`.select_${i}`).append(
                                $('<div>').attr({
                                    class: `select__body body_${i}`
                                }).append(
                                    $('<div>').attr({
                                        class: `select__item item_${i}`,
                                        id: `infoUser`
                                    }).append(
                                        $('<span>').attr({
                                            class: `agentTitle langText`,
                                            key: 'agents'
                                        })
                                        //                                        .text('Agents:')
                                    ).append(
                                        $('<ul>').attr({
                                            class: `agentList agentList_${i}`
                                        })
                                    )
                                )
                            )
                        }
                    }
                }

                //                console.log(usersList);

                //записываем какие агенты есть у пользователя
                //если у пользователя есть премиум, то меняем кнопку что у нег оесть премиум 
                for (let i = 0; i < data.users.length; i++) {
                    for (let j = 0; j < data.users[i].agents.length; j++) {
                        $(`.agentList_${i}`).append(
                            $('<li>').append(
                                $('<span>').text(data.users[i].agents[j].public_key)
                            )
                        );
                    }
                    if (data.users[i].settings.status == 'premium_user') {
                        $(`.status_${i}`).css('backgroundColor', '#ACACAC');
                        $(`.status_${i}`).css('cursor', 'auto');

                        if (currentLang == 'en') {
                            $(`.status_${i} > span`).text('Premium plan');
                        }
                        if (currentLang == 'ua') {
                            $(`.status_${i} > span`).text('Преміум');
                        }

                    }
                    if (data.users[i].settings.status == 'user') {

                        if (currentLang == 'en') {
                            $(`.status_${i} > span`).text('Premium');
                        }
                        if (currentLang == 'ua') {
                            $(`.status_${i} > span`).text('Надати преміум');
                        }

                    }

                    if (data.users[i].settings.status == 'admin') {
                        $(`.status_${i}`).css('backgroundColor', '#ACACAC');
                        $(`.status_${i}`).css('cursor', 'auto');

                        if (currentLang == 'en') {
                            $(`.status_${i} > span`).text('Admin');
                        }
                        if (currentLang == 'ua') {
                            $(`.status_${i} > span`).text('Адмін');
                        }

                        $(`.remove_${i}`).css('display', 'none');
                    }

                    if (data.users[i].settings.status == 'user') { //ЗАМЕНИТЬ НА ЮЗЕР!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                        //заменил уже чего орать то? -.-
                        document.querySelectorAll(`.status_${i}`).forEach(item => { //изменить статус на премиум 
                            item.addEventListener('click', function () {
                                //                                console.log(item.className.split(/\s+/)[2].split('_')[1]);
                                let mailToUpgrade = item.className.split(/\s+/)[2].split('_')[1];
                                upgradeUser(mailToUpgrade, i);
                            });
                        });
                    }

                    if (data.users[i].settings.status == 'user' || data.users[i].settings.status == 'premium_user') {
                        document.querySelectorAll(`.remove_${i}`).forEach(item => { //delete
                            item.addEventListener('click', showPopupDelete);

                            function showPopupDelete() {
                                let mailToDelete = item.className.split(/\s+/)[2].split('_')[1];
                                //                                console.log(mailToDelete);
                                deleteUser(mailToDelete, i);
                            }
                        });
                    }
                }



                $('#understandInfo').on('click', function () {
                    $('.popupWrapper').fadeOut(500);
                    $("body").css('position', 'static');
                });


                //create select element
                let select = function () {
                    $('.select__icon').html('&#9660;');
                    let selectHeader = document.querySelectorAll('.select__header');
                    selectHeader.forEach(item => {
                        item.addEventListener('click', selectToggle);
                    });

                    function selectToggle() {
                        let parent = $(this).parent();
                        this.parentElement.classList.toggle('is-active');

                        for (let i = 0; i < data.users.length; i++) {
                            for (let j = 0; j < data.users[i].agents.length; j++) {
                                if ($(`.select_${i}`).hasClass('is-active')) {
                                    $(`.icon_${i}`).html('&#9650;');
                                    $(`.header_${i}`).css('borderRadius', '0.5em 0.5em 0 0');
                                    $(`.header_${i}`).css('borderBottom', '0');
                                } else {
                                    $(`.icon_${i}`).html('&#9660;');
                                    $(`.header_${i}`).css('borderRadius', '0.5em');
                                    $(`.header_${i}`).css('borderBottom', '0.03em solid #cccccc');
                                }
                            }
                        }
                    }
                };
                select();
                getLocalLang();
            }
        );
    }

    function deleteUser(mailToDelete, i) {

        $.ajax({
            url: 'api/deleteUser',
            type: 'get',
            headers: {
                'csrf': getCookie('csrf_token')
            },
            data: {
                mail: mailToDelete
            },
            dataType: 'json',
            success: function (data) {
                //                data = JSON.parse(data);
                //                console.log(data);
                $('.popupWrapper').fadeIn(500);
                if (data.user_delete == 'true') {
                    if (currentLang == 'en') {
                        $('#popupInfo').text(mailToDelete + ' was successfully deleted');
                    }
                    if (currentLang == 'ua') {
                        $('#popupInfo').text(mailToDelete + ' успішно видалений');
                    }

                    $(`#list_${i}`).slideUp();
                    $(`#list_${i}`).remove();
                }
                if (data.user_delete == 'false') {
                    if (currentLang == 'en') {
                        $('#popupInfo').text('Something went wrong, please try again next time');
                    }
                    if (currentLang == 'ua') {
                        $('#popupInfo').text('Щось пішло не так, будь ласка спробуйте пізніше');
                    }
                }

            }
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
                $('.langPlaceholder').each(function (index, item) {
                    $(this).attr('placeholder', arrLang[lang][$(this).attr('key')]);
                });
                $('.langBtn').each(function (index, item) {
                    $(this).val(arrLang[lang][$(this).attr('key')]);
                });
            }, 0);
        })
    }

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }
