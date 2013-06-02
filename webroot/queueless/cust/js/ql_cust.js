var SITE_URL = 'http://localhost:3000/';
var THRESHOLD = 10;
var obj = null;

$(document).ready(function() {
	google.maps.event.addDomListener(window, 'load', function() {
		obj = new QLCust();
	});
});

//Queue business object
var QLCust = function() {
	this.container = document;		//The HTML container
	this.main = document.getElementById('main');		//Main content
	this.is_authenticated = false;	//Authenticated?
	
	this.user_id = null;			//Authenticated phone number
	this.user_name = null;
	this.mobile = null;
	this.map = null;				//Map object
	this.my_latlng = null;			//My position
	this.search = null;				//Search service
	this.markers = [];				//Current markers
	this.marker_data = {};			//Details about a place marker
	this.booking_data = null;		//Is user on waitlist?
	
	//Allowed search result types
	this.allowed_types = ['bakery', 'bar', 'cafe', 'food', 'meal_delivery', 'meal_takeaway', 'restaurant'];
	
	this.show_login_page();
};

//Initialize w/device location
QLCust.prototype.initialize = function() {
	navigator.geolocation.getCurrentPosition(
		function(position) {
			obj.my_latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
			obj.initialize_map();
		}, 
		function(error) {
			obj.my_latlng = new google.maps.LatLng(1.2931, 103.8558);
			obj.initialize_map();
		}
	);
}

//Log a user in
QLCust.prototype.login = function() {
	var handle = $(this.container).find('#login-handle').val();
	var password = $(this.container).find('#login-password').val();
	
	$.post(SITE_URL+'auth/login', {handle:handle, password:password}, function(response) {
		if (response.success) {
			obj.is_authenticated = true;
			obj.user_id = response.data['user_id'];
			obj.user_name = response.data['name'];
			obj.mobile = response.data['mobile'];
			obj.get_booking_data();
			obj.initialize();
			obj.show_map();
		} 
		else {
			obj.show_incorrect_login(response.msg);
		}
	});
}

//Check booking
QLCust.prototype.get_booking_data = function() {
	$.get(SITE_URL+'waitlists/get_booking_data', {user_id:this.user_id}, function(response) {
		obj.booking_data = response.data;
	});
}

/* ****************************************** */
/* ********** MAPS ************************** */
/* ****************************************** */

//Initialize maps
QLCust.prototype.initialize_map = function() {
	obj.map = new google.maps.Map(document.getElementById("map-canvas"), {
		center: obj.my_latlng,
		zoom: 18,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	});
	obj.initialize_search();
}

//Initialize search functionality
QLCust.prototype.initialize_search = function() {
	obj.service = new google.maps.places.PlacesService(obj.map);
	
	$(obj.container).find('#search').keyup(function(event) {
		if (event.which==13) {
			for (i=0; i<obj.markers.length; i++) {
				obj.markers[i].setMap(null);
			}
			obj.markers = [];
			var request = {
				location: obj.my_latlng,
				query: $(this).val(),
				bounds: obj.map.getBounds(),
				types: obj.allowed_types
			};
			
			obj.service.textSearch(request, obj.handle_search_results);
		}
	});
}

//Handle search results
QLCust.prototype.handle_search_results = function(results, status) {
	var ids = [];
	$(results).each(function(ndx, result) {
		console.log(result);
		obj.marker_data[result['id']] = result;
		ids.push(result['id']);
	});
	
	obj.load_place_information(ids);
}

//Get information about places
QLCust.prototype.load_place_information = function(ids) {
	$.get(SITE_URL+'places/get_information', {ids:ids}, function(response) {
		$(response.data).each(function(ndx, data) {	
			obj.marker_data[data['gid']]['pid'] = data['pid'];
			obj.marker_data[data['gid']]['has_promo'] = data['has_promo'];
			obj.marker_data[data['gid']]['avg_wait_time'] = data['avg_wait_time'];
			obj.marker_data[data['gid']]['current_queue_size'] = data['current_queue_size'];
		});
		
		obj.redraw_markers(true);
	});
}

