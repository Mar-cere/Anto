/**
 * Cierre global tras Jest para evitar procesos colgados por mongoose.
 */
export default async function globalTeardown() {
  try {
    const mongoose = (await import('mongoose')).default;
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch {
    // no-op
  }
}
