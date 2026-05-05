<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Invoice;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB; // ← TAMBAHAN INI

class InvoiceController extends Controller
{
    public function index()
    {
        $invoices = Invoice::with('items')
            ->orderBy('id', 'desc')
            ->get();
        return response()->json($invoices);
    }

    public function show($id)
    {
        $invoice = Invoice::with('items')->findOrFail($id);
        return response()->json([
            'message' => 'Success',
            'data'    => $invoice,
        ]);
    }

    public function store(Request $request)
    {
        return DB::transaction(function () use ($request) {
            $items = $request->input('items', []);

            $hasImage = collect($items)->contains(function($item) {
                $img = $item['image'] ?? null;
                if ($img === null || $img === '') return false;
                if (str_starts_with($img, 'data:image')) return false;
                return filter_var($img, FILTER_VALIDATE_URL) !== false;
            });

            $paperSize = (count($items) <= 1 && !$hasImage) ? 'a5' : 'a4';

            $invoice = Invoice::create([
                'invoiceNumber' => $this->generateInvoiceNumber($paperSize, $hasImage, $request->date),
                'customer'      => $request->customer,
                'kepada'        => $request->kepada,
                'branch'        => $request->branch,
                'bank'          => $request->bank ?? 'unknown',
                'amount'        => $request->amount,
                'shippingCost'  => $request->shippingCost ?? 0,
                'date'          => $request->date,
                'status'        => $request->status ?? 'unpaid',
                'type'          => $request->type   ?? 'normal',
                'paper_size'    => $paperSize,
            ]);

            foreach ($items as $item) {
                $invoice->items()->create([
                    'desc'  => $item['desc']  ?? '',
                    'qty'   => $item['qty']   ?? 0,
                    'price' => $item['price'] ?? 0,
                    'image' => $this->resolveImageUrl($item),
                ]);
            }

            return response()->json([
                'message' => 'Invoice berhasil dibuat',
                'data'    => $invoice->load('items'),
            ]);
        });
    }

    public function update(Request $request, $id)
{
    return DB::transaction(function () use ($request, $id) {
        $items = $request->input('items', []);

        $hasImage = collect($items)->contains(function($item) {
            $img = $item['image'] ?? null;
            if ($img === null || $img === '') return false;
            if (str_starts_with($img, 'data:image')) return false;
            return filter_var($img, FILTER_VALIDATE_URL) !== false;
        });

        $paperSize = (count($items) <= 1 && !$hasImage) ? 'a5' : 'a4';

        $invoice = Invoice::with('items')->findOrFail($id);

        // ✅ Cek apakah BULAN/TAHUN berubah — satu-satunya alasan generate nomor baru
        $oldDate      = $invoice->date ? new \DateTime($invoice->date) : null;
        $newDate      = $request->date ? new \DateTime($request->date) : null;
        $monthChanged = $oldDate && $newDate && (
            $oldDate->format('Y') !== $newDate->format('Y') ||
            $oldDate->format('m') !== $newDate->format('m')
        );

        // ✅ Hanya generate nomor baru jika bulan/tahun berubah
        // Paper size & SC change TIDAK lagi trigger nomor baru
// Gunakan nomor yang dikirim frontend jika ada, otherwise generate/keep existing
$newInvoiceNumber = $request->has('_keepInvoiceNumber') && $request->_keepInvoiceNumber
    ? $request->_keepInvoiceNumber
    : ($monthChanged
        ? $this->generateInvoiceNumber($paperSize, $hasImage, $request->date)
        : $invoice->invoiceNumber);

        $invoice->update([
            'invoiceNumber' => $newInvoiceNumber,
            'customer'      => $request->customer,
            'kepada'        => $request->kepada,
            'branch'        => $request->branch,
            'bank'          => $request->bank,
            'amount'        => $request->amount,
            'shippingCost'  => $request->shippingCost ?? 0,
            'date'          => $request->date,
            'status'        => $request->status,
            'type'          => $request->type ?? 'normal',
            'paper_size'    => $paperSize,
        ]);

        $invoice->items()->delete();

        foreach ($items as $item) {
            $invoice->items()->create([
                'desc'  => $item['desc']  ?? '',
                'qty'   => $item['qty']   ?? 0,
                'price' => $item['price'] ?? 0,
                'image' => $this->resolveImageUrl($item),
            ]);
        }

        return response()->json([
            'message' => 'Invoice updated',
            'data'    => $invoice->load('items'),
        ]);
    });
}

    public function destroy($id)
    {
        $invoice = Invoice::with('items')->findOrFail($id);
        $invoice->items()->delete();
        $invoice->delete();
        return response()->json(['message' => 'Invoice deleted']);
    }

    public function summary()
    {
        $totalRevenue = Invoice::sum('amount');
        $totalInvoice = Invoice::count();
        $paid         = Invoice::where('status', 'paid')->sum('amount');
        return response()->json([
            'totalRevenue' => $totalRevenue,
            'totalInvoice' => $totalInvoice,
            'paid'         => $paid,
        ]);
    }

    public function previewNumber(Request $request)
    {
        $items     = $request->input('items', []);
        $itemCount = count($items);

        $hasImage = collect($items)->contains(function($item) {
            $img = $item['image'] ?? null;
            if ($img === null || $img === '') return false;
            if (str_starts_with($img, 'data:image')) return false;
            return filter_var($img, FILTER_VALIDATE_URL) !== false;
        });

        if ($itemCount > 0) {
            $paperSize = ($itemCount <= 1 && !$hasImage) ? 'a5' : 'a4';
        } else {
            $paperSize = $request->query('paper_size', 'a4');
            $hasImage  = filter_var($request->query('has_image', false), FILTER_VALIDATE_BOOLEAN);
        }

        return response()->json([
            'invoiceNumber' => $this->generateInvoiceNumber($paperSize, $hasImage, $request->query('date')),
        ]);
    }

private function generateInvoiceNumber(string $paperSize = 'a4', bool $hasImage = false, string $invoiceDate = null): string
{
    $date  = $invoiceDate ? new \DateTime($invoiceDate) : new \DateTime();
    $year  = $date->format('Y');
    $month = $date->format('m');

    // Tentukan pattern berdasarkan format
    if ($paperSize === 'a5') {
        $pattern = "%/{$month}/FP/{$year}";
    } else {
        $pattern = $hasImage
            ? "%/{$month}/SC/FP/{$year}"
            : "%/{$month}/FP/{$year}";
    }

    // Ambil nomor MAX dari format yang sama, bukan COUNT
    $maxNumber = Invoice::where('paper_size', $paperSize)
        ->whereYear('date', $year)
        ->whereMonth('date', $month)
        ->where('invoiceNumber', 'LIKE', $pattern)
        ->when(DB::transactionLevel() > 0, fn($q) => $q->lockForUpdate())
        ->selectRaw('MAX(CAST(SUBSTRING_INDEX(invoiceNumber, "/", 1) AS UNSIGNED)) as max_num')
        ->value('max_num');

    $count  = ($maxNumber ?? 0) + 1;
    $number = str_pad($count, 3, '0', STR_PAD_LEFT);

    if ($paperSize === 'a5') {
        return "{$number}/{$month}/FP/{$year}";
    }

    return $hasImage
        ? "{$number}/{$month}/SC/FP/{$year}"
        : "{$number}/{$month}/FP/{$year}";
}

    private function resolveImageUrl(array $item): ?string
    {
        $image = $item['image'] ?? null;
        if ($image && !str_starts_with($image, 'data:image') && filter_var($image, FILTER_VALIDATE_URL)) {
            return $image;
        }
        return null;
    }
}