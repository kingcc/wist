'use strict';
var google = require('./baidu');

google.resultsPerPage = 10;
google.lang = 'cn';
google.sensitive = ['新浪微','客服'];
var nextCounter = 0;

google('js switch', function (err, res){
  if (err) console.error(err);
  var index = nextCounter*google.resultsPerPage + 1;

  for (var i = 0; i < res.links.length; ++i) {
    var link = res.links[i];
    console.log(`[${index++}] ${link.title}`);
    console.log(link.description);
    console.log(`[${link.href}]\n`);
  }

  if (nextCounter < 0) {
    nextCounter += 1;
    if (res.next) res.next();
  }
});