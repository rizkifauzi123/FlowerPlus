<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->decimal('shippingCost', 15, 2)->default(0)->after('amount');
            $table->enum('paper_size', ['a5', 'a4'])->default('a4')->after('type');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            if (Schema::hasColumn('invoices', 'shippingCost')) {
                $table->dropColumn('shippingCost');
            }
            if (Schema::hasColumn('invoices', 'paper_size')) {
                $table->dropColumn('paper_size');
            }
        });
    }
};