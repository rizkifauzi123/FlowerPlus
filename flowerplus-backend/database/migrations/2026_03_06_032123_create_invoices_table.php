<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
        public function up()
        {
            Schema::create('invoices', function (Blueprint $table) {
                $table->id();
                $table->string('invoiceNumber');
                $table->string('invoiceCode')->nullable();
                $table->string('customer');
                $table->string('kepada')->nullable();
                $table->string('branch')->nullable();
                $table->string('bank');
                $table->integer('amount');
                $table->date('date');
                $table->enum('status', ['paid','unpaid'])->default('unpaid');
                $table->timestamps();
            });
        }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
