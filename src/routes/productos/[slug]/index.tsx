import { component$, useSignal } from '@builder.io/qwik';
import { type DocumentHead, routeLoader$, Link } from '@builder.io/qwik-city';
import { getDb } from '../../../db/client';
import { products, categories } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { Breadcrumb } from '../../../components/ui/breadcrumb/breadcrumb';
import { AddToCartButton } from '../../../components/cart/add-to-cart-button';
import { buttonVariants } from '../../../components/ui/button/button';
import { LuCheck, LuExternalLink, LuTag } from '@qwikest/icons/lucide';
import { ShareButton } from '../../../components/ui/share-button';

export const useProductDetail = routeLoader$(async (requestEvent) => {
  const { slug } = requestEvent.params;
  try {
    const db = getDb(requestEvent.env);
    const allCategories = await db.select().from(categories);

    const productRows = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        description: products.description,
        price: products.price,
        stock: products.stock,
        images: products.images,
        source: products.source,
        external_link: products.external_link,
        sku: products.sku,
        categoryId: products.category_id,
        is_offer: products.is_offer,
        discount_price: products.discount_price,
        discount_percent: products.discount_percent,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(products)
      .leftJoin(categories, eq(products.category_id, categories.id))
      .where(eq(products.slug, slug))
      .limit(1);

    if (productRows.length === 0) {
      requestEvent.status(404);
      return null;
    }

    const product = productRows[0];
    const productCat = product.categoryId
      ? (allCategories.find((c) => c.id === product.categoryId) ?? null)
      : null;
    const parentCat = productCat?.parent_id
      ? (allCategories.find((c) => c.id === productCat.parent_id) ?? null)
      : null;

    return {
      ...product,
      productCategory: productCat ? { id: productCat.id, name: productCat.name, slug: productCat.slug } : null,
      parentCategory: parentCat ? { id: parentCat.id, name: parentCat.name, slug: parentCat.slug } : null,
    };
  } catch (error) {
    console.error('Error loading product:', error);
    requestEvent.status(500);
    return null;
  }
});

