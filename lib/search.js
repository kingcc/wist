var request = require('request')
var cheerio = require('cheerio')
var querystring = require('querystring')
var util = require('util')
var crypto = require('crypto');

/**
 * 	Main Function Entry
 *  @type {Boolean}
 */

function Search (query, start, callback) {
  var startIndex = 0
  if (typeof callback === 'undefined') {
    callback = start
  } else {
    startIndex = start
  }
  iSearch(query, startIndex, callback, this.remove)
}

/**
 *  Config Injection
 */

var 

/**
 * Search Engine Config
 */

  Search.nextTextErrorMsg = '',
  Search.protocolErrorMsg = '',
  Search.linkSel = '',
  Search.descSel = '',
  Search.itemSel = '',
  Search.nextSel = '',
  Search.url = '',
  Search.parseUrl = '',

/**
 * Results Options
 */

  Search.resultsPerPage = 10,
  Search.requestOptions = {},
  Search.nextText = '下一页>',
  Search.lang = 'cn',
  Search.tld = 'com',
  Search.protocol = 'https',

/**
 * Remove Same Results
 * @type {Boolean}
 */

  Search.remove = true,

/**
 * Sensitive Options
 * @type {String}
 */

  Search.sensit = 'A',
  Search.sensitString = '',
  Search.sensitive = [];


var iSearch = function (query, start, callback, remove) {
  var remove = remove || []
  if (Search.resultsPerPage > 100) Search.resultsPerPage = 100

  if (Search.timeSpan) {
    Search.url = Search.url.indexOf('tbs=qdr:') >= 0 ? Search.url.replace(/tbs=qdr:[snhdwmy]\d*/, 'tbs=qdr:' + Search.timeSpan) : Search.url.concat('&tbs=qdr:', Search.timeSpan)
  }
  var newUrl = util.format(Search.url, querystring.escape(query), start)
    if(Search.lang === 'en') newUrl += '&sl_lang=en&rsv_srlang=en&rsv_rq=en'
  var requestOptions = {
    url: newUrl,
    method: 'GET'
  }

  for (var k in Search.requestOptions) {
    requestOptions[k] = Search.requestOptions[k]
  }

  request(requestOptions, function (err, resp, body) {
    if ((err == null) && resp.statusCode === 200) {
      var $ = cheerio.load(body)
      var res = {
        url: newUrl,
        query: query,
        start: start,
        links: [],
        $: $,
        body: body
      }
      $(Search.itemSel).each(function (i, elem) {
        var linkElem = $(elem).find(Search.linkSel)
        var descElem = $(elem).find(Search.descSel)
        var item = {
          title: $(linkElem).first().text(),
          link: null,
          description: null,
          href: null
        }
        var qsObj = querystring.parse($(linkElem).attr('href'))

        if (qsObj[Search.parseUrl]) {
          item.link = Search.parseUrl + '=' + qsObj[Search.parseUrl]
          item.href = item.link
        }

        $(descElem).find('div').remove()
        item.description = $(descElem).text()
        if (Search.remove) {
          var md5sum = crypto.createHash('md5').update(item.title + item.description).digest('hex');
          if (remove.indexOf(md5sum) === -1) {
            remove.push(md5sum)           
          }else {
            return
          }
        }
        switch (Search.sensit) {
          case 'A': sensitString = item.title + item.description ; break;
          case 'B': sensitString = item.title ; break;
          case 'C': sensitString = item.link  ; break;
        }
        for (var sensitive of Search.sensitive) {
          if ((Search.sensit).indexOf(sensitive) !== -1) return
        }        
        res.links.push(item)
      })
      if ($(Search.nextSel).last().text() === Search.nextText) {
        res.next = function () {
          iSearch(query, start + Search.resultsPerPage, callback, remove)
        }
      }

      callback(null, res)
    } else {
      callback(new Error('Error on response' + (resp ? ' (' + resp.statusCode + ')' : '') + ':' + err + ' : ' + body), null, null)
    }
  })
}

module.exports = Search