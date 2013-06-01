class CreateQrCodes < ActiveRecord::Migration
  def change
    create_table :qr_codes do |t|
      t.integer :user_id
      t.integer :party_size

      t.timestamps
    end
  end
end
