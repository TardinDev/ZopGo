// Résume le résultat d'un lot d'uploads de photos. Chaque upload renvoie
// l'URL publique en cas de succès, ou `null` en cas d'échec (réseau/storage).
// On distingue l'échec TOTAL (aucune photo en ligne → on bloque la
// publication) de l'échec PARTIEL (certaines photos perdues → on prévient
// l'hôte mais on laisse publier celles qui ont réussi).

export interface ImageUploadSummary {
  urls: string[];
  total: number;
  uploaded: number;
  failed: number;
  allFailed: boolean;
  someFailed: boolean;
}

export function summarizeImageUploads(results: (string | null)[]): ImageUploadSummary {
  const urls = results.filter((url): url is string => url !== null);
  const total = results.length;
  const uploaded = urls.length;
  const failed = total - uploaded;
  return {
    urls,
    total,
    uploaded,
    failed,
    allFailed: uploaded === 0,
    someFailed: uploaded > 0 && failed > 0,
  };
}
