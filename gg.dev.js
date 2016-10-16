'use strict';
(function (parentWindow) {
  var account
  var firebaseConfig
  var timeLoad = new Date().getTime()
  var path = document.location.host + document.location.pathname.split('/').join('_')
  var version = '1.0.1'

  var getDocumentDimensions = function () {
    var width, height
    if (window.innerWidth) {
      width = window.innerWidth
    } else {
      width = window.document.documentElement.clientWidth
    }

    if (window.innerHeight) {
      height = window.innerHeight
    } else {
      height = window.document.documentElement.clientHeight
    }

    return {
      'width': width,
      'height': height
    }
  }

  var preserveOnmousemove = window.onmousemove
  var preserveOnclick = window.onclick
  var preserveOnresize = window.onresize
  var preserveOnscroll = window.onscroll

  var seeyourvisitors = {
    create: function (a) {
      firebaseConfig = a[0]
    },

    stoptrack: function () {
      window.onmousemove = preserveOnmousemove
      window.onclick = preserveOnclick
      window.onresize = preserveOnresize
    },

    track: function () {
      seeyourvisitors['_load_firebase'](function () {
        seeyourvisitors['_establish_connection']()
      })
    },

    viewresults: function (src) {
      seeyourvisitors['_load_firebase'](function () {
        var s = document.createElement('script')
        s.src = src
        document.getElementsByTagName('head')[0].appendChild(s)
      })
    },

    _load_firebase: function (callback) {
      var s = document.createElement('script')
      s.src = 'https://www.gstatic.com/firebasejs/3.5.0/firebase.js'
      document.getElementsByTagName('head')[0].appendChild(s)

      s.onload = function () {
        if (!window.firebase) {
          return
        }
        window.firebase.initializeApp(firebaseConfig)

        window.firebase.auth().onAuthStateChanged(function (user) {
          if (user) {
            // User is signed in.
            account = user.uid
            callback()
          } else {
            // User is signed out
            window.firebase.auth().signInAnonymously()
          }
        })
      }
    },

    _establish_connection: function () {
      var connect = function () {
        var viewRef

        var send = function (message) {
          if (message.a === 'connect') {
            viewRef = window.firebase.database().ref('views/' + path).push()
            message.view = viewRef.key
            viewRef.set(message)
            window.firebase.database().ref('users/' + account).child('lastSeen').set(new Date().getTime())
          } else {
            message.ac = account
            message.view = viewRef.key
            window.firebase.database().ref('events/' + path).push().set(message)
          }
        }

        var prevCoords
        var maxRate = 1
        var prevDate = new Date().getTime()
        var prevScrollDate = new Date().getTime()
        var data = {
          a: 'connect',
          sr: window.screen.width + 'x' + window.screen.height,
          sw: getDocumentDimensions().width + 'x' + getDocumentDimensions().height,
          cs: window.screen.colorDepth,
          tl: timeLoad,
          ct: document.querySelector('meta[http-equiv="content-type"]') ? document.querySelector('meta[http-equiv="content-type"]').getAttribute('content') : '',
          ac: account,
          ul: window.navigator.userLanguage || window.navigator.language,
          ag: navigator.userAgent,
          dt: document.title,
          dr: document.referrer,
          l: document.location.href,
          t: Number(new Date()),
          v: version
        }
        // send to server.js, with or without of ajax'd jsonp data
        send(data)

        // More Events: http://developer.apple.com/library/safari/#documentation/AppleApplications/Reference/SafariWebContent/HandlingEvents/HandlingEvents.html
        window.onmousemove = function (e) {
          if (preserveOnmousemove) {
            preserveOnmousemove(e)
          }
          // avoid sending same coordinates twice in a row

          var date = new Date().getTime()
          if (date - prevDate > 200 / maxRate) {
            var coords = [e.pageX, e.pageY].join(',')
            if (coords !== prevCoords) {
              send({ a: 'move',
                           x: e.pageX,
                           y: e.pageY
                           })
              prevCoords = coords
              prevDate = date
            }
          }
        }

        window.onscroll = function (e) {
          if (preserveOnscroll) {
            preserveOnscroll(e)
          }
          // avoid sending same coordinates twice in a row
          var date = new Date().getTime()
          if (date - prevScrollDate > 1000 / maxRate) {
            var doc = document.documentElement
            var body = document.body
            var left = (doc && doc.scrollLeft || body && body.scrollLeft || 0)
            var top = (doc && doc.scrollTop || body && body.scrollTop || 0)
            send({ a: 'scroll',
                                  left: left,
                                  top: top
                                })
            prevScrollDate = date
          }
        }

        window.onclick = function (e) {
          if (preserveOnclick) {
            preserveOnclick(e)
          }
          send({ a: 'click',
                       x: e.pageX,
                       y: e.pageY
                       })
        }

        window.onresize = function (e) {
          if (preserveOnresize) {
            preserveOnresize(e)
          }
          send({ a: 'resize',
                       w: window.innerWidth,
                       h: window.innerHeight
                       })
        }
      }
      connect()
    },

    _loaded: function (func) {
      func[0]('test')
    },

    _init: function () {
      var SeeYourVisitorsQueue = function () {
        this.push = function () {
          for (var i = 0; i < arguments.length; i++) {
            try {
              var args = Array.prototype.slice.call(arguments[i], 0)
              if (typeof (args) === 'string') {
                seeyourvisitors[args]()
              } else {
                seeyourvisitors[args[0]](args.slice(1))
              }
            } catch (e) {}
          }
        }
      }

      var gg = parentWindow[parentWindow.SeeYourVisitors]
      // get the existing _ggq array
      var _oldGgq = gg.q

      timeLoad = gg.l || timeLoad

      // create a new _ggq object
      gg.q = new SeeYourVisitorsQueue()

      // execute all of the queued up events - apply() turns the array entries into individual arguments
      gg.q.push.apply(gg.q, _oldGgq)
    }
  }

  seeyourvisitors._init()
})(window)
if (!window.gg) { window.gg = function () { (window.gg.q = window.gg.q || []).push(arguments) } }
