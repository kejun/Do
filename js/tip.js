(function(){
	
	$.fn.simpleTip = function () {
		var msg = this.attr('title'), tip;
		this.attr('title', '');
		
		tip = $('<div style="position:absolute;background:#fff;border:1px solid #ccc;padding:1em;visibility:hidden;opacity:0">' + msg + '</div>').appendTo(document.body);
		
		this.mouseover(function(e){
			tip.offset({left: e.pageX + 10, top: e.pageY + 10}).css('visibility', 'visible').animate({opacity: 1}, 500);
		}).mouseout(function(e){
			tip.animate({opacity: 0}, 500);
		});
	};
	
})();