<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Invoice;
use Illuminate\Support\Facades\Storage;

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
            'data'    => $invoice,
        ]);
    }

    /* ============================
       CREATE INVOICE
       - Gambar diterima sebagai URL (bukan base64)
       - paper_size ditentukan backend:
         A5 : 1 item DAN tidak ada gambar
         A4 : selainnya
    ============================ */
    public function store(Request $request)
    {
        $items     = $request->items ?? [];
        $hasImage  = collect($items)->contains(
            fn($item) => !empty($item['image']) && !$this->isBase64($item['image'])
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
    }

    /* ============================
       UPDATE INVOICE
       - Hapus gambar lama dari storage jika diganti
       - paper_size dihitung ulang
    ============================ */
    public function update(Request $request, $id)
    {
        $invoice = Invoice::with('items')->findOrFail($id);

        // Hapus gambar lama dari storage jika ada & bukan base64
        foreach ($invoice->items as $oldItem) {
            if ($oldItem->image && $this->isStorageUrl($oldItem->image)) {
                $oldPath = $this->urlToStoragePath($oldItem->image);
                Storage::disk('public')->delete($oldPath);
            }
        }

        $items     = $request->items ?? [];
        $hasImage  = collect($items)->contains(
            fn($item) => !empty($item['image']) && !$this->isBase64($item['image'])
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
    }

    /* ============================
       DELETE INVOICE
       - Hapus gambar dari storage saat invoice dihapus
    ============================ */
    public function destroy($id)
    {
        $invoice = Invoice::with('items')->findOrFail($id);

        // Hapus gambar dari storage
        foreach ($invoice->items as $item) {
            if ($item->image && $this->isStorageUrl($item->image)) {
                $path = $this->urlToStoragePath($item->image);
                Storage::disk('public')->delete($path);
            }
        }

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
            'paid'         => $paid,
        ]);
    }

    /* ============================
       PREVIEW INVOICE NUMBER
    ============================ */
    public function previewNumber(Request $request)
    {
        $items     = $request->input('items', []);
        $hasImage  = collect($items)->contains(
            fn($item) => !empty($item['image']) && !$this->isBase64($item['image'])
        );
        $itemCount = count($items);

        if ($itemCount > 0) {
            $paperSize = ($itemCount <= 1 && !$hasImage) ? 'a5' : 'a4';
        } else {
            $paperSize = $request->query('paper_size', 'a4');
        }

        return response()->json([
            'invoiceNumber' => $this->generateInvoiceNumber($paperSize),
        ]);
    }

    /* ============================
       PRIVATE HELPERS
    ============================ */

    /**
     * Generate nomor invoice berdasarkan paper_size
     * A4 : 0001/03/SC/FP/2026
     * A5 : 0001/03/FP/2026
     */
    private function generateInvoiceNumber(string $paperSize = 'a4'): string
    {
        $year   = date('Y');
        $month  = date('m');
        $count  = Invoice::where('paper_size', $paperSize)->count() + 1;
        $number = str_pad($count, 4, '0', STR_PAD_LEFT);

        return $paperSize === 'a4'
            ? "{$number}/{$month}/SC/FP/{$year}"
            : "{$number}/{$month}/FP/{$year}";
    }

    /**
     * Ambil URL gambar dari item.
     * - Jika image adalah URL valid (dari UploadController) → pakai
     * - Jika image adalah base64 → buang (jangan simpan ke DB)
     * - Jika tidak ada → null
     */
    private function resolveImageUrl(array $item): ?string
    {
        $image = $item['image'] ?? null;

        if (!$image)                    return null;
        if ($this->isBase64($image))    return null; // tolak base64
        if (filter_var($image, FILTER_VALIDATE_URL)) return $image; // URL valid

        return null;
    }

    /**
     * Cek apakah string adalah base64 image
     */
    private function isBase64(string $value): bool
    {
        return str_starts_with($value, 'data:image');
    }

    /**
     * Cek apakah URL berasal dari storage lokal kita
     */
    private function isStorageUrl(string $url): bool
    {
        return str_contains($url, '/storage/');
    }

    /**
     * Konversi URL publik ke path relatif storage
     * "http://localhost/storage/invoice-images/abc.jpg"
     * → "invoice-images/abc.jpg"
     */
    private function urlToStoragePath(string $url): string
    {
        $base = url('/storage') . '/';
        return str_replace($base, '', $url);
    }
}