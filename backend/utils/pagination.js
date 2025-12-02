/**
 * Utilidades de Paginación
 * 
 * Proporciona funciones helper para paginación basada en cursor
 * y paginación tradicional (offset-based)
 * 
 * @author AntoApp Team
 */

/**
 * Paginación basada en cursor (más eficiente para grandes datasets)
 * @param {Object} options - Opciones de paginación
 * @param {Object} options.query - Query de Mongoose
 * @param {Object} options.model - Modelo de Mongoose
 * @param {string} options.cursor - Cursor actual (ID del último documento)
 * @param {number} options.limit - Número de documentos por página
 * @param {Object} options.sort - Objeto de ordenamiento (default: { _id: -1 })
 * @param {Object} options.select - Campos a seleccionar (opcional)
 * @returns {Promise<Object>} Resultado con datos, nextCursor y hasMore
 */
export async function cursorPaginate({
  query = {},
  model,
  cursor = null,
  limit = 20,
  sort = { _id: -1 },
  select = null
}) {
  try {
    // Construir query con cursor
    const paginatedQuery = { ...query };
    
    if (cursor) {
      // Si hay cursor, buscar documentos después del cursor
      const cursorDoc = await model.findById(cursor).lean();
      if (cursorDoc) {
        // Construir condición basada en el ordenamiento
        const sortField = Object.keys(sort)[0];
        const sortOrder = sort[sortField];
        
        if (sortField === '_id') {
          // Ordenamiento por ID es más simple
          paginatedQuery._id = sortOrder === -1 
            ? { $lt: new model.db.base.model('ObjectId')(cursor) }
            : { $gt: new model.db.base.model('ObjectId')(cursor) };
        } else {
          // Ordenamiento por otro campo
          const cursorValue = cursorDoc[sortField];
          paginatedQuery.$or = [
            { [sortField]: sortOrder === -1 ? { $lt: cursorValue } : { $gt: cursorValue } },
            {
              [sortField]: cursorValue,
              _id: sortOrder === -1 
                ? { $lt: new model.db.base.model('ObjectId')(cursor) }
                : { $gt: new model.db.base.model('ObjectId')(cursor) }
            }
          ];
        }
      }
    }

    // Obtener un documento más para saber si hay más páginas
    const limitPlusOne = limit + 1;
    
    let queryBuilder = model.find(paginatedQuery).sort(sort).limit(limitPlusOne);
    
    if (select) {
      queryBuilder = queryBuilder.select(select);
    }
    
    const results = await queryBuilder.lean();
    
    // Verificar si hay más resultados
    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, limit) : results;
    
    // Obtener el cursor del último documento
    const nextCursor = hasMore && data.length > 0 
      ? data[data.length - 1]._id.toString() 
      : null;

    return {
      data,
      nextCursor,
      hasMore,
      count: data.length
    };
  } catch (error) {
    console.error('[Pagination] Error en cursor pagination:', error);
    throw error;
  }
}

/**
 * Paginación tradicional (offset-based)
 * @param {Object} options - Opciones de paginación
 * @param {Object} options.query - Query de Mongoose
 * @param {Object} options.model - Modelo de Mongoose
 * @param {number} options.page - Número de página (1-indexed)
 * @param {number} options.limit - Número de documentos por página
 * @param {Object} options.sort - Objeto de ordenamiento (default: { createdAt: -1 })
 * @param {Object} options.select - Campos a seleccionar (opcional)
 * @returns {Promise<Object>} Resultado con datos, pagination info
 */
export async function offsetPaginate({
  query = {},
  model,
  page = 1,
  limit = 20,
  sort = { createdAt: -1 },
  select = null
}) {
  try {
    const skip = (page - 1) * limit;
    
    let queryBuilder = model.find(query).sort(sort).skip(skip).limit(limit);
    
    if (select) {
      queryBuilder = queryBuilder.select(select);
    }
    
    const [data, total] = await Promise.all([
      queryBuilder.lean(),
      model.countDocuments(query)
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    };
  } catch (error) {
    console.error('[Pagination] Error en offset pagination:', error);
    throw error;
  }
}

/**
 * Determina qué tipo de paginación usar basado en el tamaño del dataset
 * @param {Object} options - Opciones
 * @param {Object} options.query - Query de Mongoose
 * @param {Object} options.model - Modelo de Mongoose
 * @param {string} options.paginationType - 'cursor' o 'offset' (opcional, auto-detecta)
 * @param {number} options.cursorThreshold - Umbral para usar cursor (default: 1000)
 * @returns {string} 'cursor' o 'offset'
 */
export async function determinePaginationType({
  query = {},
  model,
  paginationType = null,
  cursorThreshold = 1000
}) {
  if (paginationType) {
    return paginationType;
  }

  try {
    const count = await model.countDocuments(query);
    return count > cursorThreshold ? 'cursor' : 'offset';
  } catch (error) {
    console.error('[Pagination] Error determinando tipo:', error);
    return 'offset'; // Fallback a offset
  }
}

/**
 * Helper para construir respuesta de paginación unificada
 * @param {Object} options - Opciones
 * @param {Object} options.query - Query de Mongoose
 * @param {Object} options.model - Modelo de Mongoose
 * @param {string} options.type - 'cursor' o 'offset'
 * @param {string} options.cursor - Cursor (para cursor pagination)
 * @param {number} options.page - Página (para offset pagination)
 * @param {number} options.limit - Límite
 * @param {Object} options.sort - Ordenamiento
 * @param {Object} options.select - Campos a seleccionar
 * @returns {Promise<Object>} Resultado unificado
 */
export async function paginate(options) {
  const {
    query = {},
    model,
    type = 'offset',
    cursor = null,
    page = 1,
    limit = 20,
    sort = { createdAt: -1 },
    select = null
  } = options;

  // Auto-detectar tipo si no se especifica
  const paginationType = type === 'auto' 
    ? await determinePaginationType({ query, model })
    : type;

  if (paginationType === 'cursor') {
    const result = await cursorPaginate({
      query,
      model,
      cursor,
      limit,
      sort,
      select
    });

    return {
      data: result.data,
      pagination: {
        type: 'cursor',
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
        count: result.count
      }
    };
  } else {
    const result = await offsetPaginate({
      query,
      model,
      page,
      limit,
      sort,
      select
    });

    return {
      data: result.data,
      pagination: {
        type: 'offset',
        ...result.pagination
      }
    };
  }
}

