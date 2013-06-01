class UsersController < ApplicationController
	#Title:			generate_qr
	#Description:	Generate QR code for a user
	def generate_qr
		logger.info request.host
		#Check name
		render :json=>{:success=>false, :msg=>'Name is required.'} and return if (!params.has_key?(:name))
		
		#Check mobile
		render :json=>{:success=>false, :msg=>'Mobile number is required.'} and return if (!params.has_key?(:mobile))
		
		#Check party size
		render :json=>{:success=>false, :msg=>'Party size is required.'} and return if (!params.has_key?(:party_size))
		render :json=>{:success=>false, :msg=>'Please specify a valid number.'} and return if (params[:party_size].to_i.to_s != params[:party_size])
		
		#Clean up mobile number
		mobile = ''
		mobile_len = params[:mobile].length
		for i in 0..(mobile_len-1)
			mobile += params[:mobile][i] if (params[:mobile][i].to_i.to_s == params[:mobile][i])
		end
		logger.info(mobile)
		#Find user by phone number
		user = User.find_by_mobile_num(mobile)

		#Create this user if not exists
		if (user.nil?)
			firstname = lastname = nil
			separator_ndx = params[:name].rindex(' ')
			if (!separator_ndx.nil?)
				firstname = params[:name][0..(separator_ndx-1)].strip
				lastname = params[:name][(separator_ndx+1)..-1].strip
			else
				firstname = params[:name].strip
			end
		
			#Create this user if not exists
			user = User.create({
				:firstname => firstname,
				:lastname => lastname,
				:mobile_num => mobile,
				:password => 'asdf'
			})
		end
		
		#QR code data
		qr_data = {
			:user_id => user.id,
			:party_size => params[:party_size]
		}
		qr_code = QrCode.where(qr_data).first || QrCode.create(qr_data)

		qr_target = request.host_with_port+'/waitlists/queue_up_qr/?qid='+qr_code.id.to_s
		render :json=>{:success=>true, :msg=>'https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl='+qr_target}
	end
end
