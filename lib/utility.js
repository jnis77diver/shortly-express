var request = require('request');
var casper = require('casper');
casper.create({
  verbose: false,
  logLevel: "debug"
});

exports.getUrlTitle = function(url, cb) {
  request(url, function(err, res, html) {
    if (err) {
      console.log('Error reading url heading: ', err);
      return cb(err);
    } else {
      var tag = /<title>(.*)<\/title>/;
      var match = html.match(tag);
      var title = match ? match[1] : url;
      return cb(err, title);
    }
  });
};

var rValidUrl = /^(?!mailto:)(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[0-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))|localhost)(?::\d{2,5})?(?:\/[^\s]*)?$/i;

exports.isValidUrl = function(url) {
  return url.match(rValidUrl);
};

/************************************************************/
// Add additional utility functions below
/************************************************************/





exports.isLoggedIn = function(req, res) {
  return req.session? !!req.session.username: false;
}

exports.captureImage = function() {
  var viewports = [
    {
      'name': 'website',
      'viewport': {width: 1280, height: 1024}
    }];
  if (casper.cli.args.length < 1) {
    casper
      .echo("Usage: $ casperjs screenshots.js http://google.com")
      .exit(1)
    ;
  } else {
    screenshotUrl = casper.cli.args[0];
  }
  casper.start(screenshotUrl, function() {
    this.echo('Current location is ' + this.getCurrentUrl(), 'info');
  });
  casper.each(viewports, function(casper, viewport) {
    this.then(function() {
      this.viewport(viewport.viewport.width, viewport.viewport.height);
    });
    this.thenOpen(screenshotUrl, function() {
      this.wait(5000);
    });
    this.then(function(){
      this.echo('Screenshot for ' + viewport.name + ' (' + viewport.viewport.width + 'x' + viewport.viewport.height + ')', 'info');
      this.capture('screenshots/' + screenshotDateTime + '/' + viewport.name + '-' + viewport.viewport.width + 'x' + viewport.viewport.height + '.png', {
        top: 0,
        left: 0,
        width: viewport.viewport.width,
        height: viewport.viewport.height
      });
    });
  });
  casper.run();
};
exports.captureImage();