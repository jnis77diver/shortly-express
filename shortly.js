var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var bcrypt = require('bcrypt-nodejs');
var session = require('express-session');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//app.use(express.cookieParser());
app.use(session({secret:'somesecrettokenhere'}));


//app.use(express.cookieSession());
//app.use(app.router);

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

var sess;

app.get('/', 
function(req, res) {
  //sess = req.session;
  //sess.session3 = 10;
  //console.log("sess.cookie is", sess.cookie);

  checkForLoggedIn(req, res, 'index');
  //res.render('index');
});

app.get('/create', 
function(req, res) {
  checkForLoggedIn(req, res, 'index');
});

app.get('/login',
  function(req, res) {
    res.render('login');

});

app.get('/signup',
  function(req, res) {
    res.render('signup');
});

app.get('/logout',
  function(req, res) {
    return req.session.destroy(function(err) {
      res.render('logout');
    });
});

//app.get('/test',
//  function(req, res) {
//    res.cookie('jonah', 1234);
//    res.send(200);
//});

app.get('/links', function(req, res) {
  var username = req.session.username;
  if( !util.isLoggedIn(req, res) ){
    res.redirect('/login');
    res.end();
  } else {


  //Links.reset().fetch().then(function(links) {
  //  res.send(200, links.models);

    Links.reset().query({where: {username: username}}).fetch().then(function(links) {
      //res.render('index');
      res.send(200, links.models);
    });
  }
});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;
  var username = req.session.username;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }
  new Link({ url: uri , username : username}).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }
        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin,
          username: username
        });
        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

app.post('/signup', function(req, res) {
  var randomNum = Math.ceil(Math.random() * 10000);
  var username = req.body.username;
  var password = req.body.password;
  req.session.username = username;
  var salt = bcrypt.genSaltSync(10);
  var hash = bcrypt.hashSync(password, salt);
  Users
    .query({where: {username: username}})
    .fetch()
    .then(function(user) {
      console.log("empty user", user);
      if( user.models.length === 0 ) {
        var userObj = new User({ username: username, password: hash, salt: salt, session: randomNum })
          .save()
          .then(function(user) {
            console.log("user is", user);
            req.session.test = randomNum;
            //req.session.cookie = randomNum;
            //res.cookie('session', randomNum);
            res.redirect('/');

            res.send(user[0]);
            res.end();
            //res.send(200,user);
          });
      } else {
        //if user exists with that username already, send them back to signup page
        //and ideally present message to choose a differnt username
        res.redirect('/signup');
        res.end();
      }
    });


    //.catch(function(error) {
    //  console.log("+++++++++++++++++++++++++++++");
    //  console.log("error is", error);
    //  //alert user that that username already exists, choose a new one
    //});
  //if(userObj){
  //  //req.session.regenerate(function(){
  //  //req.session.user = userObj.username;
  //  //res.redirect('/restricted');
  //  //});
  //}
  //else {
  //  res.redirect('login');
  //}
});

app.post('/login', function(req, res) {
  var randomNum = Math.ceil(Math.random() * 10000);
  var username = req.body.username;
  var password = req.body.password;

  Users
   .query({where: {username: username}})
   .fetch()
   .then(function(users) {
     console.log("model ", users.models[0].attributes.salt);
     var hash = bcrypt.hashSync(password, users.models[0].attributes.salt);
     if (hash === users.models[0].attributes.password) {
       console.log('user has correct password');
       //set the session id in the database
       console.log('currsession', users.models[0].attributes.session);
       users.set({session: randomNum});
       console.log('nextsession', users.models[0].attributes.session);
       req.session.test = randomNum;
       req.session.username = username;
       res.redirect('/');
       console.log('set redirect');
       res.end();
     }
   })
    .catch(function(err) {
      res.redirect('/login');
      res.end();
    });




    //.catch()
});






 // var hash = bcrypt.hashSync(password, salt);
  //var userObj = new User({ username: username, password: hash, salt: salt, session: randomNum })
 //   .save()
 //   .then(function(user) {

      //res.send(200,user);
    //});
  //if(userObj){
    //req.session.regenerate(function(){
    //req.session.user = userObj.username;
    //res.redirect('/restricted');
    //});
  //}
 // else {
  //  res.redirect('login');
 // }
//});

/************************************************************/
// Write your authentication routes here
/************************************************************/
var checkForLoggedIn = function(req, res, renderThis) {
  console.log('cookie214234',req.session.test);
  //console.log('the cookie',req.session.cookie);
  if(req.session.test === undefined){
    res.redirect('/login');
    res.end();
  } else {
    res.render(renderThis);
  }
};


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  console.log('in app.get');
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            //return res.redirect(link.get('url'));
            console.log('url', link.get('url'));
            return res.redirect(link.get('url'));
            res.request.href = link.get('url');
            res.end(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
