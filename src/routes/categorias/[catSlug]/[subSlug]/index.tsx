import { component$, useSignal } from '@builder.io/qwik';
import { type DocumentHead, routeLoader$, Link } from '@builder.io/qwik-city';
import { getDb } from '../../../../db/client';
import { products, categories } from '../../../../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { Breadcrumb } from '../../../../components/ui/breadcrumb/breadcrumb';
import { ContactButton } from '../../../../components/ContactButton';
import { LuCheck, LuExternalLink, LuTag, LuLayoutGrid, LuList, LuFilter, LuChevronDown } from '@qwikest/icons/lucide';
import { ProductImageCarousel } from '../../../../components/ProductImageCarousel';
import { ShareButton } from '../../../../components/ui/share-button';

export const useSubCategoryData = routeLoader$(async (requestEvent) => {
  const { catSlug, subSlug } = requestEvent.params;
  const db = getDb(requestEvent.env);
  try {
    const allCategories = await db.select().from(categories);
    const parentCat = allCategories.find((c) => c.slug === catSlug && !c.parent_id);
    const subCat = allCategories.find((c) => c.slug === subSlug && c.parent_id === parentCat?.id);
    if (!parentCat || !subCat) { requestEvent.status(404); return null; }

    const grandChildren = allCategories.filter((c) => c.parent_id === subCat.id);
    const allIds = [subCat.id, ...grandChildren.map((c) => c.id)];

    const prods = await db
      .select({
        id: products.id, name: products.name, slug: products.slug,
        price: products.price, stock: products.stock, images: products.images,
        source: products.source, external_link: products.external_link,
        categoryName: categories.name,
      })
      .from(products)
      .leftJoin(categories, eq(products.category_id, categories.id))
      .where(and(eq(products.status, 'active'), inArray(products.category_id, allIds)));

    return {
      parentCategory: { id: parentCat.id, name: parentCat.name, slug: parentCat.slug },
      subCategory: { id: subCat.id, name: subCat.name, slug: subCat.slug },
      allCategories,
      products: prods,
    };
  } catch (err) { console.error(err); requestEvent.status(500); return null; }
});

