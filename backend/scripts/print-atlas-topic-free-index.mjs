#!/usr/bin/env node
/**
 * Imprime la definición del índice vectorial Atlas para topicFree (#126).
 * Uso: node backend/scripts/print-atlas-topic-free-index.mjs
 */
import { getAtlasTopicFreeVectorIndexDefinition } from '../services/topicFreeVectorSearchService.js';

const def = getAtlasTopicFreeVectorIndexDefinition();
console.log(JSON.stringify(def, null, 2));
console.log('\nCrear en Atlas Search → Create Search Index → JSON Editor.');
console.log('Activar en Render: ATLAS_VECTOR_SEARCH_ENABLED=true');
