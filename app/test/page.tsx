
import { Button, Paper } from '@mantine/core';

export default function TestPage() {
  return (
    // Menggunakan class Tailwind (flex, items-center, dll) di komponen Mantine
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <Paper shadow="md" p="xl" withBorder className="text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">
          Mantine + Tailwind Aktif! 🚀
        </h1>
        <Button variant="filled" color="blue">
          Tombol Mantine
        </Button>
      </Paper>
    </div>
  );
}