import { component$ } from '@builder.io/qwik';
import { type DocumentHead, routeLoader$ } from '@builder.io/qwik-city';
import { db } from '../../../db';
import { products, categories } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { ContactButton } from '../../../components/ContactButton';
import { buttonVariants } from '../../../components/ui/button/button';
import { LuCheck, LuExternalLink, LuChevronLeft } from '@qwikest/icons/lucide';
import { Link } from '@builder.io/qwik-city';

export const useProductDetail = routeLoader$(async (requestEvent) => {
  const { slug } = requestEvent.params;

  try {
    const productData = await db.select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      price: products.price,
      images: products.images,
      source: products.source,
      external_link: products.external_link,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(products)
    .leftJoin(categories, eq(products.category_id, categories.id))
    .where(eq(products.slug, slug))
    .limit(1);

    if (productData.length === 0) {
      requestEvent.status(404);
      return null;
    }

    return productData[0];
  } catch (error) {
    console.error('Database query error:', error);
    requestEvent.status(500);
    return null;
  }
});

export default component$(() => {
  const data = useProductDetail();

  if (!data.value) {
    return (
      <div class="container mx-auto px-4 py-20 text-center">
        <h1 class="text-3xl font-bold text-slate-900 mb-4">Producto no encontrado</h1>
        <p class="text-slate-500 mb-8">El producto que buscas no existe o ha sido retirado.</p>
        <Link href="/productos" class={buttonVariants({ look: 'primary' })}>
          Volver al catálogo
        </Link>
      </div>
    );
  }

  const product = data.value;
  const imageUrl = product.images && product.images.length > 0 
    ? product.images[0] 
    : 'https://placehold.co/600x600/e2e8f0/475569?text=Sin+Imagen';

  return (
    <div class="container mx-auto px-4 md:px-8 py-8 md:py-12">
      <Link href={`/productos${product.categorySlug ? `?category=${product.categorySlug}` : ''}`} class="inline-flex items-center text-sm text-slate-500 hover:text-primary-600 mb-6 transition-colors">
        <LuChevronLeft class="mr-1 h-4 w-4" />
        Volver al catálogo
      </Link>

      <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div class="grid grid-cols-1 md:grid-cols-2">
          {/* Image Gallery */}
          <div class="bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-8 flex items-center justify-center">
            <img 
              src={imageUrl} 
              alt={product.name}
              class="max-w-full h-auto object-contain max-h-[500px] mix-blend-multiply"
            />
          </div>

          {/* Product Info */}
          <div class="p-8 md:p-12 flex flex-col">
            <div class="mb-2">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                {product.categoryName || 'General'}
              </span>
              {product.source === 'meli' && (
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 ml-2">
                  MercadoLibre Sync
                </span>
              )}
            </div>

            <h1 class="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
              {product.name}
            </h1>

            <div class="prose prose-slate prose-sm text-slate-600 mb-8 flex-1">
              {product.description ? (
                <p>{product.description}</p>
              ) : (
                <p class="italic text-slate-400">Sin descripción detallada.</p>
              )}
            </div>

            <div class="space-y-4 pt-6 border-t border-slate-100 mt-auto">
              <div class="flex items-center gap-2 text-sm text-emerald-600 font-medium mb-6">
                <LuCheck class="h-5 w-5" />
                <span>Stock disponible para consulta</span>
              </div>

              <div class="flex flex-col sm:flex-row gap-3">
                <ContactButton productName={product.name} look="primary" size="lg" class="flex-1" />
                
                {product.source === 'meli' && product.external_link && (
                  <a 
                    href={product.external_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    class={buttonVariants({ look: 'outline', size: 'lg' }) + " flex-1"}
                  >
                    <LuExternalLink class="mr-2 h-5 w-5" />
                    Ver en MercadoLibre
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const product = resolveValue(useProductDetail);
  return {
    title: product ? `${product.name} - Tecnohidro` : 'Producto no encontrado',
    meta: [
      {
        name: 'description',
        content: product?.description || 'Detalle del producto en Tecnohidro.',
      },
    ],
  };
};
