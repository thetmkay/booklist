(function($) {

	'use strict';
	
	$(document).ready(function() {
		$('.bk-block').click(function() {
			$(this).toggleClass('active');
		});
		
		var fonts = ['Imperator','ImperatorBronzeSmallCaps','Sorts Mill Goudy','Rounded Elegance'];
		var opts = [{},{},{'style':'italic'},{}];

		for(var i = 0; i < fonts.length; i++) {
			var font = fonts[i];
			var observer = new FontFaceObserver(font, opts[i]);
			observer.check().then((function(font) {
				var fontclass = font.toLowerCase().replace(/ /g,'-');
				console.log(fontclass);
				document.body.className += " " + fontclass;
			}).bind(this,font), (function() {
				console.error(font + " not available [font]");
			}).bind(this,font));
		}

	});

})(jQuery);
