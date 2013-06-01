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
			estimated_waiting_time = Waitlist.get_average_wait_time(place.id) * Waitlist.get_current_queue_size(place.id)
			data.push({
				:user_id => w.user.id,
				:name => (w.user.firstname+' '+w.user.lastname).strip,
				:party_size => w.party_size,
				:check_in_started => w.created_at,
				:estimated_seating_time => (Time.now+estimated_waiting_time)
			})
			logger.info w.inspect
		end
		
		render :json=>{:success=>true, :data=>data}
	end
end