// version 1.0
(function() {

var _doc = document,

_win = window,

// 已加载模块, _loaded[fileURL]=true
_loaded = {},

// 加载中的模块，对付慢文件，_loadingQueue[url]=true|false
_loadingQueue = {},

_isArray = function(e) { return e.constructor === Array; },

// 内部配置文件
_config = {
    // 是否自动加载核心库
    autoLoad: true,

    //核心库
    coreLib: ['http://t.douban.com/js/jquery.min.js'],

    //模块依赖
    //{
    // moduleName: {
    //     path: 'URL',
    //     type:'js|css',
    //     requires:['moduleName1', 'fileURL']
    //   }
    //}
    mods: {}
},

// 插入的参考结点
_jsFiles = _doc.getElementsByTagName('script'),

_jsSelf = _jsFiles[_jsFiles.length - 1],

_jsConfig,

_do,

_readyList = [],

_isReady = false,

// 全局模块
_globalList = [],

// 加载js/css文件
_load = function(url, type, charset, cb, context) {
    var refFile = _jsFiles[0];

    if (!url) {
        return;
    }

    if (_loaded[url]) {
        _loadingQueue[url] = false;
        if (cb) {
            cb(url, context);
        }
        return;
    }

    // 加载中的文件有可能是太大，有可能是404
    // 当加载队列中再次出现此模块会再次加载，理论上会出现重复加载
    if (_loadingQueue[url]) {
        setTimeout(function() {
            _load(url, type, charset, cb, context);
        }, 1);
        return;
    }

    _loadingQueue[url] = true;

    var n, t = type || url.toLowerCase().substring(url.lastIndexOf('.') + 1);

    if (t === 'js') {
        n = _doc.createElement('script');
        n.setAttribute('type', 'text/javascript');
        n.setAttribute('src', url);
        n.setAttribute('async', true);
    } else if (t === 'css') {
        n = _doc.createElement('link');
        n.setAttribute('type', 'text/css');
        n.setAttribute('rel', 'stylesheet');
        n.setAttribute('href', url);
        _loaded[url] = true;
    }

    if (charset) {
        n.charset = charset;
    }

    // CSS无必要监听是否加载完毕
    if (t === 'css') {
      refFile.parentNode.insertBefore(n, refFile);
      if (cb) {
        cb(url, context);
      }
      return;
    }

    n.onload = n.onreadystatechange = function() {
        if (!this.readyState ||
            this.readyState === 'loaded' ||
            this.readyState === 'complete') {

            _loaded[this.getAttribute('src')] = true;

            if (cb) {
                cb(this.getAttribute('src'), context);
            }

            n.onload = n.onreadystatechange = null;
        }
    };

    refFile.parentNode.insertBefore(n, refFile);
},

// 计算加载队列。参数e是一个数组
_calculate = function(e) {
    if (!e || !_isArray(e)) {
        return;
    }

    var i = 0,
    item,
    result = [],
    mods = _config.mods,
    depeList = [],
    hasAdded = {},
    getDepeList = function(e) {
        var i = 0, m, reqs;

        // break loop require.
        if (hasAdded[e]) {
            return depeList;
        }
        hasAdded[e] = true;

        if (mods[e].requires) {
            reqs = mods[e].requires;
            for (; typeof (m = reqs[i++]) !== 'undefined';) {
              // is a module.
              if (mods[m]) {
                getDepeList(m);
                depeList.push(m);
               } else {
                // is a file.
                depeList.push(m);
               }
            }
            return depeList;
        }
        return depeList;
    };

    for (; typeof (item = e[i++]) !== 'undefined'; ) {
        if (mods[item] && mods[item].requires && mods[item].requires[0]) {
            depeList = [];
            hasAdded = {};
            result = result.concat(getDepeList(item));
        }
        result.push(item);
    }

    return result;
},

_ready = function() {
  _isReady = true;
  if (_readyList.length > 0) {
    _do.apply(this, _readyList);
    _readyList = [];
  }
},

_onDOMContentLoaded = function() {
  if (_doc.addEventListener) {
    _doc.removeEventListener('DOMContentLoaded', _onDOMContentLoaded, false);
  } else if (_doc.attachEvent) {
    _doc.detachEvent('onreadystatechange', _onDOMContentLoaded);
  }
  _ready();
},

_doScrollCheck = function() {
  if (_isReady) {
    return;
  }

  try {
    _doc.documentElement.doScroll('left');
  } catch (err) {
    return _win.setTimeout(_doScrollCheck, 1);
  }

  _ready();
},

// reference jQuery's bindReady method.
_bindReady = function() {
  if (_doc.readyState === 'complete') {
    return _win.setTimeout(_ready, 1);
  }

  var toplevel = false;

  if (_doc.addEventListener) {
    _doc.addEventListener('DOMContentLoaded', _onDOMContentLoaded, false);
    _win.addEventListener('load', _ready, false);
  } else if (_doc.attachEvent) {
    _doc.attachEvent('onreadystatechange', _onDOMContentLoaded);
    _win.attachEvent('onload', _ready);

    try {
      toplevel = (_win.frameElement === null);
    } catch (err) {}

    if (document.documentElement.doScroll && toplevel) {
      _doScrollCheck();
    }
  }
},

// 一个异步队列对象
_Queue = function(e) {
    if (!e || !_isArray(e)) {
        return;
    }

    this.queue = e;

    // 队列当前要加载的模块
    this.current = null;
};

_Queue.prototype = {

    _interval: 10,

    start: function() {
        var o = this;
        this.current = this.next();

        if (!this.current) {
            this.end = true;
            return;
        }

        this.run();
    },

    run: function() {
        var o = this, mod, currentMod = this.current;

        if (typeof currentMod === 'function') {
            currentMod();
            this.start();
            return;
        } else if (typeof currentMod === 'string') {
            if (_config.mods[currentMod]) {
              mod = _config.mods[currentMod];
              _load(mod.path, mod.type, mod.charset, function(e) {
                 o.start();
              }, o);
            } else if (/\.js|\.css/i.test(currentMod)) {
              // load a file.
              _load(currentMod, '', '', function(e, o) {
                 o.start();
              }, o);
            } else {
              // no found module. skip to next
              this.start();
           }
        }
    },

    next: function() { return this.queue.shift(); }
};

// 初始配置
_jsConfig = _jsSelf.getAttribute('data-cfg-autoload');
if (typeof _jsConfig === 'string') {
  _config.autoLoad = (_jsConfig.toLowerCase() === 'true') ? true : false;
}

_jsConfig = _jsSelf.getAttribute('data-cfg-corelib');
if (typeof _jsConfig === 'string') {
  _config.coreLib = _jsConfig.split(',');
}


_do = function() {
    var args = [].slice.call(arguments), thread;
    if (_globalList.length > 0) {
       args = _globalList.concat(args);
    }

    if (_config.autoLoad) {
       args = _config.coreLib.concat(args);
    }

    thread = new _Queue(_calculate(args));
    thread.start();
};

_do.add = function(sName, oConfig) {
    if (!sName || !oConfig || !oConfig.path) {
        return;
    }
    _config.mods[sName] = oConfig;
};

_do.delay = function() {
   var args = [].slice.call(arguments), delay = args.shift();
   _win.setTimeout(function() {
     _do.apply(this, args);
   }, delay);
};

_do.global = function() {
   var args = [].slice.call(arguments);
   _globalList = _globalList.concat(args);
};

_do.ready = function() {
    var args = [].slice.call(arguments);
    if (_isReady) {
      return _do.apply(this, args);
    }
    _readyList = _readyList.concat(args);
};

_do.css = function(str) {
 var css = _doc.getElementById('do-inline-css');
 if (!css) {
   css = _doc.createElement('style');
   css.type = 'text/css';
   css.id = 'do-inline-css';
   _jsFiles[0].parentNode.insertBefore(css, _jsFiles[0]);
 }

 if (css.styleSheet) {
   css.styleSheet.cssText = css.styleSheet.cssText + str;
 } else {
   css.appendChild(_doc.createTextNode(str));
 }
};

if (_config.autoLoad) {
  _do(_config.coreLib);
}

this.Do = _do;

_bindReady();

})();
