var Views = module.exports;
var fs = require('fs')

Views.viewsDir = __dirname + '/../views'

Views.index = ''
indexPage = fs.readFile(Views.viewsDir + '/index.html', 'utf8',
  function (err, data) {
    Views.index += data
  });

Views.header = ''
headerPage = fs.readFile(Views.viewsDir + '/header.html', 'utf8',
  function (err, data) {
    Views.header += data
  });

Views.sidebar = ''
sidebarPage = fs.readFile(Views.viewsDir + '/sidebar.html', 'utf8',
  function (err, data) {
    Views.sidebar += data
  });


Views.login = ''
loginPage = fs.readFile(Views.viewsDir  + '/login.html', 'utf8',
  function (err, data) {
    Views.login += data
  });

Views.dashboard = ''
dashboardPage = fs.readFile(Views.viewsDir  + '/dashboard.html', 'utf8',
  function (err, data) {
    Views.dashboard += data
  });
Views.admin = ''
adminPage = fs.readFile(Views.viewsDir  + '/admin.html', 'utf8',
  function (err, data) {
    Views.admin += data
  });

Views.accountActivated = ''
accountActivatedPage = fs.readFile(Views.viewsDir  + '/accountActivated.html', 'utf8',
  function (err, data) {
    Views.accountActivated += data
  });

Views.clientAdmin = ''
clientAdminPage = fs.readFile(Views.viewsDir  + '/clientAdmin.html', 'utf8',
  function (err, data) {
    Views.clientAdmin += data
  });

Views.user = ''
userPage = fs.readFile(Views.viewsDir  + '/user.html', 'utf8',
  function (err, data) {
    Views.user += data
  });

Views.addUser = ''
adduserPage = fs.readFile(Views.viewsDir  + '/addUser.html', 'utf8',
  function (err, data) {
    Views.addUser += data
  });

Views.client = ''
adminPage = fs.readFile(Views.viewsDir  + '/client.html', 'utf8',
  function (err, data) {
    Views.client += data
  });

Views.addClient = ''
addClientPage = fs.readFile(Views.viewsDir  + '/addClient.html', 'utf8',
  function (err, data) {
    Views.addClient += data
  });

Views.editClient = ''
editClientPage = fs.readFile(Views.viewsDir  + '/editClient.html', 'utf8',
  function (err, data) {
    Views.editClient += data
  });

Views.editAccount = ''
editAccountPage = fs.readFile(Views.viewsDir  + '/editAccount.html', 'utf8',
  function (err, data) {
    Views.editAccount += data
  });

Views.reallocateAccount = ''
reallocateAccountPage = fs.readFile(Views.viewsDir  + '/reallocateAccount.html', 'utf8',
  function (err, data) {
    Views.reallocateAccount += data
  });

Views.did = ''
didPage = fs.readFile(Views.viewsDir  + '/did.html', 'utf8',
  function (err, data) {
    Views.did += data
  });

Views.superReceptionist = ''
superReceptionistPage = fs.readFile(Views.viewsDir  + '/superReceptionist.html', 'utf8',
  function (err, data) {
    Views.superReceptionist += data
  });

Views.addExtension = ''
addExtensionPage = fs.readFile(Views.viewsDir  + '/addExtension.html', 'utf8',
  function (err, data) {
    Views.addExtension += data
  });

Views.superReceptionistList = ''
superReceptionistPage = fs.readFile(Views.viewsDir  + '/superReceptionistList.html', 'utf8',
  function (err, data) {
    Views.superReceptionistList += data
  });

Views.editExtension = ''
editExtensionPage = fs.readFile(Views.viewsDir  + '/editExtension.html', 'utf8',
  function (err, data) {
    Views.editExtension += data
  });


Views.clientDid = ''
clientDidPage = fs.readFile(Views.viewsDir  + '/clientDid.html', 'utf8',
  function (err, data) {
    Views.clientDid += data
  });

