<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InvoiceItem extends Model
{
    protected $fillable = [
        'invoice_id',
        'desc',
        'qty',
        'price',
        'image'
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }
}