//Refresh markers on page
QLCust.prototype.redraw_markers = function(is_animate) {
	var marker_options = {map: obj.map};
	if (is_animate) marker_options['animation'] = google.maps.Animation.DROP;
	
	var avg_lat = 0;
	var avg_long = 0;
	
	for (var gid in obj.marker_data) {
		var data = obj.marker_data[gid];
		
		marker_options['position'] = data.geometry.location;
		marker_options['title'] = data.name;
		
		avg_lat = avg_lat + data.geometry.location.jb;
		avg_long = avg_long + data.geometry.location.kb;
		
		if (!data.pid) {
			marker_options['icon'] = {
				url: 'img/marker-grey.png',
				scaledSize: new google.maps.Size(30, 40)
			};
		} else {
			var estimated_wait_time = data.avg_wait_time * data.current_queue_size;
			if (estimated_wait_time > THRESHOLD) {
				if (data.has_promo) {
					marker_options['icon'] = {
						url: 'img/marker-redstar.png',
						scaledSize: new google.maps.Size(30, 40)
					};
				} else {
					marker_options['icon'] = {
						url: 'img/marker-red.png',
						scaledSize: new google.maps.Size(30, 40)
					};
				}
			} else {
				if (data.has_promo) {
					marker_options['icon'] = {
						url: 'img/marker-greenstar.png',
						scaledSize: new google.maps.Size(30, 40)
					};
				} else {
					marker_options['icon'] = {
						url: 'img/marker-green.png',
						scaledSize: new google.maps.Size(30, 40)
					};
				}
			}
		}
		
		obj.markers.push(new google.maps.Marker(marker_options));

		google.maps.event.addListener(obj.markers[0], 'click', function() {
			//Info window
			var popup_source = $('#popup-template').html();
			var popup_template = Handlebars.compile(popup_source);
			var popup_html = popup_template({});
			var infowindow = new google.maps.InfoWindow({
				content: '<img src="img/detail.jpg">',
				maxWidth: 800
			});
			infowindow.open(obj.map, obj.markers[0]);
		});
	}
	
	if (obj.markers.length > 0) {
	/*
		avg_lat = (avg_lat/obj.markers.length);
		avg_long = (avg_long/obj.markers.length);
		
		obj.map.panTo(new google.maps.LatLng(avg_lat, avg_long));
	*/
		var found = false;
		for (k in obj.marker_data) {
			var data = obj.marker_data[gid];
			var la = data.geometry.location.jb;
			var lo = data.geometry.location.kb;
			
			//obj.map.panTo(new google.maps.LatLng(la, lo));
			break;
		}
	}
	
}

//Cancel a waitlisting
QLCust.prototype.cancel = function() {
		$.post(SITE_URL+'waitlists/cancel', {user_id:obj.user_id, place_id:obj.booking_data['place_id']}, function(response) {
		if (response.success) {
			obj.booking_data = null;
			obj.show_queues();
		} else {
			alert(response.msg);
		}
	});
}

/* ****************************************************** */
/* ********************* QR stuff *********************** */
/* ****************************************************** */

//Request a QR code
QLCust.prototype.request_qr = function() {
	var party_size = $(this.main).find('#num_people').val();
	var name = obj.user_name;
	var mobile = obj.mobile;
	$.get(SITE_URL+'users/generate_qr', {name:name, mobile:mobile, party_size:party_size}, function(response) {
		$(obj.main).find('.queue-qr img').attr('src', response.msg);
	});
}

/* *************************************** */
/* ******* VIEW GENERATORS *************** */
/* *************************************** */

//Show login page
QLCust.prototype.show_login_page = function() {
	var login_page_source = $('#login-page-template').html();
	var login_page_template = Handlebars.compile(login_page_source);
	var login_page_html = login_page_template({});
	
	$(this.main).html(login_page_html);
}

//Show map screen
QLCust.prototype.show_map = function() {
	var map_source = $('#map-template').html();
	var map_template = Handlebars.compile(map_source);
	var map_html = map_template({});
	
	$(this.main).html(map_html);
}

//Show queue screen
QLCust.prototype.show_queues = function() {
	if (obj.booking_data != null)
		obj.show_queue_status();
	else obj.show_qr_generator();
}

//Queue status
QLCust.prototype.show_queue_status = function() {
	var queue_status_source = $('#queue-status-template').html();
	var queue_status_template = Handlebars.compile(queue_status_source);
	var queue_status_html = queue_status_template(obj.booking_data);
	$(this.main).html(queue_status_html);
}

//QR generator
QLCust.prototype.show_qr_generator = function() {
	var qr_generator_source = $('#qr-generator-template').html();
	var qr_generator_template = Handlebars.compile(qr_generator_source);
	var queue_status_html = qr_generator_template({});
	$(this.main).html(queue_status_html);
}

//Show comparison screen
QLCust.prototype.show_comparison = function() {
	var comparison_source = $('#comparison-template').html();
	var comparison_template = Handlebars.compile(comparison_source);
	var comparison_html = comparison_template({});
	$(this.main).html(comparison_html);
}