/* Do version 2.0
 * creator: kejun (listenpro@gmail.com)
 */

(function(win, doc) {

// 已加载模块, loaded[fileURL]=true
var loaded = {},

// 加载列表
loadList = {},

// 加载中的模块，loadingFiles[url]=true|false
loadingFiles = {},

mappingFile = {},

// 内部配置文件
config = {
    // 是否自动加载核心库
    autoLoad: true,

    // 加载延迟
    timeout: 5000,

    //核心库
    coreLib: ['http://t.douban.com/js/jquery.min.js'],

    /* 模块依赖
     * {
     *  moduleName: {
     *      path: 'URL',
     *      type:'js|css',
     *      requires:['moduleName1', 'fileURL']
     *    }
     * }
     */
    mods: {}
},

jsSelf = (function() { 
  var files = doc.getElementsByTagName('script'); 
  return files[files.length - 1];
})(),

extConfig,

readyList = [],

isDomReady = false,

publicData = {},

wait = {},

// 全局模块
globalList = [],


isArray = function(e) { 
  return e.constructor === Array; 
},


// 加载js/css文件
load = function(url, type, charset, cb) {
    var wait, n, t, img;

    if (!url) {
        return;
    }

    url = mappingFile[url] || url;

    if (loaded[url]) {
        loadingFiles[url] = false;
        if (cb) {
            cb(url);
        }
        return;
    }

    if (loadingFiles[url]) {
        setTimeout(function() {
            load(url, type, charset, cb);
        }, 10);
        return;
    }

    loadingFiles[url] = true;

    wait = win.setTimeout(function() {
      var newUrl;
      // 文件加载超时
      // newURL和URL的映射
      if (config.failback) {
        try {
          newUrl = eval(config.failback)(url); 
          mappingFile[url] = newUrl;
          load(newUrl, type, charset, cb);
        } catch(ex) {}
      }
    }, config.timeout);

    t =  type || url.toLowerCase().substring(url.lastIndexOf('.') + 1);

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
    }

    if (charset) {
      n.charset = charset;
    }

    if (t === 'css') {
      img = new Image();
      img.onerror = function() {
        loaded[url] = 1;
        cb && cb(url);
        win.clearTimeout(wait);
        img.onerror = null;
        img = null;
      }
      img.src = url;
    } else {
      // firefox, safari, chrome, ie9下加载失败触发
      // 如果文件是404, 会比timeout早触发onerror
      n.onerror = function() {
       loaded[url] = 1;
       cb && cb(url);
       // IE9下会触发onerror和onload，导致重复callback
       cb = null;
       n.onerror = null;
       win.clearTimeout(wait);
      };

      // ie6~8通过创建vbscript可以识别是否加载成功。
      // 但这样需先测试性加载再加载影响性能。即使没成功加载而触发cb，顶多报错，没必要杜绝这种报错

      // ie6~9下加载成功或失败，firefox, safari, opera下加载成功触发
      n.onload = n.onreadystatechange = function() {
          var url;
          if (!this.readyState ||
              this.readyState === 'loaded' ||
              this.readyState === 'complete') {
            url = this.getAttribute('src');
            loaded[url] = 1;
            cb && cb(url);
            cb = null;
            n.onload = n.onreadystatechange = null;
            win.clearTimeout(wait);
          }
      };
    }

    setTimeout(function(){
      jsSelf.parentNode.insertBefore(n, jsSelf);
    }, 0);
},

// 加载依赖论文件(顺序)
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
  var done = false, top = true, 
  doc = win.document, 
  root = doc.documentElement,
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
},

fireReadyList = function() {
  var i = 0, list;
  if (readyList.length) {
    for(; list = readyList[i++]; ) {
      d.apply(this, list);
    }
  }
},

d = function() {
  var args = [].slice.call(arguments), 
  mods = config.mods, fn, list, id, len, i = 0, m, mod;

  // 自动加载核心库
  if (config.autoLoad) {
    if (!loadList[config.coreLib.join('')]) {
      loadDeps(config.coreLib, function(){
        d.apply(null, args);
      });
      return;
    }
  }

  if (globalList.length > 0) {
    if (!loadList[globalList.join('')]) {
     loadDeps(globalList, function(){
        d.apply(null, args);
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

d.add = function(sName, oConfig) {
    if (!sName || !oConfig || !oConfig.path) {
        return;
    }
    config.mods[sName] = oConfig;
};

d.delay = function() {
   var args = [].slice.call(arguments), delay = args.shift();
   win.setTimeout(function() {
     d.apply(this, args);
   }, delay);
};

d.global = function() {
   var args = [].slice.call(arguments);
   globalList = globalList.concat(args);
};

d.ready = function() {
    var args = [].slice.call(arguments);
    if (isDomReady) {
      return d.apply(this, args);
    }
    readyList.push(args);
};

d.css = function(s) {
 var css = doc.getElementById('do-inline-css');
 if (!css) {
   css = doc.createElement('style');
   css.type = 'text/css';
   css.id = 'do-inline-css';
   jsSelf.parentNode.insertBefore(css, jsSelf);
 }

 if (css.styleSheet) {
   css.styleSheet.cssText = css.styleSheet.cssText + s;
 } else {
   css.appendChild(doc.createTextNode(s));
 }
};

d.setPublicData = function(prop, value) {
  publicData[prop] = value;
  if (wait[prop]) {
    wait[prop](value);
    delete wait[prop];
  }
};

d.getPublicData = function(prop, cb) {
  if (typeof publicData[prop] !== 'undefined') {
    cb(publicData[prop]);
    return;
  } 
  wait[prop] = cb;
};

d.setConfig = function(n, v) {
  config[n] = v;
  return d;
};

d.getConfig = function(n) {
  return config[n];
};

win.Do = d;

contentLoaded(function() {
  isDomReady = true;
  fireReadyList();
});

// 初始外部配置
extConfig = jsSelf.getAttribute('data-cfg-autoload');
if (extConfig) {
  config.autoLoad = (extConfig.toLowerCase() === 'true') ? true : false;
}

extConfig = jsSelf.getAttribute('data-cfg-corelib');
if (extConfig) {
  config.coreLib = extConfig.split(',');
}

extConfig = jsSelf.getAttribute('data-cfg-timeout');
if (extConfig) {
  config.timeout = extConfig|0;
}

extConfig = jsSelf.getAttribute('data-cfg-failback');
if (extConfig) {
  config.failback = extConfig;
}

})(window, document);
