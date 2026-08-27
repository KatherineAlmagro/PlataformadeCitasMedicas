export interface HealthDrugItem {
  id: string;
  name: string;
  genericName: string;
  purpose: string;
  warnings?: string;
  manufacturer?: string;
}

export interface HealthApiResponse {
  success: boolean;
  data: HealthDrugItem[];
  source: string;
  error?: string;
}

/**
 * Función para consumir la API REST pública de OpenFDA (Rúbrica 2.7)
 * Utiliza fetch, async/await y manejo de errores con try/catch.
 */
export async function getHealthCatalog(): Promise<HealthApiResponse> {
  try {
    const response = await fetch(
      'https://api.fda.gov/drug/label.json?limit=4&search=openfda.brand_name:*',
      {
        next: { revalidate: 3600 }, // Revalidación ISR cada hora
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error en la API externa: Código HTTP ${response.status} (${response.statusText})`);
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      throw new Error('La API respondió sin datos disponibles en este momento.');
    }

    const items: HealthDrugItem[] = data.results.map((item: any, idx: number) => {
      const brandName = item.openfda?.brand_name?.[0] || 'Guía Farmacológica';
      const genericName = item.openfda?.generic_name?.[0] || 'Compuesto Terapéutico';
      const rawPurpose = item.purpose?.[0] || item.indications_and_usage?.[0] || 'Uso preventivo y tratamiento para la salud general.';
      const warnings = item.warnings?.[0]?.substring(0, 140) || 'Consulte con su especialista de MediSchedule antes de iniciar un tratamiento.';
      const manufacturer = item.openfda?.manufacturer_name?.[0] || 'Laboratorio Clínico Certificado';

      return {
        id: item.id || `drug-${idx}`,
        name: brandName,
        genericName: genericName,
        purpose: rawPurpose.length > 180 ? rawPurpose.substring(0, 180) + '...' : rawPurpose,
        warnings: warnings,
        manufacturer: manufacturer,
      };
    });

    return {
      success: true,
      data: items,
      source: 'OpenFDA REST API (api.fda.gov)',
    };
  } catch (err: any) {
    console.error('Error al consumir la API externa de salud:', err);
    return {
      success: false,
      data: [
        {
          id: 'fallback-1',
          name: 'Hidratación y Prevención Cardiovascular',
          genericName: 'Hábito de Salud Primaria',
          purpose: 'Mantener un consumo adecuado de agua mejora la presión arterial y optimiza el rendimiento cardíaco.',
          manufacturer: 'Guía Médica Preventiva MediSchedule',
        },
        {
          id: 'fallback-2',
          name: 'Chequeo Odontológico Preventivo',
          genericName: 'Salud Oral',
          purpose: 'La limpieza periódica previene caries profundas y complicaciones periodontales a largo plazo.',
          manufacturer: 'Guía Médica Preventiva MediSchedule',
        },
        {
          id: 'fallback-3',
          name: 'Control del Sueño e Higiene Mental',
          genericName: 'Neurofisiología y Bienestar',
          purpose: 'Dormir entre 7 y 8 horas diarias regenera el tejido neuronal y fortalece la respuesta inmunitaria.',
          manufacturer: 'Guía Médica Preventiva MediSchedule',
        },
      ],
      source: 'Datos de Respaldo Local (Fallo controlado de API externa)',
      error: err.message || 'No se pudo conectar con el servidor externo de la API.',
    };
  }
}
