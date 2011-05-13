// version 1.0
(function(win, doc) {


// 已加载模块, loaded[fileURL]=true
var loaded = {},

// 加载列表
loadList = {},

// 加载中的模块，对付慢文件，loadingQueue[url]=true|false
loadingQueue = {},

isArray = function(e) { 
  return e.constructor === Array; 
},

// 内部配置文件
config = {
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

jsSelf = (function() { 
  var files = doc.getElementsByTagName('script'); 
  return files[files.length - 1];
})(),

// 插入的参考结点
refFile = jsSelf,

// 外部配置
extConfig,

_do,

readyList = [],

isDomReady = false,

publicData = {},

wait = {},

// 全局模块
globalList = [],

// 加载js/css文件
load = function(url, type, charset, cb) {
    var wait, timeout = 6000;

    if (!url) {
        return;
    }

    if (loaded[url]) {
        loadingQueue[url] = false;
        if (cb) {
            cb(url);
        }
        return;
    }

    // 加载中的文件有可能是太大，有可能是404
    // 当加载队列中再次出现此模块会再次加载，理论上会出现重复加载
    if (loadingQueue[url]) {
        setTimeout(function() {
            load(url, type, charset, cb);
        }, 10);
        return;
    }

    loadingQueue[url] = true;

    wait = win.setTimeout(function(){
      // 文件加载超时。failback.
      console.log(url);
      load('http://www.douban.com/js/douban.js', type, charset, cb);
    }, timeout);

    var n, t = type || url.toLowerCase().substring(url.lastIndexOf('.') + 1);

    if (t === 'js') {
        n = doc.createElement('script');
        n.setAttribute('type', 'text/javascript');
        n.setAttribute('src', url);
        n.setAttribute('async', true);
    } else if (t === 'css') {
        n = doc.createElement('link');
        n.setAttribute('type', 'text/css');
        n.setAttribute('rel', 'stylesheet');
        n.setAttribute('href', url);
        loaded[url] = true;
    }

    if (charset) {
        n.charset = charset;
    }

    // CSS无必要监听是否加载完毕
    if (t === 'css') {
      refFile.parentNode.insertBefore(n, refFile);
      if (cb) {
        cb(url);
      }
      win.clearTimeout(wait);
      return;
    }

    n.onload = n.onreadystatechange = function() {
        if (!this.readyState ||
            this.readyState === 'loaded' ||
            this.readyState === 'complete') {

            loaded[this.getAttribute('src')] = true;

            if (cb) {
                cb(this.getAttribute('src'));
            }
            win.clearTimeout(wait);
            n.onload = n.onreadystatechange = null;
        }
    };

    refFile.parentNode.insertBefore(n, refFile);
},


loadDeps = function(deps, cb) {
  var mods = config.mods, 
  id, m, mod, i = 0, len;

  id = deps.join('');
  len = deps.length;

  if (loadList[id]) {
    cb();
    return;
  }

  function callback() {
    if(!--len) {
      loadList[id] = 1;
      cb();
    }
  }

  for (; m = deps[i++]; ) {
    mod = (mods[m])? mods[m] : { path: m };
    if (mod.requires) {
      loadDeps(mod.requires, (function(mod){
        return function(){
          load(mod.path, mod.type, mod.charset, callback);
        };
      })(mod));
    } else {
      load(mod.path, mod.type, mod.charset, callback);
    }
  }
},

/*!
* contentloaded.js
*
* Author: Diego Perini (diego.perini at gmail.com)
* Summary: cross-browser wrapper for DOMContentLoaded
* Updated: 20101020
* License: MIT
* Version: 1.2
*
* URL:
* http://javascript.nwbox.com/ContentLoaded/
* http://javascript.nwbox.com/ContentLoaded/MIT-LICENSE
*
*/

// @win window reference
// @fn function reference
contentLoaded = function(fn) {

var done = false, top = true, doc = win.document, root = doc.documentElement,
add = doc.addEventListener ? 'addEventListener' : 'attachEvent',
rem = doc.addEventListener ? 'removeEventListener' : 'detachEvent',
pre = doc.addEventListener ? '' : 'on',

init = function(e) {
  if (e.type == 'readystatechange' && doc.readyState != 'complete') return;
  (e.type == 'load' ? win : doc)[rem](pre + e.type, init, false);
  if (!done && (done = true)) fn.call(win, e.type || e);
},

poll = function() {
  try { root.doScroll('left'); } catch(e) { setTimeout(poll, 50); return; }
  init('poll');
};

if (doc.readyState == 'complete') fn.call(win, 'lazy');
else {
  if (doc.createEventObject && root.doScroll) {
    try { top = !win.frameElement; } catch(e) { }
    if (top) {
     poll();
    }
  }
  doc[add](pre + 'DOMContentLoaded', init, false);
  doc[add](pre + 'readystatechange', init, false);
  win[add](pre + 'load', init, false);
}

};


// 初始外部配置
extConfig = jsSelf.getAttribute('data-cfg-autoload');
if (typeof extConfig === 'string') {
  config.autoLoad = (extConfig.toLowerCase() === 'true') ? true : false;
}

extConfig = jsSelf.getAttribute('data-cfg-corelib');
if (typeof extConfig === 'string') {
  config.coreLib = extConfig.split(',');
}



_do = function() {
  var args = [].slice.call(arguments), 
  mods = config.mods, fn, list, id, len, i = 0, m, mod;

  // 自动加载核心库
  if (config.autoLoad) {
    if (!loadList[config.coreLib.join('')]) {
      loadDeps(config.coreLib, function(){
        _do.apply(null, args);
      });
      return;
    }
  }

  if (globalList.length > 0) {
    if (!loadList[globalList.join('')]) {
     loadDeps(globalList, function(){
        _do.apply(null, args);
      });
      return;
    }
  }

  if (typeof args[args.length - 1] === 'function' ) {
    fn = args.pop();
  }

  id = args.join('');


  if ((args.length === 0 || loadList[id]) && fn) {
    fn();
    return;
  }

  len = args.length;

  function callback() {
    if (!--len) {
      loadList[id] = 1;
      fn && fn();
    }
  };

  for (; m = args[i++]; ) {
    mod = (mods[m])? mods[m] : { path: m };
    if (mod.requires) {
      loadDeps(mod.requires, (function(mod){
        return function(){
          load(mod.path, mod.type, mod.charset, callback);
        };
      })(mod));
    } else {
      load(mod.path, mod.type, mod.charset, callback);
    }
  }
};

_do.add = function(sName, oConfig) {
    if (!sName || !oConfig || !oConfig.path) {
        return;
    }
    config.mods[sName] = oConfig;
};

_do.delay = function() {
   var args = [].slice.call(arguments), delay = args.shift();
   win.setTimeout(function() {
     _do.apply(this, args);
   }, delay);
};

_do.global = function() {
   var args = [].slice.call(arguments);
   globalList = globalList.concat(args);
};

_do.ready = function() {
    var args = [].slice.call(arguments);
    if (isDomReady) {
      return _do.apply(this, args);
    }
    readyList.push(args);
};

_do.css = function(s) {
 var css = doc.getElementById('do-inline-css');
 if (!css) {
   css = doc.createElement('style');
   css.type = 'text/css';
   css.id = 'do-inline-css';
   refFile.parentNode.insertBefore(css, refFile);
 }

 if (css.styleSheet) {
   css.styleSheet.cssText = css.styleSheet.cssText + s;
 } else {
   css.appendChild(doc.createTextNode(s));
 }
};

_do.setPublicData = function(prop, value) {
  publicData[prop] = value;
  if (wait[prop]) {
    wait[prop](value);
    delete wait[prop];
  }
};

_do.getPublicData = function(prop, cb) {
  if (typeof publicData[prop] !== 'undefined') {
    cb(publicData[prop]);
    return;
  } 
  wait[prop] = cb;
};


win.Do = _do;

contentLoaded(function(){
  var i, list;
  isDomReady = true;
  if (readyList.length) {
    for(; list = readyList[i++]; ) {
      _do.apply(this, list);
    }
  }
});

})(window, document);
