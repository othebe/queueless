class CreatePromotions < ActiveRecord::Migration
  def change
    create_table :promotions do |t|
      t.string :place_id
      t.string :name
      t.text :description
	  t.integer :status, {:default=>1}

      t.timestamps
    end
  end
end
