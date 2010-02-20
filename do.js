/**
 * Do 是一个轻量级javascript开发框架。它的核心库可以自由更换。
 * 设计原则：
 * 1. 不提供任何业务相关功能
 * 2. 公共功能功能都出自核心库，核心库可灵活添加或更换。
 * 3. 内置依赖关系管理系统
 * @author Kejun (listenpro@gmail.com)
 * @version 0.1(draft)
 */

(function(){

var _Doc = document, 
_loaded = {},
_isArray = function (e) { return e.constructor === Array; },

_log = function (e) {
	if (window.console && window.console.log){
		window.console.log(e);
	}
},


//内部配置文件
_config = {
	//核心库，可以任意换
	core_lib: ['http://code.jquery.com/jquery-1.4.1.js'],
	
	//模块依赖
	mods: {}
},

_loading_queue = {},

// load external js or css.
_load = function (url, type, charset, cb) {
	if (!url) {
		return;
	}

	if (_loaded[url]) {
		_loading_queue[url] = false;
		if (cb) {
			cb(url);
		}
		return;
	}
	
	if (_loading_queue[url]) {
		setTimeout(function(){
			_load(url, type, charset, cb);
		}, 10);
		return;
	}
	_loading_queue[url] = true;
	
	var n, t = type || url.toLowerCase().substring(url.lastIndexOf('.') + 1);

	if (t === 'js') {
		n = _Doc.createElement('script');
		n.setAttribute('type', 'text/javascript');
		n.setAttribute('src', url);
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
	
	if (t === 'css') {
	  _Doc.getElementsByTagName('head')[0].appendChild(n);
	  if (cb) {
		cb(url);
	  }
	  return;
    }
	
	n.onload = n.onreadystatechange = function () {
		if (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete') {
			//loaded success.
			_loaded[this.getAttribute('src')] = true;
			
			if (cb) {
				cb(this.getAttribute('src'));
			}
			
			n.onload = n.onreadystatechange = null;
		}
	};
	
	_Doc.getElementsByTagName('head')[0].appendChild(n);
},

_calculate = function(e) {
	if (!e || !_isArray(e) ) {
		return;
	}
	
	var i = 0, item, result = [], 
	mods = _config.mods,
	_depeList = [],
	_hasAdded = {},
	getDepeList = function (e) {

		var i = 0, m, reqs;
		
		// break loop require.
		if (_hasAdded[e]) {
			return _depeList;
		}	
		_hasAdded[e] = true;
		
		if (mods[e].requires) {
			reqs = mods[e].requires;
			for (; m = reqs[i++];) {
			  // is a module.
			  if (mods[m]) {
				getDepeList(m);
				_depeList.push(m);
			   } else {
				// is a file.
				_depeList.push(m);
			   }
			}
			return _depeList;
		}
		return _depeList;
	};
	
	for (; item = e[i++]; ) {
		if (mods[item] && mods[item].requires && mods[item].requires[0]) {
			_depeList = [];
			_hasAdded = {};
			result = result.concat(getDepeList(item));
		}
		result.push(item);
	}
	
	return result;
},

// a asynchronous queue
_queue = function (e) {
	if (!e || !_isArray(e) ) {
		return;
	}
	
	this.queue = e;
	//timeout file collection.
	this._skip = {};
};

_queue.prototype = {
	_Timeout: 6000,
	
	_interval: 10,
	
	start: function () {
		var o = this;
		this.current = this.next();	
		
		if (!this.current) {
			this.end = true;
			return;
		}
		
		
		this._outTimer = setTimeout(function () {
		  _log('[DoubanJS] "' + o.current + '" timeout.');
		  o._skip[o.current] = true; 
		  o.start(); 
		}, this._Timeout);
		
		this.run();
	},
	
	run: function () {
		
		var o = this, mod;
		
		if (typeof this.current === 'function') {
			this.clearTimer();
			this.current();
			this.start();
		} else if (typeof this.current === 'string') {
			if (_config.mods[this.current]) {
			  // todo:load a module.
			  mod = _config.mods[this.current];
			  _load(mod.path, mod.type, mod.charset, function (e) {
			     // if timeout file fire callback don't disturb queue.
				 if (!o._skip[e]) {
				   o.clearTimer();
				   o.start();
				 }
			  });
			} else if (/\.js|\.css/i.test(this.current)) {
			  // load a file.
		      _load(this.current, '', '', function (e) {
			     // if timeout file fire callback don't disturb queue.
				 if (!o._skip[e]) {
				   o.clearTimer();
				   o.start();
				 }
			  }); 
			} else {
			  // no found module. skip to next
			  this.clearTimer();
			  this.start();
		   }
		}
	},
	
	clearTimer: function () {
		clearTimeout(this._outTimer);
	},
	
	next: function () { return this.queue.shift(); }
};


// preload core lib.
_load(_config.core_lib[0], 'js');


this.Do = function(){
	var args = Array.slice.call(null, arguments), 
	thread = new _queue(_calculate(_config.core_lib.concat(args)));
	thread.start();
};

this.Do.add = function(sName, oConfig) {
	if (!sName || !oConfig || !oConfig.path) {
		return;
	}
	
	_config.mods[sName] = oConfig;
};

})();