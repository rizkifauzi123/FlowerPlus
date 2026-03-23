<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoiceNumber',
        'invoiceCode',
        'customer',
        'kepada',
        'branch',
        'bank',
        'amount',
        'shippingCost',   // ← tambah
        'date',
        'status',
        'type',
        'paper_size',     // ← tambah
    ];

    public function items()
    {
        return $this->hasMany(InvoiceItem::class);
    }
}