<<<<<<< HEAD
//changepassword dialog
function changepassworddlg() {
    var modal = setactiveModal('passworddlg.html');
    if (modal == null) return;
    document.getElementById('password_loader').style.display = "none";
    document.getElementById('change_password_content').style.display = "block";
    document.getElementById('change_password_btn').style.display = "none";
    document.getElementById('password_content').innerHTML = "";
    document.getElementById('password_password_text').innerHTML = "";
    document.getElementById('password_password_text1').innerHTML = "";
    document.getElementById('password_password_text2').innerHTML = "";
    showModal();
}


function checkpassword() {
    var pwd = document.getElementById('password_password_text').value.trim();
    var pwd1 = document.getElementById('password_password_text1').value.trim();
    var pwd2 = document.getElementById('password_password_text2').value.trim();
    document.getElementById('password_content').innerHTML = "";
    document.getElementById('change_password_btn').style.display = "none";
    if (pwd1 != pwd2) document.getElementById('password_content').innerHTML = translate_text_item("Passwords do not matches!");
    else if (pwd1.length < 1 || pwd1.length > 16 || pwd1.indexOf(" ") > -1) document.getElementById('password_content').innerHTML = translate_text_item("Password must be >1 and <16 without space!");
    else document.getElementById('change_password_btn').style.display = "block";
}


function ChangePasswordfailed(errorcode, response_text) {
    var response = JSON.parse(response_text);
    if (typeof(response.status) !== 'undefined') document.getElementById('password_content').innerHTML = translate_text_item(response.status);
    console.log("Error " + errorcode + " : " + response_text);
    document.getElementById('password_loader').style.display = "none";
    document.getElementById('change_password_content').style.display = "block";
}

function ChangePasswordsuccess(response_text) {
    document.getElementById('password_loader').style.display = "none";
    closeModal("Connection successful");
}

function SubmitChangePassword() {
    var user = document.getElementById('current_ID').innerHTML.trim();
    var password = document.getElementById('password_password_text').value.trim();
    var newpassword = document.getElementById('password_password_text1').value.trim();
    var url = "/login?USER=" + encodeURIComponent(user) + "&PASSWORD=" + encodeURIComponent(password) + "&NEWPASSWORD=" + encodeURIComponent(newpassword) + "&SUBMIT=yes";
    document.getElementById('password_loader').style.display = "block";
    document.getElementById('change_password_content').style.display = "none";
    SendGetHttp(url, ChangePasswordsuccess, ChangePasswordfailed);
}
=======
//changepassword dialog
function changepassworddlg() {
    var modal = setactiveModal('passworddlg.html');
    if (modal == null) return;
    displayNone('password_loader');
    displayBlock('change_password_content');
    displayNone('change_password_btn');
    id('password_content').innerHTML = "";
    id('password_password_text').innerHTML = "";
    id('password_password_text1').innerHTML = "";
    id('password_password_text2').innerHTML = "";
    showModal();
}


function checkpassword() {
    var pwd = id('password_password_text').value.trim();
    var pwd1 = id('password_password_text1').value.trim();
    var pwd2 = id('password_password_text2').value.trim();
    id('password_content').innerHTML = "";
    displayNone('change_password_btn');
    if (pwd1 != pwd2) id('password_content').innerHTML = translate_text_item("Passwords do not matches!");
    else if (pwd1.length < 1 || pwd1.length > 16 || pwd1.indexOf(" ") > -1) id('password_content').innerHTML = translate_text_item("Password must be >1 and <16 without space!");
    else displayBlock('change_password_btn');
}


function ChangePasswordfailed(errorcode, response_text) {
    var response = JSON.parse(response_text);
    if (typeof(response.status) !== 'undefined') id('password_content').innerHTML = translate_text_item(response.status);
    console.log("Error " + errorcode + " : " + response_text);
    displayNone('password_loader');
    displayBlock('change_password_content');
}

function ChangePasswordsuccess(response_text) {
    displayNone('password_loader');
    closeModal("Connection successful");
}

function SubmitChangePassword() {
    var user = id('current_ID').innerHTML.trim();
    var password = id('password_password_text').value.trim();
    var newpassword = id('password_password_text1').value.trim();
    var url = "/login?USER=" + encodeURIComponent(user) + "&PASSWORD=" + encodeURIComponent(password) + "&NEWPASSWORD=" + encodeURIComponent(newpassword) + "&SUBMIT=yes";
    displayBlock('password_loader');
    displayNone('change_password_content');
    SendGetHttp(url, ChangePasswordsuccess, ChangePasswordfailed);
}
>>>>>>> upstream/revamp
