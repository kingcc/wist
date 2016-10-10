var request = require('request')
var cheerio = require('cheerio')
var querystring = require('querystring')
var util = require('util')
var crypto = require('crypto');

var linkSel = 'h3.t a'
var descSel = 'div.c-abstract'
var itemSel = 'div.c-container'
var nextSel = 'a.n'

var URL = 'http://www.baidu.com/s?wd=%s&pn=%s'
var remove  = []

var nextTextErrorMsg = 'Translate `baidu.nextText` option to selected language to detect next results link.'
var protocolErrorMsg = "Protocol `baidu.protocol` needs to be set to either 'http' or 'https', please use a valid protocol. Setting the protocol to 'https'."

// start parameter is optional
function baidu (query, start, callback) {
  var startIndex = 0
  remove = [];
  if (typeof callback === 'undefined') {
    callback = start
  } else {
    startIndex = start
  }
  ibaidu(query, startIndex, callback, remove)
}

baidu.resultsPerPage = 10
baidu.requestOptions = {}
baidu.nextText = '下一页>'
baidu.lang = 'cn'

baidu.remove = true

baidu.sensit = 'A'
baidu.sensitString = ''
baidu.sensitive = []

var ibaidu = function (query, start, callback, remove) {
  var remove = remove || []
  if (baidu.resultsPerPage > 100) baidu.resultsPerPage = 100 // baidu won't allow greater than 100 anyway

  // timeframe is optional. splice in if set
  if (baidu.timeSpan) {
    URL = URL.indexOf('tbs=qdr:') >= 0 ? URL.replace(/tbs=qdr:[snhdwmy]\d*/, 'tbs=qdr:' + baidu.timeSpan) : URL.concat('&tbs=qdr:', baidu.timeSpan)
  }
  var newUrl = util.format(URL, querystring.escape(query), start)
    if(baidu.lang === 'en') newUrl += '&sl_lang=en&rsv_srlang=en&rsv_rq=en'
  var requestOptions = {
    url: newUrl,
    method: 'GET'
  }

  for (var k in baidu.requestOptions) {
    requestOptions[k] = baidu.requestOptions[k]
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
      $(itemSel).each(function (i, elem) {
        var linkElem = $(elem).find(linkSel)
        var descElem = $(elem).find(descSel)
        var item = {
          title: $(linkElem).first().text(),
          link: null,
          description: null,
          href: null
        }
        var qsObj = querystring.parse($(linkElem).attr('href'))

        if (qsObj['http://www.baidu.com/link?url']) {
          item.link = 'http://www.baidu.com/link?url=' + qsObj['http://www.baidu.com/link?url']
          item.href = item.link
        }

        $(descElem).find('div').remove()
        item.description = $(descElem).text()
        if (baidu.remove) {
          var md5sum = crypto.createHash('md5').update(item.title + item.description).digest('hex');
          if (remove.indexOf(md5sum) === -1) {
            remove.push(md5sum)           
          }else {
            return
          }
        }
        switch (baidu.sensit) {
          case 'A': sensitString = item.title + item.description ; break;
          case 'B': sensitString = item.title ; break;
          case 'C': sensitString = item.link  ; break;
        }
        for (var sensitive of baidu.sensitive) {
          if ((baidu.sensit).indexOf(sensitive) !== -1) return
        }        
        res.links.push(item)
      })
      if ($(nextSel).last().text() === baidu.nextText) {
        res.next = function () {
          ibaidu(query, start + baidu.resultsPerPage, callback, remove)
        }
      }

      callback(null, res)
    } else {
      callback(new Error('Error on response' + (resp ? ' (' + resp.statusCode + ')' : '') + ':' + err + ' : ' + body), null, null)
    }
  })
}

module.exports = baidu
