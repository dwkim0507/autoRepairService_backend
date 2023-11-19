const express = require('express');
const path = require('path');
const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');
const session = require('express-session');

let myApp = express();

mongoose.connect('mongodb://0.0.0.0:27017/autoservice', {
   useNewUrlParser: true,
   useUnifiedTopology: true
});

const Contacts = mongoose.model('Contacts', {
   name: String,
   email: String,
   photoName: String,
   autoMessage: String
});

const Admin = mongoose.model('Admin', {
   username: String,
   password: String,
});

myApp.use(express.static(__dirname + '/public'));
myApp.set('view engine', 'ejs');
myApp.set('views', path.join(__dirname, 'views'));

myApp.use(express.urlencoded({ extended: false }));
myApp.use(fileUpload());

myApp.use(
   session({
      secret: 'aslkdfjlaskd1237103498', // should be unique for each application
      resave: false,
      saveUninitialized: true,
   })
);

myApp.get('/', function (req, res) {
   res.render('home');
});

myApp.get('/addnew', function (req, res) {
   res.render('home')
})

myApp.get('/admin', async (req, res) => {
   if (req.session.loggedIn) {
      const data = await Contacts.find()
      res.render('admin', { data })
   } else {
      res.redirect('/login');
   }
});

myApp.get('/login', (req, res) => {
   res.render('login');
});

/*
myApp.get('/logout', async (req, res) => {
   req.session.distroy();
   res.render('admin', { data })
})
*/

myApp.get('/logout', (req, res) => {
   req.session.username = '';
   req.session.loggedIn = false;
   res.redirect('/login');
});

myApp.post('/login_process', async (req, res) => {
   // fetch login data
   let username = req.body.username;
   let password = req.body.password;

   // find admin in the database
   const admin = await Admin.findOne({
      username,
      password,
   }).exec();

   if (admin) {
      req.session.username = admin.username;
      req.session.loggedIn = true;
      res.redirect('/admin');
   } else {
      let pageData = {
         error: 'Login details not correct',
      };
      res.render('login', pageData);
   }
});

// Admin account setup
myApp.get('/setup', function (req, res) {
   var adminData = {
      username: 'admin',
      password: 'admin',
   };
   let newAdmin = new Admin(adminData);
   newAdmin.save();
   res.send('Done');
});

myApp.post('/addnew_process', [
   check('name', 'Please enter Name').notEmpty(),
   check('email', 'Please enter Email/Phone').notEmpty(),
   check('autoMessage', 'Please enter Message').notEmpty()
], function (req, res) {

   const errors = validationResult(req);

   if (!errors.isEmpty()) {
      var errorData = errors.array();
      res.render('home', { errors: errorData });
   }
   else {
      let name = req.body.name
      let email = req.body.email
      let autoMessage = req.body.autoMessage

      let photoName = req.files.photo.name;
      let photoFile = req.files.photo;
      let photoPath = 'public/uploads/' + photoName;
      photoFile.mv(photoPath);

      // photoFile.mv(photoPath, function (err) {
      //    console.log(err);
      // });

      var pageData = {
         name: name,
         email: email,
         photoName: photoName,
         autoMessage: autoMessage
      }

      var newContact = new Contacts(pageData);
      newContact.save();
      res.render('addthank', pageData);
   }
})

/* view in admin */
myApp.get('/detail/:id', async (req, res) => {
   const contact = await Contacts.findOne({
      _id: req.params.id
   }).exec();

   res.render('detail', { contact });
});

/* edit in admin */
myApp.get('/edit/:id', async (req, res) => {
   const contact = await Contacts.findOne({
      _id: req.params.id
   }).exec();

   res.render('edit', { contact });
});

/* delete in admin */
myApp.get('/delete/:id', async (req, res) => {
   let id = req.params.id;
   await Contacts.findByIdAndRemove({ _id: id }).exec();

   res.render('delete');
});

myApp.post('/edit_process', async (req, res) => {

   let id = req.body.id;
   let name = req.body.name;
   let email = req.body.email;
   let autoMessage = req.body.autoMessage;

   await Contacts.findByIdAndUpdate(
      { _id: id },
      {
         name: name,
         email: email,
         autoMessage: autoMessage
      }
   ).exec();

   res.redirect('/admin');

});

//listen at a port
myApp.listen(8091);
console.log('Open http://localhost:8091 in your browser');
