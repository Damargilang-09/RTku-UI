import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z
    .string()
    .min(5, "Nama minimal 5 karakter")
    .max(150, "Nama maksimal 150 karakter"),
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
  houseNumber: z.string().min(1, "Nomor blok rumah wajib diisi").max(50),
  address: z.string().min(1, "Alamat wajib diisi"),
});
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const paymentFormSchema = z.object({
  paymentMethod: z.string().max(100, "Maksimal 100 karakter").optional(),
});
export type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export const expenseFormSchema = z.object({
  expenseCode: z.string().min(1, "Kode pengeluaran wajib diisi").max(100),
  title: z
    .string()
    .min(1, "Judul wajib diisi")
    .max(200, "Judul maksimal 200 karakter"),
  description: z.string().min(1, "Deskripsi wajib diisi"),
  amount: z.coerce.number().positive("Jumlah harus lebih dari 0"),
  expenseDate: z.string().min(1, "Tanggal wajib diisi"),
});
export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export const incomeFormSchema = z.object({
  income_code: z.string().min(1, "Kode pemasukan wajib diisi").max(100),
  title: z.string().min(1, "Judul wajib diisi").max(200),
  description: z.string().min(1, "Deskripsi wajib diisi"),
  amount: z.coerce.number().positive("Jumlah harus lebih dari 0"),
  income_date: z.string().min(1, "Tanggal wajib diisi"),
});
export type IncomeFormValues = z.infer<typeof incomeFormSchema>;

export const rejectReasonSchema = z.object({
  reason: z
    .string()
    .min(1, "Alasan penolakan wajib diisi")
    .max(255, "Maksimal 255 karakter"),
});

export const feeTypeFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Nama jenis iuran wajib diisi")
      .max(150, "Nama maksimal 150 karakter"),
    description: z
      .string()
      .trim()
      .max(500, "Deskripsi maksimal 500 karakter")
      .optional(),
    amount: z.coerce
      .number()
      .positive("Nominal harus lebih dari 0"),
    billingPeriod: z.enum(["monthly", "once"], {
      error: "Periode penagihan wajib dipilih",
    }),
    // Disimpan sebagai string mentah dari input, divalidasi manual di
    // superRefine di bawah supaya nilai kosong ("") saat billingPeriod
    // "once" tidak ikut ter-coerce jadi 0.
    dueDay: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.billingPeriod !== "monthly") return;

    const dueDay = Number(data.dueDay);

    if (
      !data.dueDay ||
      !Number.isInteger(dueDay) ||
      dueDay < 1 ||
      dueDay > 31
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["dueDay"],
        message: "Tanggal jatuh tempo harus diisi dari tanggal 1 sampai 31",
      });
    }
  });
export type FeeTypeFormValues = z.infer<typeof feeTypeFormSchema>;
