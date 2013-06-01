class CreatePlaces < ActiveRecord::Migration
  def change
    create_table :places do |t|
      t.string :gid
	  t.integer :status, {:default=>1}

      t.timestamps
    end
  end
end
