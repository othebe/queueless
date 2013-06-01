class User < ActiveRecord::Base
  attr_accessible :account_type, :email, :password, :status, :firstname, :lastname, :mobile_num, :place_id
  
	#Title:			find_user
	#Description:	Finds a user by phone number and password
	#Params:		phone
	#				password
	def self.find_user(phone, password)
		return self.where({:mobile_num=>phone, :password=>password}).first	
	end
	
	#Title:			create_user
	#Description:	Create a user
	def self.create(data)
		user = self.create(data)
		return user
	end
end
