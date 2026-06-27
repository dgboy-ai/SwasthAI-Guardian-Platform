import { useState, useEffect } from 'react';
import { provenanceCache } from '../../services/api';

export default function useProvenance() {
  const [provenance, setProvenance] = useState(() => ({ ...provenanceCache }));

  useEffect(() => {
    const handler = (e) => setProvenance(e.detail);
    window.addEventListener('provenance-update', handler);
    return () => window.removeEventListener('provenance-update', handler);
  }, []);

  return provenance;
}