export default component$(() => {
  const data = useSubCategoryData();
  const viewMode = useSignal<'grid' | 'list'>('grid');

  if (!data.value) {
    return (
      <div class="container mx-auto px-4 py-20 text-center">
        <h1 class="text-2xl font-bold mb-4">Categoría no encontrada</h1>
        <Link href="/productos" class="text-orange-600 underline">Ver catálogo</Link>
      </div>
    );
  }

  const { parentCategory, subCategory, allCategories, products: prods } = data.value;
  const rootCats = allCategories.filter((c) => !c.parent_id);
  const getSubs = (pid: string) => allCategories.filter((c) => c.parent_id === pid);

  return (
    <div class="container mx-auto px-4 md:px-8 py-12">
      <Breadcrumb.Root class="mb-6">
        <Breadcrumb.List>
          <Breadcrumb.Item><Breadcrumb.Link href="/">Inicio</Breadcrumb.Link></Breadcrumb.Item>
          <Breadcrumb.Separator />
          <Breadcrumb.Item><Breadcrumb.Link href="/productos">Catálogo</Breadcrumb.Link></Breadcrumb.Item>
          <Breadcrumb.Separator />
          <Breadcrumb.Item><Breadcrumb.Link href={`/categorias/${parentCategory.slug}`}>{parentCategory.name}</Breadcrumb.Link></Breadcrumb.Item>
          <Breadcrumb.Separator />
          <Breadcrumb.Item><Breadcrumb.Page class="text-slate-800 font-medium">{subCategory.name}</Breadcrumb.Page></Breadcrumb.Item>
        </Breadcrumb.List>
      </Breadcrumb.Root>

      <div class="mb-8 border-b pb-6">
        <h1 class="text-3xl md:text-4xl font-bold text-slate-900">{subCategory.name}</h1>
        <p class="text-slate-500 mt-1">{prods.length} producto{prods.length !== 1 ? 's' : ''}</p>
      </div>

      <div class="flex flex-col md:flex-row gap-8">
        <aside class="w-full md:w-64 shrink-0">
          <div class="sticky top-24 bg-white p-5 rounded-xl border border-slate-200">
            <div class="flex items-center gap-2 mb-4 text-slate-800 font-semibold border-b pb-3"><LuFilter class="h-5 w-5" /><h2>Categorías</h2></div>
            <ul class="space-y-2">
              <li><Link href="/productos" class="block py-1.5 px-3 rounded-md text-sm text-slate-600 hover:bg-slate-50">Todas las categorías</Link></li>
              {rootCats.map((cat) => {
                const subs = getSubs(cat.id);
                const isExpanded = cat.slug === parentCategory.slug;
                if (subs.length > 0) return (
                  <li key={cat.id} class="mb-1">
                    <details class="group" open={isExpanded}>
                      <summary class={`flex justify-between items-center cursor-pointer py-1.5 px-3 rounded-md text-sm list-none select-none ${cat.slug === parentCategory.slug ? 'text-orange-700 font-semibold' : 'text-slate-700 font-medium hover:bg-slate-50'}`}>
                        <Link href={`/categorias/${cat.slug}`} class="flex-1">{cat.name}</Link>
                        <LuChevronDown class="h-4 w-4 transition-transform group-open:rotate-180 text-slate-400 shrink-0" />
                      </summary>
                      <ul class="pl-4 mt-1 border-l-2 border-slate-100 ml-4 space-y-1 mb-2">
                        {subs.map((sub) => (
                          <li key={sub.id}>
                            <Link href={`/categorias/${cat.slug}/${sub.slug}`} class={`block py-1 px-2 rounded text-xs transition-colors ${sub.slug === subCategory.slug ? 'bg-orange-50 text-orange-700 font-medium' : 'text-slate-500 hover:bg-slate-50'}`}>
                              {sub.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </li>
                );
                return (
                  <li key={cat.id} class="mb-1">
                    <Link href={`/categorias/${cat.slug}`} class="block py-1.5 px-3 rounded-md text-sm text-slate-700 font-medium hover:bg-slate-50">{cat.name}</Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        <div class="flex-1">
          <div class="mb-6 flex justify-between items-center text-sm text-slate-500">
            <span>Mostrando {prods.length} productos</span>
            <div class="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              <button onClick$={() => (viewMode.value = 'grid')} class={`p-1.5 rounded-md transition-colors ${viewMode.value === 'grid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}><LuLayoutGrid class="w-4 h-4" /></button>
              <button onClick$={() => (viewMode.value = 'list')} class={`p-1.5 rounded-md transition-colors ${viewMode.value === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}><LuList class="w-4 h-4" /></button>
            </div>
          </div>

          {prods.length > 0 ? (
            <div class={viewMode.value === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5' : 'flex flex-col gap-3'}>
              {prods.map((product) => {
                const imgs = Array.isArray(product.images) ? product.images as string[] : [];
                const firstImg = imgs[0] ?? 'https://placehold.co/400x400/e2e8f0/475569?text=Sin+Imagen';
                const hasPrice = product.price != null && product.price > 0;
                const inStock = product.stock != null && product.stock > 0;

                if (viewMode.value === 'list') return (
                  <div key={product.id} class="bg-white rounded-xl border border-slate-200 hover:shadow-md transition-all flex flex-row overflow-hidden">
                    <Link href={`/productos/${product.slug}`} class="w-28 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                      <img src={firstImg} alt={product.name} width={112} height={112} class="w-full h-full object-contain p-2" loading="lazy" />
                    </Link>
                    <div class="flex-1 px-4 flex flex-col justify-center min-w-0">
                      <span class="text-[10px] font-semibold text-orange-600 uppercase tracking-wider mb-0.5">{product.categoryName}</span>
                      <Link href={`/productos/${product.slug}`}><h3 class="font-semibold text-slate-800 text-sm line-clamp-2">{product.name}</h3></Link>
                    </div>
                    <div style="width:180px" class="flex flex-col items-end justify-center gap-2 px-4 border-l border-slate-100 shrink-0">
                      {hasPrice ? <span class="text-lg font-bold text-orange-600">${product.price!.toLocaleString('es-AR')}</span> : <span class="text-xs text-slate-400">Consultar precio</span>}
                      {inStock ? <span class="text-[11px] text-emerald-600 font-medium flex items-center gap-1"><LuCheck class="w-3 h-3" />En Stock</span> : <span class="text-[11px] text-amber-600">Consultar stock</span>}
                      <ContactButton productName={product.name} look="primary" size="sm" class="!h-8 !text-xs w-full" />
                    </div>
                  </div>
                );

                return (
                  <div key={product.id} class="bg-white rounded-xl border border-slate-200 hover:shadow-lg transition-all flex flex-col">
                    <div class="aspect-[4/3] overflow-hidden bg-slate-50 relative">
                      {product.source === 'meli' && <div class="absolute top-2.5 right-2.5 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 z-20"><LuTag class="w-3 h-3" />ML</div>}
                      {imgs.length > 1 && <span class="absolute top-2.5 left-2.5 bg-black/60 text-white px-2 py-0.5 rounded text-[10px] z-20">{imgs.length} fotos</span>}
                      <ProductImageCarousel images={imgs} productName={product.name} />
                    </div>
                    <div class="p-4 flex flex-col flex-1">
                      <span class="text-[11px] font-semibold text-orange-600 uppercase tracking-wider mb-1">{product.categoryName}</span>
                      <Link href={`/productos/${product.slug}`} class="hover:text-orange-600 transition-colors"><h3 class="font-semibold text-slate-800 leading-snug mb-2 line-clamp-2 text-[15px]">{product.name}</h3></Link>
                      {hasPrice && <span class="text-xl font-bold text-orange-600 mb-3">${product.price!.toLocaleString('es-AR')}</span>}
                      <div class="mt-auto flex flex-col gap-2">
                        <div class="flex items-center gap-2">
                          <ContactButton productName={product.name} look="primary" size="sm" class="flex-1" />
                          <ShareButton product={{ id: product.id, name: product.name }} />
                        </div>
                        {product.source === 'meli' && product.external_link && (
                          <a href={product.external_link} target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-bold bg-yellow-400 text-yellow-900 hover:bg-yellow-500 h-9 px-4 w-full">
                            <LuExternalLink class="h-4 w-4" />Ver en MercadoLibre
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div class="p-12 text-center text-slate-500 bg-white border border-dashed rounded-lg">No se encontraron productos en esta subcategoría.</div>
          )}
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const d = resolveValue(useSubCategoryData);
  if (!d) return { title: 'Tecnohidro' };
  return {
    title: `${d.subCategory.name} - ${d.parentCategory.name} | Tecnohidro`,
    meta: [{ name: 'description', content: `Productos de ${d.subCategory.name} en Tecnohidro.` }],
  };
};