Views.accountSummary = ''
accountPage = fs.readFile(Views.viewsDir  + '/accountSummary.html', 'utf8',
  function (err, data) {
    Views.accountSummary += data
  });

Views.addAccount = ''
addAccountPage = fs.readFile(Views.viewsDir  + '/addAccount.html', 'utf8',
  function (err, data) {
    Views.addAccount += data
  });

Views.report = ''
reportPage = fs.readFile(Views.viewsDir  + '/report.html', 'utf8',
  function (err, data) {
    Views.report += data
  });

Views.inbox = ''
inboxPage = fs.readFile(Views.viewsDir  + '/inbox.html', 'utf8',
  function (err, data) {
    Views.inbox += data
  });

Views.voicemail = ''
voicemailPage = fs.readFile(Views.viewsDir  + '/voicemail.html', 'utf8',
  function (err, data) {
    Views.voicemail += data
  });

Views.addressbook = ''
addressbookPage = fs.readFile(Views.viewsDir  + '/addressbook.html', 'utf8',
  function (err, data) {
    Views.addressbook += data
  });


Views.addDid = ''
addDidtPage = fs.readFile(Views.viewsDir  + '/addDid.html', 'utf8',
  function (err, data) {
    Views.addDid += data
  });


Views.editDId = ''
editDidPage = fs.readFile(Views.viewsDir  + '/editDid.html', 'utf8',
  function (err, data) {
    Views.editDid += data
  });

Views.changeSetting = ''
changeSettingPage = fs.readFile(Views.viewsDir  + '/changeSetting.html', 'utf8',
  function (err, data) {
    Views.changeSetting += data
  });

Views.changePassword = ''
changePasswordPage = fs.readFile(Views.viewsDir  + '/changePassword.html', 'utf8',
  function (err, data) {
    Views.changePassword += data
  });

Views.demoAccount = ''
demoAccountPage = fs.readFile(Views.viewsDir  + '/demoAccount.html', 'utf8',
  function (err, data) {
    Views.demoAccount += data
  });

Views.addDemo = ''
addDemoPage = fs.readFile(Views.viewsDir  + '/addDemo.html', 'utf8',
  function (err, data) {
    Views.addDemo += data
  });

Views.demoDashboard = ''
demoDashboardPage = fs.readFile(Views.viewsDir  + '/demoDashboard.html', 'utf8',
  function (err, data){
    Views.demoDashboard += data
  });

Views.example = ''
examplePage = fs.readFile(Views.viewsDir  + '/example.html', 'utf8',
  function (err, data) {
    Views.example += data
  });

Views.contactus = ''
contactus = fs.readFile(Views.viewsDir  + '/contact.html', 'utf8',
  function (err, data) {
    Views.contactus += data
  });

Views.checkSocket = ''
checkSocket = fs.readFile(Views.viewsDir  + '/checkSocket.html', 'utf8',
  function (err, data) {
    Views.checkSocket += data
  });

Views.editResources = ''
checkSocket = fs.readFile(Views.viewsDir  + '/editResources.html', 'utf8',
  function (err, data) {
    Views.editResources += data
  });

Views.allocateDidForVR = ''
allocateDidForVRPage = fs.readFile(Views.viewsDir + '/allocateDidForVR.html', 'utf8',
  function (err, data) {
    Views.allocateDidForVR += data
  });

Views.createBWList = ''
createBWListPage = fs.readFile(Views.viewsDir + '/createBWList.html', 'utf8',
  function (err, data) {
    Views.createBWList += data
  });


Views.missedCall = ''
missedCallPage = fs.readFile(Views.viewsDir + '/missedCall.html', 'utf8',
  function (err, data) {
    Views.missedCall += data
  });

Views.stickyAgent = ''
stickyAgentPage = fs.readFile(Views.viewsDir + '/stickyAgent.html', 'utf8',
  function (err, data) {
    Views.stickyAgent += data
  });
