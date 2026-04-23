import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config();

const url = process.env.TURSO_DATABASE_URL || process.env.TURSO_CONNECTION_URL || 'file:./local.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({
  url,
  ...(authToken ? { authToken } : {}),
});

const db = drizzle(client, { schema });

async function seed() {
  console.log('Seeding database...');

  // 1. Seed Site Content
  console.log('Seeding Site Content...');
  await db.insert(schema.siteContent).values([
    {
      key: 'hero_title',
      value: 'Especialistas en Agua, Gas y Cloacas',
      section: 'home',
    },
    {
      key: 'hero_desc',
      value: 'Soluciones integrales para la conducción de fluidos. La mejor calidad y asesoramiento técnico para tus obras.',
      section: 'home',
    },
  ]).onConflictDoNothing();

  // 2. Seed Categories
  console.log('Seeding Categories...');
  const catAgua = 'cat-agua';
  const catGas = 'cat-gas';
  const catCloacas = 'cat-cloacas';
  const catIncendio = 'cat-incendio';

  await db.insert(schema.categories).values([
    { id: catAgua, name: 'Termofusión Agua', slug: 'termofusion-agua', description: 'Tubos y conexiones para conducción de agua fría y caliente.' },
    { id: catGas, name: 'Termofusión Gas', slug: 'termofusion-gas', description: 'Sistemas seguros para la instalación de gas.' },
    { id: catCloacas, name: 'Desagües y Cloacas', slug: 'desagues-cloacas', description: 'Caños y accesorios para sistemas de evacuación.' },
    { id: catIncendio, name: 'Redes de Incendio', slug: 'redes-incendio', description: 'Materiales homologados para prevención de incendios.' },
  ]).onConflictDoNothing();

  // 3. Seed Products
  console.log('Seeding Products...');
  await db.insert(schema.products).values([
    {
      id: 'prod-1',
      name: 'Tubo IPS Fusión 20mm x 4m',
      slug: 'tubo-ips-fusion-20mm',
      description: 'Caño bicapa para conducción de agua fría y caliente por termofusión. Alta resistencia.',
      price: 250000, // $2,500.00
      stock: 500,
      source: 'cms',
      category_id: catAgua,
      status: 'active',
      images: ['https://placehold.co/600x600/e2e8f0/475569?text=Tubo+IPS+20mm'],
    },
    {
      id: 'prod-2',
      name: 'Codo 90° Fusión Sigas 25mm',
      slug: 'codo-90-fusion-sigas-25mm',
      description: 'Codo de 90 grados para instalaciones de gas natural o envasado. Con alma de acero.',
      price: 85000,
      stock: 120,
      source: 'meli',
      meli_id: 'MLA12345678',
      external_link: 'https://articulo.mercadolibre.com.ar/MLA-12345678-codo-sigas',
      category_id: catGas,
      status: 'active',
      images: ['https://placehold.co/600x600/e2e8f0/475569?text=Codo+Sigas+25mm'],
    },
    {
      id: 'prod-3',
      name: 'Caño Awaduct 110mm x 4m',
      slug: 'cano-awaduct-110mm',
      description: 'Caño de polipropileno sanitario con sello de goma para desagües cloacales y pluviales.',
      price: 480000,
      stock: 200,
      source: 'cms',
      category_id: catCloacas,
      status: 'active',
      images: ['https://placehold.co/600x600/e2e8f0/475569?text=Awaduct+110mm'],
    },
    {
      id: 'prod-4',
      name: 'Llave de Paso Fusión 25mm',
      slug: 'llave-de-paso-fusion-25mm',
      description: 'Llave de paso esférica de termofusión para agua con campana cromada.',
      price: 320000,
      stock: 85,
      source: 'cms',
      category_id: catAgua,
      status: 'active',
      images: ['https://placehold.co/600x600/e2e8f0/475569?text=Llave+Paso+25mm'],
    },
    {
      id: 'prod-5',
      name: 'Tee Reducción Fusión Sigas 32x25mm',
      slug: 'tee-reduccion-sigas-32x25',
      description: 'Derivación T de termofusión para tuberías de gas Sigas.',
      price: 150000,
      stock: 45,
      source: 'meli',
      meli_id: 'MLA87654321',
      category_id: catGas,
      status: 'active',
      images: ['https://placehold.co/600x600/e2e8f0/475569?text=Tee+Sigas+32x25'],
    },
    {
      id: 'prod-6',
      name: 'Boca de Acceso Awaduct 110x63',
      slug: 'boca-de-acceso-awaduct-110x63',
      description: 'Boca de acceso con múltiples entradas para instalación sanitaria.',
      price: 210000,
      stock: 60,
      source: 'cms',
      category_id: catCloacas,
      status: 'active',
      images: ['https://placehold.co/600x600/e2e8f0/475569?text=Boca+Acceso+Awaduct'],
    }
  ]).onConflictDoNothing();

  console.log('Seed completed successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Failed to seed:', err);
  process.exit(1);
});
