class CreateWaitlists < ActiveRecord::Migration
  def change
    create_table :waitlists do |t|
      t.integer :user_id
      t.integer :place_id
      t.integer :party_size
      t.datetime :end_time
      t.integer :status, {:default=>1}

      t.timestamps
    end
  end
end
