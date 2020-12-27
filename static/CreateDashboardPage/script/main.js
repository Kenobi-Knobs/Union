    let arrLang = {
        'en': {
            'titleDashboard': 'Dashboard',
            'chooseURLs': 'Please choose URLs',
            'noUrls': 'There is no urls. Please go to settings to add them',
            'titleWysiwyg': 'Add a comment to your dashboard',
            'save': 'Save',
            'titleCopy': 'Copy link to clipboard'

        },
        'ua': {
            'titleDashboard': 'Дашборд',
            'chooseURLs': 'Будь ласка оберіть посилання',
            'noUrls': 'Посилань немає. Перейдіть до налаштувать, щоб додати їх',
            'titleWysiwyg': 'Додати коментар до дашборду',
            'save': 'Зберегти',
            'titleCopy': 'Копіювати посилання до буферу обміну'

        }
    };


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


    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    function refreshLink() {
        $.get("/api/getDashboardToken")
            .done(function (data) {
                data = JSON.parse(data);
                let token = data["token"];
                if (token === "null") {
                    $(".copyLinkWrapper").css("display", "none");
                } else {
                    $(".copyLinkWrapper").slideDown(500);
                    $("#link").val("t5.tss2020.site/dashboard/" + token);
                }
            });
    }

    let currentLang; //язык, который выбран
    $(document).ready(function () {
        getLocalLang();
        refreshLink();

        //    checking authorized user or not
        $.get(
            "api/isAuth", {},
            function (data) {
                data = JSON.parse(data);

                let userName;

                if (data.auth == "true") {
                    //                console.log("Auth is true");
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

        $(".quit").on('click', function () {
            $(location).attr('href', '/logout');
        });


        //     $('#mytextarea').html('<p>dasdasd</p>');


        $.get(
            "/api/getActivePingData", {},
            function (data) {
                data = JSON.parse(data);
                console.log(data);
                if (data['pings'].length == 0) {

                    //                 alert('No urls');
                    $('.urlList').css('display', 'none');
                    $('.alertNoUrl').css('display', 'block');

                } else {
                    $('.urlList').slideDown(300);
                    $('.alertNoUrl').css('display', 'none');
                } //end else
                $('.allInfo').slideDown(300);
                for (let key in data['pings']) {

                    $('.checksURL').append(
                        $('<li>').append(
                            $('<input>').attr({
                                type: 'checkbox',
                                id: `${data.pings[key].address}`,
                                name: 'urls',
                                value: data.pings[key].address
                            })
                        ).append(
                            $('<label>').attr({
                                for: `${data.pings[key].address}`
                            })
                        ).append(
                            $('<input>').attr({
                                type: 'text',
                                class: 'nameURL',
                                readonly: true,
                                value: data.pings[key].address
                            })
                        )
                    );

                }
                let addresses = [];
                let urls = $('input[name=urls]');
                urls.on('change', function () {
                    addresses = [];
                    $('input:checkbox:checked').each(function () {
                        addresses.push($(this).val());
                    });
                });

                $('#getData').submit(function (e) {
                    addresses = [];
                    $('input:checkbox:checked').each(function () {
                        addresses.push($(this).val());
                    });
                    console.log(addresses.join());
                    let content = tinymce.get('mytextarea').getContent();
                    content = content.replace(/"/gm, `'`);
                    //                     content = content.replace('//n/', '⁠⁠⁠⁠⁠');
                    //                     content = content.replace(/\//gm, `\/`);
                    console.log('_____________________________');
                    console.log(content);

                    $.get("/api/getDashboardToken")
                        .done(function (data) {
                            data = JSON.parse(data);
                            let token = data["token"];
                            if (token === "null") {
                                createDashboard();
                                $('.infoWrapper').fadeIn(1000);
                                if (currentLang == 'en') {
                                    $('#dashInfo').text('Dashboard created');
                                }
                                if (currentLang == 'ua') {
                                    $('#dashInfo').text('Дашборд створенний');
                                }

                                setTimeout(function () {
                                    $('.infoWrapper').fadeOut(1000);
                                }, 2000);
                            } else {
                                createDashboard();
                                $('.infoWrapper').fadeIn(1000);
                                if (currentLang == 'en') {
                                    $('#dashInfo').text('Dashboard updated');
                                }
                                if (currentLang == 'ua') {
                                    $('#dashInfo').text('Дашборд оновлено');
                                }
                                setTimeout(function () {
                                    $('.infoWrapper').fadeOut(1000);
                                }, 2000);
                            }
                        });


                    function createDashboard() {
                        $.ajax({
                            url: '/api/createOrUpdateDashboard',
                            type: 'post',
                            headers: {
                                'csrf': getCookie('csrf_token')
                            },
                            data: {
                                data: content,
                                urls: addresses.join()
                            },
                            dataType: 'json',
                            success: function (data) {
                                refreshLink();
                            }
                        });
                    }

                    return false;
                });

                tinymce.init({
                    selector: '#mytextarea',
                    plugins: 'preview powerpaste casechange importcss tinydrive searchreplace autolink autosave save directionality advcode visualblocks visualchars fullscreen link media mediaembed template codesample table charmap hr nonbreaking toc insertdatetime advlist lists wordcount a11ychecker textpattern noneditable help formatpainter permanentpen pageembed charmap mentions quickbars linkchecker emoticons advtable',
                    menubar: false,
                    toolbar: 'undo redo | bold italic underline strikethrough | fontselect fontsizeselect formatselect | alignleft aligncenter alignright alignjustify | outdent indent |  numlist bullist | forecolor backcolor casechange removeformat | hr charmap | fullscreen  preview | code',
                    fontsize_formats: '8pt 10pt 12pt 14pt 16pt 18pt 24pt 36pt 48pt',
                    importcss_append: true,
                    template_cdate_format: '[Date Created (CDATE): %m/%d/%Y : %H:%M:%S]',
                    template_mdate_format: '[Date Modified (MDATE): %m/%d/%Y : %H:%M:%S]',
                    height: '10rem',
                    resize: false,
                    image_caption: false,
                    quickbars_insert_toolbar: false,
                    quickbars_selection_toolbar: 'bold italic | h2 h3 blockquote quicktable',
                    noneditable_noneditable_class: 'mceNonEditable',
                    toolbar_mode: 'sliding',
                    tinycomments_mode: false,
                    content_style: '.mymention{ color: gray; }',
                    contextmenu: false,
                    a11y_advanced_options: false,
                    skin: 'oxide',
                    content_css: 'default',
                    setup: function (editor) {
                        editor.on('init', function (e) {
                            console.log('The Editor has initialized.');
                            $('#getData').css('opacity', '1');
                            //                             $('#getData').fadeIn(100);

                            //если дашборд создан был ранее, то выводим информацию для удобного изменения
                            setTimeout(function () {
                                let tokenArray = $('#link').val().split('/');
                                let token = tokenArray[tokenArray.length - 1];
                                console.log(token);
                                $.get(
                                    "/api/getDashboard", {
                                        token: token
                                    },
                                    function (data) {
                                        data = JSON.parse(data);
                                        console.log(data.text);
                                        //                                         $('#mytextarea').html(data.text);
                                        //                                         tinymce.activeEditor.selection.setCursorLocation();
                                        let contentFromServer = data.text;
                                        //                                         contentFromServer = contentFromServer.replace(/⁠⁠⁠⁠⁠/, '/n');
                                        //                                         content = content.replace('//n/', String.fromCharCode('U+2060'));
                                        tinymce.activeEditor.selection.setContent(contentFromServer);

                                        console.log(urls.length);
                                        urls = $('input[name=urls]');
                                        console.log(urls);
                                        for (let i = 0; i < data.urls.length; i++) {
                                            urls.each(function () {
                                                if ($(this).attr('id') == data.urls[i].url) {
                                                    console.log($(this).attr('id'));
                                                    $(this).attr('checked', true);
                                                }
                                            });
                                        }
                                    });
                            }, 0);

                        });
                    }
                });



            });

    });

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

    $('#dashboard').on('click', function () {
        $(location).attr('href', '/create-dashboard');
    });

    $('.copyIcon').on('click', function () {
        copytext();
    });

    function copytext() {
        var copyText = document.getElementById("link");
        copyText.select();
        document.execCommand("copy");
        $('#link').css({
            border: '0.07em solid #AFFF37'
        });
        setTimeout(function () {
            $('#link').css({
                border: '0'
            });
        }, 500);
        //     alert("Copied the text: " + copyText.value);
    }
