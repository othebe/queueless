class AuthController < ApplicationController
	#Title:			login
	#Description:	Attempts to log a user in
	def login
		#Check handle
		render :json=>{:success=>false, :msg=>'Handle absent.'} and return if (!params.has_key?(:handle))
		
		#Check password
		render :json=>{:success=>false, :msg=>'Password absent.'} and return if (!params.has_key?(:password))
		
		@user = User.find_user(params[:handle], params[:password])
		render :json=>{:success=>false, :msg=>'Incorrect password.'} and return if (@user.nil?)
		
		session['user'] = @user
		data = {}
		data = {
			:place_id => @user.place_id
		} if (@user.account_type == ACCOUNT_TYPE[:BUSINESS])
		
		render :json=>{:success=>true, :msg=>'authorized', :data=>data} and return
	end
end
