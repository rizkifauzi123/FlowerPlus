// src/assets/components/constants/bankInfo.js

export const BANK_INFO = {
  "Mandiri":         { norek: "118 00 1022 970 5",            label: "BANK MANDIRI a.n Dede Syarifah", isCash: false },
  "BRI":             { norek: "1767 0100 0402 566",           label: "BRI a.n Miskam",                 isCash: false },
  "BCA":             { norek: "5311108108",                   label: "BCA a.n Dede Syarifah",          isCash: false },
  "BNI":             { norek: "129 0400 452",                 label: "BNI a.n Dede Syarifah",          isCash: false },
  "BSI":             { norek: "70651 4970",                   label: "BSI a.n Miskam",                 isCash: false },
  "BTN":             { norek: "0024901500088281",             label: "BANK BTN a.n Dede Syarifah",     isCash: false },
  "Bank Maluku Malut": { norek: "1603008581",                 label: "BANK MALUKU MALUT a.n Miskam",   isCash: false },
  "Tunai":           { norek: null,                           label: "PEMBAYARAN TUNAI",               isCash: true  },
};

/**
 * Ambil info bank dari nilai yang tersimpan di DB.
 * Bisa terima key pendek ("Mandiri") atau label lama ("BANK MANDIRI a.n Dede Syarifah")
 */
export const getBankInfo = (bankValue) => {
  if (!bankValue) return { norek: "", label: "", isCash: false };

  // Match langsung ke key pendek
  if (BANK_INFO[bankValue]) return BANK_INFO[bankValue];

  // Fallback: cocokkan berdasarkan label (backward compatible data lama)
  const found = Object.values(BANK_INFO).find(
    (b) => b.label?.toLowerCase() === bankValue.toLowerCase()
  );
  if (found) return found;

  // Custom / Other — tampilkan apa adanya sebagai norek & label
  return { norek: bankValue, label: bankValue, isCash: false };
};