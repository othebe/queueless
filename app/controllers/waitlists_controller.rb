class WaitlistsController < ApplicationController
	#Title:			queue_up_qr
	#Description:	Adds an entry to the queue via QR
	def queue_up_qr
		#Check QR ID
		render :json=>{:success=>false, :msg=>'QR data not recognized.'} and return if (!params.has_key?(:qid))
		#Check place ID
		render :json=>{:success=>false, :msg=>'Place not found.'} and return if (!params.has_key?(:place_id))
		
		#Retrieve QR data
		qr_data = QrCode.find_by_id(params[:qid])
		render :json=>{:success=>false, :msg=>'QR data not found.'} and return if (qr_data.nil?)
		
		#Add to queue
		w = Waitlist.add(qr_data.user_id, qr_data.party_size, params[:place_id])
		estimated_waiting_time = Waitlist.get_average_wait_time(params[:place_id]) * Waitlist.get_current_queue_size(params[:place_id])
		estimated_seating_time = (Time.now+estimated_waiting_time)
		
		render :json=>{:success=>true, :data=>{
			:user_id => w.user.id,
			:name => (w.user.firstname+' '+w.user.lastname).strip,
			:party_size => w.party_size,
			:check_in_started => w.created_at.hour.to_s + ':' + w.created_at.min.to_s,
			:estimated_seating_time => estimated_seating_time.hour.to_s + ':' + estimated_seating_time.min.to_s
		}}
	end
	
	#Title:			seat
	#Description:	Seat a user
	def seat
		#Check user
		render :json=>{:success=>false, :msg=>'User not specified.'} and return if (!params.has_key?(:user_id))
		#Check place ID
		render :json=>{:success=>false, :msg=>'Place not found.'} and return if (!params.has_key?(:place_id))
		
		Waitlist.seat(params[:user_id], params[:place_id])
	
		render :json=>{:success=>true, :msg=>'success'}
	end
	
	#Title:			cancel
	#Description:	Cancel a user
	def cancel
		#Check user
		render :json=>{:success=>false, :msg=>'User not specified.'} and return if (!params.has_key?(:user_id))
		#Check place ID
		render :json=>{:success=>false, :msg=>'Place not found.'} and return if (!params.has_key?(:place_id))
		
		Waitlist.cancel(params[:user_id], params[:place_id])

		render :json=>{:success=>true, :msg=>'success'}
	end
	
	#Title:			get_list
	#Description:	Get waiting list for a place
	def get_list
		#Check place ID
		render :json=>{:success=>false, :msg=>'Place not found.'} and return if (!params.has_key?(:place_id))
		
		#Check validity of place
		place = Place.find_by_id(params[:place_id])
		render :json=>{:success=>false, :msg=>'Invalid place.'} and return if (place.nil?)
		
		data = []
		waitlist = Waitlist.get_current_list(place.id)
		waitlist.each do |w|
			logger.info w.inspect
			next if (w.status!=1)
			estimated_waiting_time = Waitlist.get_average_wait_time(place.id) * Waitlist.get_current_queue_size(place.id)
			estimated_seating_time = (Time.now+estimated_waiting_time)
			data.push({
				:user_id => w.user.id,
				:name => (w.user.firstname+' '+w.user.lastname).strip,
				:mobile => w.user.mobile_num,
				:party_size => w.party_size,
				:check_in_started => w.created_at.hour.to_s + ':' + w.created_at.min.to_s,
				:estimated_seating_time => estimated_seating_time.hour.to_s + ':' + estimated_seating_time.min.to_s
			})
		end
		
		render :json=>{:success=>true, :data=>data}
	end
	
	#Title:			get_booking_data
	#Description:	Determines if a user is on a waitlist
	def get_booking_data
		#Check User ID
		render :json=>{:success=>false, :msg=>'User ID not found.'} and return if (!params.has_key?(:user_id))
		
		booking = Waitlist.get_booking(params[:user_id])
		
		data = {}
		if (!booking.nil?)
			estimated_waiting_time = Waitlist.get_average_wait_time(booking.place_id) * Waitlist.get_current_queue_size(booking.place_id)
			estimated_seating_time = (Time.now+estimated_waiting_time)
			
			data[:position] = Waitlist.get_queue_position(booking.user_id, booking.place_id)
			data[:place_id] = booking.place_id
			data[:check_in_started] = booking.created_at.hour.to_s + ':' + booking.created_at.min.to_s
			data[:estimated_seating_time] = estimated_seating_time.hour.to_s + ':' + estimated_seating_time.min.to_s
			
			#QR code data
			qr_data = {
				:user_id => booking.user_id,
				:party_size => booking.party_size
			}
			qr_code = QrCode.where(qr_data).first || QrCode.create(qr_data)

			data[:qr_code_src] = 'https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl='+request.host_with_port+'/waitlists/queue_up_qr/?qid='+qr_code.id.to_s
		else
			data = nil
		end
		
		render :json=>{:success=>true, :msg=>(!booking.nil?), :data=>data}
	end
end