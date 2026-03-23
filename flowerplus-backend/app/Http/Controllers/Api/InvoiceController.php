<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Invoice;

class InvoiceController extends Controller
{

    /* ============================
       GET ALL INVOICES
    ============================ */
    public function index()
    {
        $invoices = Invoice::with('items')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json($invoices);
    }

    /* ============================
       GET INVOICE BY ID
    ============================ */
    public function show($id)
    {
        $invoice = Invoice::with('items')->findOrFail($id);

        return response()->json([
            'message' => 'Success',
            'data'    => $invoice
        ]);
    }

    /* ============================
       CREATE INVOICE
       paper_size ditentukan backend:
       - A5 : 1 item DAN tidak ada gambar
       - A4 : selainnya
    ============================ */
    public function store(Request $request)
    {
        $items     = $request->items ?? [];
        $hasImage  = collect($items)->contains(fn($item) =>
            !empty($item['image']) || !empty($item['preview'])
        );
        $paperSize = (count($items) <= 1 && !$hasImage) ? 'a5' : 'a4';

        $invoice = Invoice::create([
            'invoiceNumber' => $this->generateInvoiceNumber($paperSize),
            'customer'      => $request->customer,
            'kepada'        => $request->kepada,
            'branch'        => $request->branch,
            'bank'          => $request->bank ?? 'unknown',
            'amount'        => $request->amount,
            'shippingCost'  => $request->shippingCost ?? 0,
            'date'          => $request->date,
            'status'        => $request->status ?? 'unpaid',
            'type'          => $request->type ?? 'normal',
            'paper_size'    => $paperSize,
        ]);

        if ($request->items) {
            foreach ($request->items as $item) {
                $invoice->items()->create([
                    'desc'  => $item['desc']  ?? '',
                    'qty'   => $item['qty']   ?? 0,
                    'price' => $item['price'] ?? 0,
                    'image' => $item['image'] ?? $item['preview'] ?? null
                ]);
            }
        }

        return response()->json([
            'message' => 'Invoice berhasil dibuat',
            'data'    => $invoice->load('items')
        ]);
    }

    /* ============================
       UPDATE INVOICE
       paper_size dihitung ulang saat edit
    ============================ */
    public function update(Request $request, $id)
    {
        $invoice = Invoice::findOrFail($id);

        $items     = $request->items ?? [];
        $hasImage  = collect($items)->contains(fn($item) =>
            !empty($item['image']) || !empty($item['preview'])
        );
        $paperSize = (count($items) <= 1 && !$hasImage) ? 'a5' : 'a4';

        $invoice->update([
            'customer'     => $request->customer,
            'kepada'       => $request->kepada,
            'branch'       => $request->branch,
            'bank'         => $request->bank,
            'amount'       => $request->amount,
            'shippingCost' => $request->shippingCost ?? 0,
            'date'         => $request->date,
            'status'       => $request->status,
            'type'         => $request->type ?? 'normal',
            'paper_size'   => $paperSize,
        ]);

        $invoice->items()->delete();

        foreach ($request->items as $item) {
            $invoice->items()->create([
                'desc'  => $item['desc'],
                'qty'   => $item['qty'],
                'price' => $item['price'],
                'image' => $item['image'] ?? $item['preview'] ?? null
            ]);
        }

        return response()->json([
            'message' => 'Invoice updated',
            'data'    => $invoice->load('items')
        ]);
    }

    /* ============================
       DELETE INVOICE
    ============================ */
    public function destroy($id)
    {
        $invoice = Invoice::findOrFail($id);
        $invoice->items()->delete();
        $invoice->delete();

        return response()->json(['message' => 'Invoice deleted']);
    }

    /* ============================
       DASHBOARD SUMMARY
    ============================ */
    public function summary()
    {
        $totalRevenue = Invoice::sum('amount');
        $totalInvoice = Invoice::count();
        $paid         = Invoice::where('status', 'paid')->sum('amount');

        return response()->json([
            'totalRevenue' => $totalRevenue,
            'totalInvoice' => $totalInvoice,
            'paid'         => $paid
        ]);
    }

    /* ============================
       PREVIEW INVOICE NUMBER
       Hitung paper_size dari items jika dikirim,
       fallback ke query param ?paper_size=
    ============================ */
    public function previewNumber(Request $request)
    {
        $items     = $request->input('items', []);
        $hasImage  = collect($items)->contains(fn($item) =>
            !empty($item['image']) || !empty($item['preview'])
        );
        $itemCount = count($items);

        if ($itemCount > 0) {
            // Hitung otomatis dari items yang dikirim
            $paperSize = ($itemCount <= 1 && !$hasImage) ? 'a5' : 'a4';
        } else {
            // Fallback ke query param (dipakai saat frontend belum punya items)
            $paperSize = $request->query('paper_size', 'a4');
        }

        return response()->json([
            'invoiceNumber' => $this->generateInvoiceNumber($paperSize)
        ]);
    }

    /* ============================
       GENERATE INVOICE NUMBER
       Counter dihitung per paper_size secara independen
       A4 (kirim) : 0001/03/SC/FP/2026
       A5 (cetak) : 0001/03/FP/2026
    ============================ */
    private function generateInvoiceNumber(string $paperSize = 'a4'): string
    {
        $year  = date('Y');
        $month = date('m');

        $count  = Invoice::where('paper_size', $paperSize)->count() + 1;
        $number = str_pad($count, 4, '0', STR_PAD_LEFT);

        if ($paperSize === 'a4') {
            return $number . '/' . $month . '/SC/FP/' . $year;
        } else {
            return $number . '/' . $month . '/FP/' . $year;
        }
    }
}