export default component$(() => {
  const data = useProductDetail();
  const activeImg = useSignal(0);

  if (!data.value) {
    return (
      <div class="container mx-auto px-4 py-20 text-center">
        <h1 class="text-3xl font-bold text-slate-900 mb-4">Producto no encontrado</h1>
        <p class="text-slate-500 mb-8">El producto que buscás no existe o fue removido.</p>
        <Link href="/productos" class={buttonVariants({ look: 'primary' })}>
          Volver al catálogo
        </Link>
      </div>
    );
  }

  const product = data.value;
  const images = Array.isArray(product.images) ? product.images as string[] : [];
  const hasPrice = product.price != null && product.price > 0;
  const inStock = product.stock != null && product.stock > 0;

  const cartProduct = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku || null,
    price: product.is_offer && product.discount_price ? product.discount_price : (product.price || null),
    image: images.length > 0 ? images[0] : null,
  };

  return (
    <div class="container mx-auto px-4 md:px-8 py-8 md:py-12">
      {/* Breadcrumb */}
      <Breadcrumb.Root class="mb-6">
        <Breadcrumb.List>
          <Breadcrumb.Item>
            <Breadcrumb.Link href="/">Inicio</Breadcrumb.Link>
          </Breadcrumb.Item>
          <Breadcrumb.Separator />
          <Breadcrumb.Item>
            <Breadcrumb.Link href="/productos">Catálogo</Breadcrumb.Link>
          </Breadcrumb.Item>
          {product.parentCategory && (
            <>
              <Breadcrumb.Separator />
              <Breadcrumb.Item>
                <Breadcrumb.Link href={`/categorias/${product.parentCategory.slug}`}>
                  {product.parentCategory.name}
                </Breadcrumb.Link>
              </Breadcrumb.Item>
            </>
          )}
          {product.productCategory && (
            <>
              <Breadcrumb.Separator />
              <Breadcrumb.Item>
                <Breadcrumb.Link
                  href={
                    product.parentCategory
                      ? `/categorias/${product.parentCategory.slug}/${product.productCategory.slug}`
                      : `/categorias/${product.productCategory.slug}`
                  }
                >
                  {product.productCategory.name}
                </Breadcrumb.Link>
              </Breadcrumb.Item>
            </>
          )}
          <Breadcrumb.Separator />
          <Breadcrumb.Item>
            <Breadcrumb.Page class="text-slate-800 font-medium max-w-[200px] truncate">
              {product.name}
            </Breadcrumb.Page>
          </Breadcrumb.Item>
        </Breadcrumb.List>
      </Breadcrumb.Root>

      {/* Card */}
      <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div class="grid grid-cols-1 md:grid-cols-2">
          {/* Images */}
          <div class="bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-6 flex flex-col gap-4">
            <div class="aspect-square overflow-hidden rounded-xl flex items-center justify-center bg-slate-100">
              {images.length > 0 ? (
                <img
                  src={images[activeImg.value]}
                  alt={product.name}
                  class="max-h-full max-w-full object-contain mix-blend-multiply"
                />
              ) : (
                <span class="text-slate-400 text-sm">Sin imagen</span>
              )}
            </div>
            {images.length > 1 && (
              <div class="flex gap-2 overflow-x-auto">
                {images.map((url, i) => (
                  <button
                    key={i}
                    onClick$={() => (activeImg.value = i)}
                    class={`w-16 h-16 rounded-lg border-2 overflow-hidden flex-shrink-0 transition-all ${activeImg.value === i ? 'border-orange-500' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={url} alt={`Imagen ${i + 1}`} class="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div class="p-8 md:p-12 flex flex-col">
            <div class="mb-3 flex flex-wrap gap-2">
              {product.productCategory && (
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  {product.productCategory.name}
                </span>
              )}
              {product.source === 'meli' && (
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold bg-yellow-400 text-yellow-900">
                  <LuTag class="w-3 h-3" /> MercadoLibre
                </span>
              )}
            </div>

            <h1 class="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
              {product.name}
            </h1>

            <div class="prose prose-slate prose-sm text-slate-600 mb-6 flex-1">
              {product.description ? (
                <p>{product.description}</p>
              ) : (
                <p class="italic text-slate-400">Sin descripción detallada.</p>
              )}
            </div>

            {hasPrice && (
              <div class="mb-6 flex flex-col">
                {product.is_offer && product.discount_price && product.discount_price > 0 ? (
                  <>
                    <div class="flex items-center gap-3 mb-1">
                      <span class="text-lg text-slate-400 line-through">${(product.price || 0).toLocaleString('es-AR')}</span>
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-bold bg-red-100 text-red-600">
                        -{product.discount_percent}% OFF
                      </span>
                    </div>
                    <span class="text-4xl font-bold text-orange-600">
                      ${product.discount_price.toLocaleString('es-AR')}
                    </span>
                  </>
                ) : (
                  <span class="text-4xl font-bold text-slate-900">
                    ${product.price!.toLocaleString('es-AR')}
                  </span>
                )}
              </div>
            )}

            <div class="space-y-4 pt-6 border-t border-slate-100 mt-auto">
              <div class="flex items-center gap-2 text-sm font-medium mb-4">
                {inStock ? (
                  <span class="flex items-center gap-1 text-emerald-600">
                    <LuCheck class="h-5 w-5" /> En stock disponible
                  </span>
                ) : (
                  <span class="text-amber-600">Consultar disponibilidad</span>
                )}
              </div>
              <div class="flex flex-col sm:flex-row gap-3">
                <AddToCartButton product={cartProduct} class="flex-1 !h-12 !text-base" />
                <ShareButton product={{ id: product.id, name: product.name }} />
              </div>
              {product.source === 'meli' && product.external_link && (
                <a
                  href={product.external_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="w-full inline-flex items-center justify-center gap-2 bg-yellow-400 text-yellow-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-500 transition-colors"
                >
                  <LuExternalLink class="w-5 h-5" />
                  Ver en MercadoLibre
                </a>
              )}
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
        content: product?.description || `Detalle del producto en Tecnohidro.`,
      },
    ],
  };
};
