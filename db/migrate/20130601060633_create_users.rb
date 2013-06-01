class CreateUsers < ActiveRecord::Migration
  def change
    create_table :users do |t|
      t.string :firstname
      t.string :lastname
      t.string :email
	  t.string :password
      t.integer :mobile_num
      t.integer :account_type
      t.string :place_id
	  t.integer :status, {:default=>1}

      t.timestamps
    end
  end
end
