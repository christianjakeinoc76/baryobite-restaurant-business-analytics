<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->enum('loyalty_tier', ['Bronze', 'Silver', 'Gold', 'VIP'])->default('Bronze');
            $table->date('joined_date');
            $table->timestamps();
        });

        Schema::create('menu_items', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('category', ['Main Course', 'Appetizer', 'Dessert', 'Beverage']);
            $table->decimal('price', 10, 2);
            $table->decimal('cost', 10, 2);
            $table->boolean('available')->default(true);
            $table->text('description')->nullable();
            $table->unsignedInteger('sold_count')->default(0);
            $table->timestamps();
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_code')->unique();
            $table->date('date');
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->string('customer_name');
            $table->enum('order_type', ['Dine-In', 'Takeout', 'Delivery']);
            $table->enum('status', ['Pending', 'Preparing', 'Completed', 'Cancelled'])->default('Pending');
            $table->decimal('total_amount', 10, 2);
            $table->decimal('total_cost', 10, 2);
            $table->timestamps();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('menu_item_id')->constrained('menu_items')->cascadeOnDelete();
            $table->unsignedInteger('quantity');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('unit_cost', 10, 2);
            $table->timestamps();
        });

        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->string('reservation_code')->unique();
            $table->string('customer_name');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->unsignedInteger('party_size');
            $table->date('date');
            $table->string('time');
            $table->string('table_number');
            $table->enum('status', ['Confirmed', 'Seated', 'Completed', 'Cancelled'])->default('Confirmed');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category');
            $table->decimal('quantity', 10, 2);
            $table->string('unit');
            $table->decimal('reorder_level', 10, 2);
            $table->decimal('unit_cost', 10, 2);
            $table->string('supplier');
            $table->date('last_updated');
            $table->timestamps();
        });

        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('category');
            $table->string('description');
            $table->decimal('amount', 10, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('inventory_items');
        Schema::dropIfExists('reservations');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('menu_items');
        Schema::dropIfExists('customers');
    }
};
