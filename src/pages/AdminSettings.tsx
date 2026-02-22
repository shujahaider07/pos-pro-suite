import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminSidebar from '@/components/pos/AdminSidebar';

interface ChargeSettings {
  taxEnabled: boolean;
  taxPercent: number;
  serviceEnabled: boolean;
  servicePercent: number;
}

const AdminSettings = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';
  const queryClient = useQueryClient();

  const { data: settings } = useQuery<ChargeSettings>({
    queryKey: ['charges'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/charges`);
      if (!res.ok) throw new Error('Failed to load charges');
      return res.json();
    },
  });

  const [local, setLocal] = useState<ChargeSettings | null>(null);

  const current = local ?? settings ?? {
    taxEnabled: true,
    taxPercent: 5,
    serviceEnabled: true,
    servicePercent: 2,
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/charges`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(current),
      });
      if (!res.ok) throw new Error('Failed to update charges');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charges'] });
    },
  });

  const setField = (patch: Partial<ChargeSettings>) => {
    setLocal(prev => ({ ...(prev ?? current), ...patch }));
  };

  return (
    <AdminSidebar>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure tax and service charges applied to orders
          </p>
        </div>

        <div className="max-w-xl bg-card rounded-2xl border p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Tax</p>
                <p className="text-xs text-muted-foreground">
                  Enable or disable tax and set percentage
                </p>
              </div>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={current.taxEnabled}
                  onChange={e => setField({ taxEnabled: e.target.checked })}
                />
                <span>Enable</span>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="w-24 h-10 rounded-md border px-3 text-sm bg-background"
                value={current.taxPercent}
                onChange={e => setField({ taxPercent: Number(e.target.value) })}
                min={0}
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Service charge</p>
                <p className="text-xs text-muted-foreground">
                  Enable or disable service charge and set percentage
                </p>
              </div>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={current.serviceEnabled}
                  onChange={e => setField({ serviceEnabled: e.target.checked })}
                />
                <span>Enable</span>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="w-24 h-10 rounded-md border px-3 text-sm bg-background"
                value={current.servicePercent}
                onChange={e => setField({ servicePercent: Number(e.target.value) })}
                min={0}
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setLocal(null)}
              className="h-10 px-4 rounded-md border text-sm"
            >
              Reset
            </button>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="h-10 px-5 rounded-md bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </AdminSidebar>
  );
};

export default AdminSettings;

