class Waitlist < ActiveRecord::Base
	attr_accessible :end_time, :party_size, :place_id, :status, :user_id
	belongs_to :user
  
	#Title:			add
	#Description:	Add entry to waitlist
	def self.add(user_id, party_size, place_id)
		#Only allow one at a time booking
		existing = self.where({:user_id=>user_id, :status=>WAITLIST_STATUS[:WAITING]}).first
		return existing if (!existing.nil?)
		
		record = self.create({
			:user_id => user_id,
			:place_id => place_id,
			:party_size => party_size
		})
		
		return record
	end
	
	#Title:			seat
	#Description:	Seat a user
	def self.seat(user_id, place_id)
		waiting = self.where({:user_id=>user_id, :place_id=>place_id, :status=>WAITLIST_STATUS[:WAITING]})
		waiting.each do |w|
			w.status = WAITLIST_STATUS[:SEATED]
			w.end_time = Time.now
			w.save
		end
		
		return
	end
	
	#Title:			cancel
	#Description:	Cancel a user
	def self.cancel(user_id, place_id)
		waiting = self.where({:user_id=>user_id, :place_id=>place_id, :status=>WAITLIST_STATUS[:WAITING]})
		waiting.each do |w|
			w.status = WAITLIST_STATUS[:CANCELLED]
			w.end_time = Time.now
			w.save
		end
		
		return
	end
	
	#Title:			get_current_list
	#Description:	Gets the current waitlist
	def self.get_current_list(place_id)
		list = Waitlist.where({:place_id=>place_id, :status=>WAITLIST_STATUS[:WAITING]})
		
		return list
	end
 
	#Title:			get_average_wait_time
	#Description:	Gets average wait time for a place
	def self.get_average_wait_time(place_id)
		total_wait = 0
		waits = Waitlist.where({:place_id=>place_id, :status=>WAITLIST_STATUS[:SEATED]})
		return 0 if waits.empty?
		
		waits.each do |wait|
			next if (wait.end_time.nil?)
			total_wait += (wait.end_time - wait.created_at).to_i
		end
		
		return (total_wait/waits.length)
	end
	
	#Title:			get_current_queue_size
	#Description:	Gets the current queue size
	def self.get_current_queue_size(place_id)
		size = Waitlist.where({:place_id=>place_id, :status=>WAITLIST_STATUS[:WAITING]}).count
		
		return size
	end
end
