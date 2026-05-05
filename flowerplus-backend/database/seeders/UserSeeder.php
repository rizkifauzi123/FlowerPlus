<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('users')->insert([
            [
                'name'       => 'Miskam Ayla',
                'email'      => 'simiskam@gmail.com',
                'password'   => Hash::make('kamismanis'),
                'role'       => 'Owner',
                'avatar'     => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name'       => 'Farhan Nawawi',
                'email'      => 'farhannawawi287@gmail.com',
                'password'   => Hash::make('farhan123'),
                'role'       => 'Admin',
                'avatar'     => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name'       => 'Rizki Ahmad Fauzi',
                'email'      => 'rizkiahmadfauzi1215@gmail.com',
                'password'   => Hash::make('uji123'),
                'role'       => 'Develop',
                'avatar'     => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $this->command->info('✅ 3 user berhasil dibuat!');
    }
}