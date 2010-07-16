(function(){

var _Doc = document, 

// 已加载模块, _loaded[file_url]=true
_loaded = {},

// 加载中的模块，对付慢文件，_loading_queue[url]=true|false
_loading_queue = {},

_isArray = function (e) { return e.constructor === Array; },

_log = function (e) {
    if (window.console && window.console.log){
        window.console.log(e);
    }
},


// 内部配置文件
_config = {
    //核心库
    core_lib: ['http://t.douban.com/js/jquery.min.js'],
    
    //模块依赖
    //{ moduleName: {path: 'URL', type:'js|css', requires:['moduleName1', 'fileURL']} }
    mods: {}
},

// 插入的参考结点
_file = _Doc.getElementsByTagName('script')[0],

// 加载js/css文件 
_load = function (url, type, charset, cb, context) {
    if (!url) {
        return;
    }

    if (_loaded[url]) {
        _loading_queue[url] = false;
        if (cb) {
            cb(url, context);
        }
        return;
    }
    
    // 加载中的文件有可能是太大，有可能是404
    // 当加载队列中再次出现此模块会再次加载，理论上会出现重复加载
    if (_loading_queue[url]) {
        setTimeout(function(){
            _load(url, type, charset, cb, context);
        }, 1);
        return;
    }

    _loading_queue[url] = true;
    
    var n, t = type || url.toLowerCase().substring(url.lastIndexOf('.') + 1);

    if (t === 'js') {
        n = _Doc.createElement('script');
        n.setAttribute('type', 'text/javascript');
        n.setAttribute('src', url);
        n.setAttribute('async', true);
    } else if (t === 'css') {
        n = _Doc.createElement('link');
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
      _file.parentNode.insertBefore(n, _file);
      if (cb) {
        cb(url, context);
      }
      return;
    }
    
    n.onload = n.onreadystatechange = function () {
        if (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete') {

            _loaded[this.getAttribute('src')] = true;
            
            if (cb) {
                cb(this.getAttribute('src'), context);
            }
             
            n.onload = n.onreadystatechange = null;
        }
    };
    
    _file.parentNode.insertBefore(n, _file);
},

// 计算加载队列。参数e是一个数组
_calculate = function(e) {
    if (!e || !_isArray(e) ) {
        return;
    }
    
    var i = 0, 
    item, 
    result = [], 
    mods = _config.mods,
    depeList = [],
    hasAdded = {},
    getDepeList = function (e) {
        var i = 0, m, reqs;
        
        // break loop require.
        if (hasAdded[e]) {
            return depeList;
        }   
        hasAdded[e] = true;
        
        if (mods[e].requires) {
            reqs = mods[e].requires;
            for (; m = reqs[i++];) {
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
    
    for (; item = e[i++]; ) {
        if (mods[item] && mods[item].requires && mods[item].requires[0]) {
            depeList = [];
            hasAdded = {};
            result = result.concat(getDepeList(item));
        }
        result.push(item);
    }
    
    return result;
},

// 一个异步队列对象 
_queue = function (e) {
    if (!e || !_isArray(e) ) {
        return;
    }
    
    this.queue = e;

    // 队列当前要加载的模块
    this.current = null;
};

_queue.prototype = {

    _interval: 10,
    
    start: function () {
        var o = this;
        this.current = this.next(); 
        
        if (!this.current) {
            this.end = true;
            return;
        }
        
        this.run();
    },
    
    run: function () {
        var o = this, mod, currentMod = this.current;
        
        if (typeof currentMod === 'function') {
            currentMod();
            this.start();
            return;
        } else if (typeof currentMod === 'string') {
            if (_config.mods[currentMod]) {
              mod = _config.mods[currentMod];
              _load(mod.path, mod.type, mod.charset, function (e) {
                 o.start();
              }, o);
            } else if (/\.js|\.css/i.test(currentMod)) {
              // load a file.
              _load(currentMod, '', '', function (e, o) {
                 o.start();
              }, o); 
            } else {
              // no found module. skip to next
              this.start();
           }
        }
    },
    
    next: function () { return this.queue.shift(); }
};


this.Do = function(){
    var args = Array.prototype.slice.call(arguments, 0), 
    thread = new _queue(_calculate(_config.core_lib.concat(args)));
    thread.start();
};

this.Do.add = function(sName, oConfig) {
    if (!sName || !oConfig || !oConfig.path) {
        return;
    }
    _config.mods[sName] = oConfig;
};

Do(_config.core_lib);

})();
