class PlacesController < ApplicationController
	#Title:			get_information
	#Description:	Gets place information
	def get_information
		render :json=>{:succes=>false, :msg=>'No place specified.'} and return if (!params.has_key?(:ids))
		gids = params[:ids]
		
		response = []
		params[:ids].each do |gid|
			place = Place.find_by_gid(gid)
			next if (place.nil?)
			average_wait_time = Waitlist.get_average_wait_time(place.id)
			current_queue_size = Waitlist.get_current_queue_size(place.id)
		
		
			response.push({
				:pid => place.id,
				:gid => gid,
				:avg_wait_time => average_wait_time,
				:current_queue_size => current_queue_size,
				:has_promo => (place.id==2)
			})
		end
		
		render :json=>{:success=>false, :data=>response}
	end
end
