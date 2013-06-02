$(document).ready(function(){
	$('.waiting-arrow').on('click', function(){
		var $item =  $(this).closest('.waiting-item');
		if($item.hasClass('moved')) {
			$item.removeClass('moved');
		} else {
			$item.addClass('moved');
		}
	});

	$('#generate-qr').on('click', function(){
		$('.queue-qr').removeClass('hide');
	});
});

function generateQR() {
	$('.queue-qr').removeClass('hide');
}