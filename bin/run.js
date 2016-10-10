'use strict';

var google = require('../lib/google');
var baidu = require('../lib/baidu');

var
  nextCounter = 0,
  string = 'test',
  pages = 2;

var
  googleResults = [],
  baiduResults = [];

baidu.resultsPerPage = 10;
baidu.lang = 'cn';
baidu.sensitive = ['新浪微', '客服'];

google.lang = 'cn';

baidu(string, function(err, res) {
  if (err) console.error(err);
  if (!res) {
    console.error(new Error('Error on response'));
    return;
  }

  for (var i = 0; i < res.links.length; ++i) {
    var link = res.links[i];
    baiduResults.push(link);
  }

  if (nextCounter < pages) {
    nextCounter += 1;
    if (res.next) res.next();
  }else {}
});
// google(string, function(err, res) {
//   if (err) console.error(err);

//   for (var i = 0; i < res.links.length; ++i) {
//     var link = res.links[i];
//     googleResults.push(link);
//   }

//   if (nextCounter < pages) {
//     nextCounter += 1;
//     if (res.next) res.next();
//   }else {}
// });
