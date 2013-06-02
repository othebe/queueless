var SITE_URL = 'http://localhost:3000/';
var obj = null;

$(document).ready(function() {
	$( document ).bind( "mobileinit", function() {
		// Make your jQuery Mobile framework configuration changes here!
		$.mobile.allowCrossDomainPages = true;
	});

	obj = new QLBiz();
});

//Queue business object
var QLBiz = function() {	
	this.container = document;							//The HTML container
	this.place_id = null;								//The associated place ID
	this.main = document.getElementById('main');		//Main content
	this.is_authenticated = false;						//Authenticated?
	this.waiting_list = [];								//Customers in waiting list
	this.qr_stream = null;								//QR video stream
	
	obj = this;
	
	this.show_login_page();
};

//Log a user in
QLBiz.prototype.login = function() {
	var handle = $(this.container).find('#login-handle').val();
	var password = $(this.container).find('#login-password').val();
	
	$.post(SITE_URL+'auth/login', {handle:handle, password:password}, function(response) {
		if (response.success) {
			obj.is_authenticated = true;
			obj.place_id = response.data['place_id'];
			obj.get_waitlist();
			obj.show_waiting_list();
		} 
		else {
			obj.show_incorrect_login(response.msg);
		}
	});
}

//Get the current wait list
QLBiz.prototype.get_waitlist = function() {
	if (!obj.is_authenticated) return;
	
	$.get(SITE_URL+'waitlists/get_list', {place_id:obj.place_id}, function(response) {
		$(response.data).each(function(ndx, entry) {
			obj.waiting_list.push(entry);
		})
		obj.redraw_waitlist();
	});
}

//Populate the wait list
QLBiz.prototype.redraw_waitlist = function() {
	var waiting_list_entry_source = $('#waiting-list-entry-template').html();
	var waiting_list_entry_template = Handlebars.compile(waiting_list_entry_source);
	
	$('.waiting-list').html('');
	for (i=0; i<this.waiting_list.length; i++) {
		var entry = this.waiting_list[i];
		var waiting_list_entry_html = waiting_list_entry_template(entry);
		$('.waiting-list').append(waiting_list_entry_html);
	}
	
	$('#queue_size').html(this.waiting_list.length);
}

//Add a single entry to the waitlist
QLBiz.prototype.add_waitlist_entry = function(data) {
	var waiting_list_entry_source = $('#waiting-list-entry-template').html();
	var waiting_list_entry_template = Handlebars.compile(waiting_list_entry_source);
	var waiting_list_entry_html = waiting_list_entry_template(data);
	$('.waiting-list').append(waiting_list_entry_html);
}

//Toggle the waitlist context menu
QLBiz.prototype.toggle_wait_context = function(elt) {
	var container = $(elt).parent();
	console.log(container);
	$(container).toggleClass('moved');
}

//Seat a user
QLBiz.prototype.seat = function(uid, elt) {
	$.post(SITE_URL+'waitlists/seat', {user_id:uid, place_id:obj.place_id}, function(response) {
		if (response.success) {
			$(elt).parent().parent().remove();
			var tmp = [];
			for (i=0; i<obj.waiting_list.length; i++) {
				var entry = obj.waiting_list[i];
				if (entry['user_id']==uid) continue;
				tmp.push(entry);
			}
			obj.waiting_list = tmp;
			$('#queue_size').html(obj.waiting_list.length);
			obj.sms_notify();
		} else {
			alert(response.msg);
		}
	});
}

//Cancel a user
QLBiz.prototype.cancel = function(uid, elt) {
		$.post(SITE_URL+'waitlists/cancel', {user_id:uid, place_id:obj.place_id}, function(response) {
		if (response.success) {
			$(elt).parent().parent().remove();
			var tmp = [];
			for (i=0; i<obj.waiting_list.length; i++) {
				var entry = obj.waiting_list[i];
				if (entry['user_id']==uid) continue;
				tmp.push(entry);
			}
			obj.waiting_list = tmp;
			$('#queue_size').html(obj.waiting_list.length);
			obj.sms_notify();
		} else {
			alert(response.msg);
		}
	});
}

