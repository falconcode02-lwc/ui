export type VaultType = 'DB' | 'AZURE' | 'GCP' | 'file';

export interface VaultTypeOption {
  label: string;
  value: VaultType;
}

export const VAULT_TYPE_OPTIONS: VaultTypeOption[] = [
  { label: 'Database', value: 'DB' },
  { label: 'Azure Key Vault', value: 'AZURE' },
  { label: 'GCP Secret Manager', value: 'GCP' },
 { label: 'File', value: 'file' }
];

export function getVaultTypeLabel(vaultType?: unknown): string {
  const vt = typeof vaultType === 'string' ? vaultType : (vaultType as any)?.value;
  const found = VAULT_TYPE_OPTIONS.find((o) => o.value === vt);
  return found?.label || (vt as string) || '';
}
