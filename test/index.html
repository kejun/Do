<!DOCTYPE HTML>
<html lang="zh-CN">
<head>
	<meta charset="UTF-8">
	<title>Do 2.0 单元测试</title>
<script src="http://code.jquery.com/jquery-latest.js"></script>
<script type="text/javascript" src="http://code.jquery.com/qunit/git/qunit.js"></script>
<link rel="stylesheet" href="http://code.jquery.com/qunit/git/qunit.css" type="text/css" media="screen" />

<script type="text/javascript" src="../do.js" data-cfg-corelib="core.js"></script>

<script type="text/javascript">
$(function() {

    asyncTest('测试核心类库默认被加载', function(){
      Do(function(){
        ok(typeof core_lib_loaded !== 'undefined', '核心类库默认加载成功');
        start();
      });
    });


    asyncTest('测试加载依赖', function(){
      Do('a1.js', 'a2.js', function(){
        ok(typeof a1 !== 'undefined' && typeof a2 !== 'undefined' , 'a1, a2加载成功');
        start();
      });
    });

    asyncTest('测试按模块名加载', function(){
      Do.add('a1', {path: 'a1.js', type: 'js'});
      Do('a1', 'a2.js', function(){
        ok(typeof a1 !== 'undefined' && typeof a2 !== 'undefined' , 'a1, a2加载成功');
        start();
      });
    });

    asyncTest('测试加载项有依赖的情况', function(){
        Do({path: 'a1.js', requires:['a3.js']}, 'a2.js', function(){
        ok(a1 + a2 + a3 === 6, 'a1, a2, a3加载成功');
        start();
      });
    });

    asyncTest('测试全局模块默认被加载', function(){
        Do.global('a4.js');
        Do('a3.js', function(){
          ok(typeof a4 !== 'undefined', '全局模块默认被加载');
          start();
        });
    });

    asyncTest('测试注入CSS', function(){
        Do.css('.test-mod{ background:red; }');
        var testMod = $('<span class="test-mod"></span>').appendTo('body');
        setTimeout(function() {
          ok(/rgb\(255, 0, 0\)|red/.test(testMod.css('background-color')), 'CSS注入成功');
          start();
        }, 100);
    });

    asyncTest('测试延时加载', function(){
        var finish = 0;
        Do.delay(1000, 'a4.js', function(){
          finish = 1;
        });
        setTimeout(function(){
          ok(finish === 1, '延时加载执行');
          start();
        }, 1500);
    });

    asyncTest('测试DOMReady后执行', function(){
        Do.ready('a4.js', function(){
          ok(true, 'DOMReady后执行');
          start();
        });
    });

    asyncTest('测试更换核心类库', function(){
        Do.setConfig('coreLib', ['http://yui.yahooapis.com/combo?3.3.0/build/yui/yui-min.js']);
        Do(function(){
          ok(typeof YUI !== 'undefined', '核心类库更换');
          start();
        });
    });
    
    asyncTest('测试批量添加模块', function(){
        Do.setConfig('mods', {
          a1: { path: 'a1.js' },
          a2: { path: 'a2.js' },
          a3: { path: 'a3.js' },
          a4: { path: 'a4.js' },
          a5: { path: 'a5.js' }
        });
        Do('a1', 'a3', 'a5', function(){
           ok(true, '加载超时回调被触发');
           start();
        });
    });

    asyncTest('测试模块间公共数据通讯', function(){
        Do(function(){
          Do.getData('foo', function(e){
            ok(e === 10, '收到公共数据');
            start();
          });
        });
        Do.delay(1000, function(){
          Do.setData('foo', 10);
        });
    });

    asyncTest('测试加载超时回调', function(){
        Do.setConfig('timeout', 100);
        Do.setConfig('timeoutCallback', function(url) {
           ok(true, '加载超时回调被触发');
           Do.setConfig('timeoutCallback', function(){});
           start();
        });
        Do({path: 'http://1.cuzillion.com/bin/resource.cgi?type=js&sleep=2&n=1&t=1310551047&r=' + Math.random(), type: 'js'});
    });

});
</script>
    
</head>
<body>
  <h1 id="qunit-header">Do 2.0 <sup>pre</sup></h1>

  <h2 id="qunit-banner"></h2>
  <div id="qunit-testrunner-toolbar"></div>

  <h2 id="qunit-userAgent"></h2>
  <ol id="qunit-tests"></ol>

  <div id="qunit-fixture"></div>
</body>
</html>
