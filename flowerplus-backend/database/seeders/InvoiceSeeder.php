<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class InvoiceSeeder extends Seeder
{
    public function run(): void
    {
        $roman = [
            1=>'I', 2=>'II', 3=>'III', 4=>'IV',
            5=>'V', 6=>'VI', 7=>'VII', 8=>'VIII',
            9=>'IX', 10=>'X', 11=>'XI', 12=>'XII'
        ];

        $banks = ['BTN', 'Mandiri', 'BNI', 'BCA', 'BSI'];

        $customers = [
            'Rizki Ahmad Fauzi', 'Siti Nurhaliza', 'Budi Santoso',
            'Dewi Rahayu', 'Ahmad Fauzan', 'Nina Marlina',
            'Hendra Gunawan', 'Rina Wulandari', 'Dicky Pratama',
            'Mega Putri', 'Andika Surya', 'Fitri Handayani',
            'Reza Maulana', 'Lestari Indah', 'Yusuf Hidayat',
            'Nurul Aini', 'Bagas Wicaksono', 'Citra Permata',
            'Fahmi Adriansyah', 'Gita Savitri',
        ];

        $branches = [
            'Jakarta Selatan', 'Jakarta Barat', 'Bandung', 'Surabaya',
            'Bekasi', 'Depok', 'Tangerang', 'Bogor', 'Ceger', 'Yogyakarta',
        ];

        $itemDescriptions = [
            'Bunga Meja', 'Bunga Papan', 'Rangkaian Bunga Pernikahan',
            'Buket Bunga Wisuda', 'Bunga Standing', 'Karangan Bunga Duka',
            'Bunga Hand Bouquet', 'Dekorasi Meja Tamu', 'Bunga Ulang Tahun',
            'Rangkaian Bunga Grand Opening', 'Bunga Artificial', 'Pot Bunga Hias',
            'Bunga Anggrek', 'Bunga Mawar Premium', 'Dekorasi Pernikahan',
        ];

        $statuses = ['paid', 'unpaid', 'unpaid', 'unpaid']; // lebih banyak unpaid agar overdue bisa muncul
        $types    = ['normal', 'normal', 'signed'];

        // Tanggal tersebar dari 14 bulan lalu sampai sekarang
        $startDate = Carbon::now()->subMonths(14);
        $endDate   = Carbon::now();

        for ($i = 1; $i <= 50; $i++) {
            // Random date
            $date = Carbon::createFromTimestamp(
                rand($startDate->timestamp, $endDate->timestamp)
            )->format('Y-m-d');

            $month  = (int) Carbon::parse($date)->format('n');
            $year   = Carbon::parse($date)->format('Y');
            $number = str_pad($i, 4, '0', STR_PAD_LEFT);

            $invoiceNumber = "FP/{$roman[$month]}/{$year}/{$number}";

            $customer = $customers[array_rand($customers)];
            $branch   = $branches[array_rand($branches)];
            $bank     = $banks[array_rand($banks)];
            $status   = $statuses[array_rand($statuses)];
            $type     = $types[array_rand($types)];

            // Random 1–3 items
            $itemCount = rand(1, 3);
            $totalAmount = 0;
            $items = [];

            for ($j = 0; $j < $itemCount; $j++) {
                $desc  = $itemDescriptions[array_rand($itemDescriptions)];
                $qty   = rand(1, 10);
                $price = rand(1, 20) * 100000; // 100rb - 2jt per item
                $items[] = [
                    'desc'  => $desc,
                    'qty'   => $qty,
                    'price' => $price,
                ];
                $totalAmount += $qty * $price;
            }

            // Insert invoice
            $invoiceId = DB::table('invoices')->insertGetId([
                'invoiceNumber' => $invoiceNumber,
                'invoiceCode'   => null,
                'customer'      => $customer,
                'kepada'        => $customer,
                'branch'        => $branch,
                'bank'          => $bank,
                'amount'        => $totalAmount,
                'date'          => $date,
                'status'        => $status,
                'type'          => $type,
                'created_at'    => now(),
                'updated_at'    => now(),
            ]);

            // Insert items
            foreach ($items as $item) {
                DB::table('invoice_items')->insert([
                    'invoice_id' => $invoiceId,
                    'desc'       => $item['desc'],
                    'qty'        => $item['qty'],
                    'price'      => $item['price'],
                    'image'      => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        $this->command->info('✅ 50 invoice berhasil di-seed!');
    }
}