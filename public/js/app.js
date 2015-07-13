(function($) {

	'use strict';
	
	$(document).ready(function() {
		$('.bk-block').click(function() {
			console.log('hi');
			$(this).toggleClass('active');
		});

	});

})(jQuery);
