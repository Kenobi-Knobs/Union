 let isAuth = false;
 $(document).ready(function () {
     //flag to understand if the user has changed the password

     $('body').keydown(function (e) {
         if (e.keyCode === 13) {
             if ($('.infoWrapper').css('display') == 'block') {
                 understandInfo(isAuth);
             }
             if ($('.infoWrapper').css('display') == 'none') {
                 submitForm();
             }
         }
     });

     let submitButton = $('#submit');

     submitButton.on('click', function () {
         submitForm();
     });

     $('#understandInfo').on('click', function () {
         understandInfo();
     })


 });

 function understandInfo() {
     if (isAuth == true) {
         $('.infoWrapper').fadeOut(300);
         setTimeout(function () {
             $('.infoWrapper').css({
                 'display': 'none'
             });
             $(location).attr('href', '/login');
         }, 400);
     } else {
         $('.infoWrapper').fadeOut(300);
         setTimeout(function () {
             $('.infoWrapper').css({
                 'display': 'none'
             });
         }, 400);
     }
 }

 function submitForm() {
     //get token from URL
     let path = location.pathname.split('/');
     let token = path[path.length - 1];
     let regPass = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=\S+$).{8,}$/gi;
     let pass = $('#password').val();

     if (regPass.test(pass)) {
         $.post(
             "/api/changePassword", {
                 new_pass: pass,
                 token: token
             },
             function (data) {
                 data = JSON.parse(data);
                 if (data.reset == 'false') {
                     $('.infoWrapper').fadeIn(300);
                     $('.infoWrapper').css({
                         'display': 'block'
                     });
                     $('#singInInfo').html('Validation error: <br> - the password must be at least 8 characters long. Must have one number and one capital letter');
                     isAuth = false;
                 }
                 if (data.reset == 'true') {
                     $('#singInInfo').text('Your password was changed. Please authorize with new data');
                     $('.infoWrapper').css({
                         'display': 'block'
                     });
                     $('.infoWrapper').fadeIn(300);
                     isAuth = true;

                 }
             }
         );

     } else {
         $('.infoWrapper').fadeIn(300);
         $('.infoWrapper').css({
             'display': 'block'
         });
         $('#singInInfo').html('Validation error: <br> - the password must be at least 8 characters long. Must have one number and one capital letter');
     }
 }