//Notify via SMS
QLBiz.prototype.sms_notify = function() {
	var mobile = obj.waiting_list[0].mobile;
	
	mobile = 84813420;
	$.get("https://secure.hoiio.com/open/sms/send?app_id=QErkomifG3vjp4rr&access_token=hqVa2UV3y13Eurlp&dest=+65"+mobile+"&msg=You're up next! - Queueless", {}, function(response) {
		console.log(response);
	});
}


/* ************************************** */
/* ************** QR CODE *************** */
/* ************************************** */

//Initialize canvas for QR
QLBiz.prototype.initialize_qr_canvas = function(ww, hh) {
	gCanvas = obj.container.getElementById("qr-canvas");
	var w = ww;
	var h = hh;
	gCanvas.style.width = w + "px";
	gCanvas.style.height = h + "px";
	gCanvas.width = w;
	gCanvas.height = h;
	gCtx = gCanvas.getContext("2d");
	gCtx.clearRect(0, 0, w, h);
	imageData = gCtx.getImageData( 0,0,320,240);
}

//Read QR code
QLBiz.prototype.read_qr = function() {
	var video = document.querySelector('video');
	var canvas = document.getElementById('qr-canvas');
	
	try {
		var ctx = canvas.getContext('2d');
		ctx.drawImage(video, 0, 0);
		qrcode.decode();
	} catch(e) {
		setTimeout(obj.read_qr, 500);
	}
}

//Handle succesful QR read
QLBiz.prototype.handle_qr_decode = function(data) {
	if (data.indexOf('http')<0) data = 'http://'+data;
	try {
		$.get(data+'&place_id='+obj.place_id, {}, function(response) {
			if (!response.success) {
				alert(response.msg);
			} else {
				obj.waiting_list.push(response.data);
				//obj.add_waitlist_entry(response.data);
				obj.show_waiting_list();
				obj.redraw_waitlist();
			}
		});
		obj.qr_stream.stop();
	} catch(e) {
	}
}



/* *************************************** */
/* ******* VIEW GENERATORS *************** */
/* *************************************** */

//Show login page
QLBiz.prototype.show_login_page = function() {
	var login_page_source = $('#login-page-template').html();
	var login_page_template = Handlebars.compile(login_page_source);
	var login_page_html = login_page_template({});
	
	$(this.main).html(login_page_html);
}

//Show an incorrect password message
QLBiz.prototype.show_incorrect_login = function(msg) {
	if (navigator.notification) {
        navigator.notification.alert(msg, null, 'Login error', 'OK');
    } else {
        alert(msg);
    }
}

//Show waiting list screen
QLBiz.prototype.show_waiting_list = function() {
	if (this.qr_stream != null) this.qr_stream.stop();
	
	var waiting_list_source = $('#waiting-list-template').html();
	var waiting_list_template = Handlebars.compile(waiting_list_source);
	
	var context = {size:this.waiting_list.length};
	var waiting_list_html = waiting_list_template(context);
	$(this.main).html(waiting_list_html);
	
	this.redraw_waitlist();
}

//Show add new user screen via QR
QLBiz.prototype.show_add_customer_qr = function() {
	var add_customer_qr_source = $('#add-customer-qr-template').html();
	var add_customer_qr_template = Handlebars.compile(add_customer_qr_source);
	var add_customer_qr_html = add_customer_qr_template({});
	$(obj.main).html(add_customer_qr_html);

	if (!hasGetUserMedia()) obj.show_add_customer_manual();
	
	obj.initialize_qr_canvas(800, 600);
	navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
	
	navigator.getUserMedia({video: true}, function(stream) {
		obj.qr_stream = stream;
		var video = obj.container.querySelector('video');
		video.src = window.URL.createObjectURL(stream);
	}, function(event) {
		obj.show_add_customer_manual();
	});
	
	qrcode.callback = obj.handle_qr_decode;
	obj.read_qr();
}

QLBiz.prototype.show_add_customer_manual = function() {
	console.log('manual');
}


/* *************** NON OBJECT FUNCTIONS *************** */
function hasGetUserMedia() {
	// Note: Opera is unprefixed.
	return !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
}




/* **************** FUNCTIONAL PROTOTYPES ************* */
