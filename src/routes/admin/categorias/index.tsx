import { component$, useSignal, useComputed$, useStore, $, type QRL } from '@builder.io/qwik';
import { type DocumentHead, routeLoader$, routeAction$, z, zod$ } from '@builder.io/qwik-city';
import { getDb } from '~/db/client';
import { categories, products } from '~/db/schema';
import { eq, sql } from 'drizzle-orm';
import {
  LuPlus, LuTrash2, LuPencil, LuChevronRight, LuChevronDown,
  LuEye, LuEyeOff, LuSearch, LuX, LuCheck, LuFolder, LuFolderOpen,
  LuLoader2, LuGripVertical,
} from '@qwikest/icons/lucide';

// ─── Helpers ────────────────────────────────────────────────────────────────

function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// ─── Loaders & Actions ──────────────────────────────────────────────────────

export const useCategories = routeLoader$(async ({ env }) => {
  const db = getDb(env);
  return db.select().from(categories);
});

export const useAddCategory = routeAction$(
  async (data, { env }) => {
    try {
      const db = getDb(env);
      const slug = toSlug(data.name);
      const id = 'cat-' + slug + '-' + Math.random().toString(36).substring(2, 6);
      await db.insert(categories).values({
        id,
        name: data.name,
        slug,
        parent_id: data.parentId || null,
        show_in_menu: true,
      });
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: false, error: 'Error al agregar la categoría.' };
    }
  },
  zod$({ name: z.string().min(1), parentId: z.string().optional().or(z.literal('')) })
);

export const useDeleteCategory = routeAction$(
  async (data, { env }) => {
    try {
      const db = getDb(env);
      
      const subcatsCount = await db.select({ count: sql<number>`count(*)` }).from(categories).where(eq(categories.parent_id, data.id));
      if (subcatsCount[0].count > 0) {
        return { success: false, error: `No se puede eliminar: contiene ${subcatsCount[0].count} subcategoría(s).` };
      }

      const prodCount = await db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.category_id, data.id));
      if (prodCount[0].count > 0) {
        return { success: false, error: `No se puede eliminar: tiene ${prodCount[0].count} producto(s) asociado(s).` };
      }

      await db.delete(categories).where(eq(categories.id, data.id));
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: false, error: 'No se puede eliminar debido a un error de base de datos.' };
    }
  },
  zod$({ id: z.string() })
);

export const useToggleMenu = routeAction$(
  async (data, { env }) => {
    try {
      const db = getDb(env);
      await db.update(categories)
        .set({ show_in_menu: data.show === 'true' })
        .where(eq(categories.id, data.id));
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: false };
    }
  },
  zod$({ id: z.string(), show: z.string() })
);

export const useRenameCategory = routeAction$(
  async (data, { env }) => {
    try {
      const db = getDb(env);
      const slug = toSlug(data.name);
      await db.update(categories)
        .set({ name: data.name, slug })
        .where(eq(categories.id, data.id));
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: false, error: 'Error al renombrar.' };
    }
  },
  zod$({ id: z.string(), name: z.string().min(1) })
);

export const useReorderSiblings = routeAction$(
  async (data, { env }) => {
    try {
      const db = getDb(env);
      const ids = data.siblings.split(',').filter(Boolean);
      await Promise.all(
        ids.map((id, idx) =>
          db.update(categories).set({ sort_order: idx }).where(eq(categories.id, id))
        )
      );
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: false };
    }
  },
  zod$({ siblings: z.string() })
);

// ─── Inline Input Component ──────────────────────────────────────────────────

export const InlineInput = component$<{
  parentId?: string;
  addAction: any;
  onCancel$: QRL<() => void>;
  level: number;
}>(({ parentId, addAction, onCancel$, level }) => {
  const name = useSignal('');
  const slugPreview = useComputed$(() => toSlug(name.value));
  const isSubmitting = useSignal(false);

  const doSubmit = $(async () => {
    if (!name.value.trim() || isSubmitting.value) return;
    isSubmitting.value = true;
    await addAction.submit({ name: name.value.trim(), parentId: parentId ?? '' });
    await onCancel$();
  });

  const levelPl = level * 2 + 1;

  return (
    <div
      class="flex flex-col gap-1 py-2 pr-4 bg-cyan-50/60 border-l-2 border-cyan-400 animate-fade-in"
      style={{ paddingLeft: `${levelPl + 1.5}rem` }}
    >
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
        <input
          autoFocus
          type="text"
          placeholder="Nombre de la categoría..."
          class="flex-1 bg-white border border-cyan-300 rounded-md px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 shadow-sm"
          value={name.value}
          onInput$={(e) => (name.value = (e.target as HTMLInputElement).value)}
          onKeyDown$={async (e) => {
            if (e.key === 'Enter') await doSubmit();
            if (e.key === 'Escape') await onCancel$();
          }}
        />
        <button
          class="p-1.5 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors disabled:opacity-40 flex items-center justify-center"
          disabled={!name.value.trim() || isSubmitting.value}
          onClick$={doSubmit}
        >
          {isSubmitting.value
            ? <LuLoader2 class="w-4 h-4 animate-spin" />
            : <LuCheck class="w-4 h-4" />}
        </button>
        <button
          class="p-1.5 text-slate-400 rounded-md hover:text-slate-700 hover:bg-slate-100 transition-colors"
          onClick$={async () => await onCancel$()}
        >
          <LuX class="w-4 h-4" />
        </button>
      </div>
      {name.value && (
        <p class="text-[11px] text-slate-400 ml-4">
          slug: <span class="text-cyan-600 font-mono font-medium">/{slugPreview.value}</span>
        </p>
      )}
    </div>
  );
});

// ─── Level config ────────────────────────────────────────────────────────────

const LEVEL_CONFIG = [
  {
    borderColor: 'border-cyan-400',
    textClass: 'text-[15px] font-bold text-slate-900',
    badge: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
    folderColor: 'text-cyan-500',
    hoverBg: 'hover:bg-cyan-50/40',
  },
  {
    borderColor: 'border-orange-400',
    textClass: 'text-[13px] font-semibold text-slate-800',
    badge: 'bg-orange-50 text-orange-700 border border-orange-200',
    folderColor: 'text-orange-400',
    hoverBg: 'hover:bg-orange-50/30',
  },
  {
    borderColor: 'border-slate-300',
    textClass: 'text-[12px] font-medium text-slate-700',
    badge: 'bg-slate-100 text-slate-600 border border-slate-200',
    folderColor: 'text-slate-400',
    hoverBg: 'hover:bg-slate-50',
  },
] as const;

// ─── CategoryTreeItem ────────────────────────────────────────────────────────

export const CategoryTreeItem = component$<{
  cat: any;
  allCats: any[];
  addAction: any;
  deleteAction: any;
  toggleMenuAction: any;
  renameAction: any;
  reorderAction: any;
  level?: number;
  forceExpand?: boolean;
}>(({ cat, allCats, addAction, deleteAction, toggleMenuAction, renameAction, reorderAction, level = 0, forceExpand = false }) => {
  const isExpanded = useSignal(level === 0);
  const isAddingChild = useSignal(false);
  const isEditing = useSignal(false);
  const editName = useSignal(cat.name);
  const editSlug = useComputed$(() => toSlug(editName.value));
  const menuPending = useSignal(false);
  // drag state for this node's children group
  const drag = useStore({ fromId: '', overId: '' });

  const children = allCats
    .filter((c) => c.parent_id === cat.id)
    .sort((a, b) => ((a.sort_order ?? 0) - (b.sort_order ?? 0)) || a.name.localeCompare(b.name));
  const hasChildren = children.length > 0 || isAddingChild.value;

  const cfg = LEVEL_CONFIG[Math.min(level, 2)];
  const levelPl = level * 2 + 1;

  const expanded = forceExpand || isExpanded.value;

  return (
    <div class="flex flex-col">
      {/* Node row */}
      <div
        class={`group flex items-center justify-between py-2.5 pr-3 border-b border-slate-100 last:border-0 transition-colors ${cfg.hoverBg}`}
        style={{ paddingLeft: `${levelPl}rem` }}
      >
        {/* Left: grip + toggle + icon + name */}
        <div class="flex items-center gap-2 min-w-0 flex-1">
          {/* Drag grip */}
          <span class="opacity-0 group-hover:opacity-40 cursor-grab active:cursor-grabbing text-slate-400 shrink-0">
            <LuGripVertical class="w-3.5 h-3.5" />
          </span>
          {/* Expand toggle */}
          <button
            class={`p-1 rounded hover:bg-white/70 text-slate-400 transition-colors shrink-0 ${!hasChildren ? 'invisible' : ''}`}
            onClick$={() => (isExpanded.value = !isExpanded.value)}
          >
            {expanded
              ? <LuChevronDown class="w-3.5 h-3.5" />
              : <LuChevronRight class="w-3.5 h-3.5" />}
          </button>

          {/* Folder icon */}
          <span class={`shrink-0 ${cfg.folderColor}`}>
            {expanded && hasChildren
              ? <LuFolderOpen class="w-4 h-4" />
              : <LuFolder class="w-4 h-4" />}
          </span>

          {/* Name (editable on double-click) */}
          {isEditing.value ? (
            <div class="flex items-center gap-1.5 flex-1 min-w-0">
              <input
                autoFocus
                class="flex-1 min-w-0 bg-white border border-cyan-300 rounded px-2 py-0.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                value={editName.value}
                onInput$={(e) => (editName.value = (e.target as HTMLInputElement).value)}
                onKeyDown$={(e) => {
                  if (e.key === 'Enter' && editName.value.trim()) {
                    renameAction.submit({ id: cat.id, name: editName.value.trim() });
                    isEditing.value = false;
                  }
                  if (e.key === 'Escape') {
                    editName.value = cat.name;
                    isEditing.value = false;
                  }
                }}
              />
              <span class="text-[10px] text-cyan-500 font-mono shrink-0">/{editSlug.value}</span>
              <button
                class="p-1 bg-cyan-500 text-white rounded hover:bg-cyan-600 shrink-0"
                onClick$={() => {
                  renameAction.submit({ id: cat.id, name: editName.value.trim() });
                  isEditing.value = false;
                }}
              ><LuCheck class="w-3 h-3" /></button>
              <button
                class="p-1 text-slate-400 rounded hover:bg-slate-100 shrink-0"
                onClick$={() => { editName.value = cat.name; isEditing.value = false; }}
              ><LuX class="w-3 h-3" /></button>
            </div>
          ) : (
            <div
              class="flex items-center gap-2 min-w-0 flex-1 cursor-text select-none"
              onDblClick$={() => (isEditing.value = true)}
              title="Doble click para renombrar"
            >
              <span class={`truncate ${cfg.textClass}`}>{cat.name}</span>
              {level === 0 && (
                <span class={`shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${cfg.badge}`}>
                  {cat.show_in_menu ? 'En Menú' : 'Oculto'}
                </span>
              )}
              <span class="text-[11px] text-slate-400 font-mono hidden group-hover:inline truncate">/{cat.slug}</span>
            </div>
          )}
        </div>

        {/* Right: action buttons (visible on hover) */}
        {!isEditing.value && (
          <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
            {/* Add child */}
            <button
              class="p-1.5 rounded-md text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-colors"
              title="Agregar subcategoría"
              onClick$={() => {
                isAddingChild.value = true;
                isExpanded.value = true;
              }}
            >
              <LuPlus class="w-3.5 h-3.5" />
            </button>

            {/* Toggle menu visibility */}
            <button
              class={`p-1.5 rounded-md transition-colors ${
                menuPending.value ? 'text-slate-400' :
                cat.show_in_menu ? 'text-orange-500 hover:bg-orange-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
              title={cat.show_in_menu ? 'Ocultar del menú' : 'Mostrar en menú'}
              disabled={menuPending.value}
              onClick$={async () => {
                menuPending.value = true;
                await toggleMenuAction.submit({ id: cat.id, show: cat.show_in_menu ? 'false' : 'true' });
                menuPending.value = false;
              }}
            >
              {menuPending.value
                ? <LuLoader2 class="w-3.5 h-3.5 animate-spin" />
                : cat.show_in_menu ? <LuEye class="w-3.5 h-3.5" /> : <LuEyeOff class="w-3.5 h-3.5" />}
            </button>

            {/* Edit (navigate) */}
            <a
              href={`/admin/categorias/${cat.id}/`}
              class="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Editar detalles"
            >
              <LuPencil class="w-3.5 h-3.5" />
            </a>

            {/* Delete */}
            <button
              class="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Eliminar"
              onClick$={() => {
                if (window.confirm(`¿Eliminar "${cat.name}"? Esta acción no se puede deshacer.`)) {
                  deleteAction.submit({ id: cat.id });
                }
              }}
            >
              <LuTrash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Children + inline input */}
      {(expanded || isAddingChild.value) && (
        <div class={`flex flex-col border-l-2 ${cfg.borderColor}`}
          style={{ marginLeft: `${levelPl + 0.75}rem` }}
        >
          {children.map((child) => (
            <div
              key={child.id}
              draggable
              preventdefault:dragover
              class={`transition-all ${
                drag.fromId === child.id ? 'opacity-40' : ''
              } ${
                drag.overId === child.id && drag.fromId !== child.id
                  ? 'border-t-2 border-cyan-400'
                  : ''
              }`}
              onDragStart$={() => { drag.fromId = child.id; }}
              onDragOver$={() => { if (drag.fromId !== child.id) drag.overId = child.id; }}
              onDrop$={() => {
                if (!drag.fromId || drag.fromId === child.id) { drag.fromId = ''; drag.overId = ''; return; }
                const ids = children.map((c) => c.id);
                const fromIdx = ids.indexOf(drag.fromId);
                const toIdx = ids.indexOf(child.id);
                const reordered = [...ids];
                reordered.splice(fromIdx, 1);
                reordered.splice(fromIdx < toIdx ? toIdx - 1 : toIdx, 0, drag.fromId);
                reorderAction.submit({ siblings: reordered.join(',') });
                drag.fromId = '';
                drag.overId = '';
              }}
              onDragEnd$={() => { drag.fromId = ''; drag.overId = ''; }}
            >
              <CategoryTreeItem
                cat={child}
                allCats={allCats}
                addAction={addAction}
                deleteAction={deleteAction}
                toggleMenuAction={toggleMenuAction}
                renameAction={renameAction}
                reorderAction={reorderAction}
                level={level + 1}
                forceExpand={forceExpand}
              />
            </div>
          ))}

          {isAddingChild.value && (
            <InlineInput
              parentId={cat.id}
              addAction={addAction}
              onCancel$={() => (isAddingChild.value = false)}
              level={level + 1}
            />
          )}
        </div>
      )}
    </div>
  );
});

// ─── Root Component ──────────────────────────────────────────────────────────

export default component$(() => {
  const cats = useCategories();
  const addAction = useAddCategory();
  const deleteAction = useDeleteCategory();
  const toggleMenuAction = useToggleMenu();
  const renameAction = useRenameCategory();
  const reorderAction = useReorderSiblings();
  // drag state for root-level items
  const rootDrag = useStore({ fromId: '', overId: '' });

  const searchQuery = useSignal('');
  const isAddingRoot = useSignal(false);

  // Filtered roots
  const filteredData = useComputed$(() => {
    const q = searchQuery.value.trim().toLowerCase();
    if (!q) {
      return {
        roots: cats.value.filter((c) => !c.parent_id).sort((a, b) => ((a.sort_order ?? 0) - (b.sort_order ?? 0)) || a.name.localeCompare(b.name)),
        allCats: cats.value,
        hasFilter: false,
      };
    }

    // Find matching IDs (by name or slug)
    const matchingIds = new Set(
      cats.value
        .filter((c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q))
        .map((c) => c.id)
    );

    // Add all ancestors of matching nodes
    const visibleIds = new Set(matchingIds);
    const addAncestors = (id: string) => {
      const cat = cats.value.find((c) => c.id === id);
      if (cat?.parent_id && !visibleIds.has(cat.parent_id)) {
        visibleIds.add(cat.parent_id);
        addAncestors(cat.parent_id);
      }
    };
    matchingIds.forEach(addAncestors);

    const visibleCats = cats.value.filter((c) => visibleIds.has(c.id));
    return {
      roots: visibleCats.filter((c) => !c.parent_id).sort((a, b) => ((a.sort_order ?? 0) - (b.sort_order ?? 0)) || a.name.localeCompare(b.name)),
      allCats: visibleCats,
      hasFilter: true,
    };
  });

  const hasError = addAction.value?.error || deleteAction.value?.error || renameAction.value?.error;

  return (
    <div class="max-w-4xl mx-auto">
      {/* Header */}
      <div class="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div class="flex-1 min-w-0">
          <h1 class="text-2xl font-bold text-slate-900">Categorías</h1>
          <p class="text-sm text-slate-500 mt-0.5">Gestiona el árbol de categorías del catálogo.</p>
        </div>
        <button
          class="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm shrink-0"
          onClick$={() => {
            isAddingRoot.value = true;
          }}
        >
          <LuPlus class="w-4 h-4" />
          Categoría raíz
        </button>
      </div>

      {/* Error banner */}
      {hasError && (
        <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {hasError}
        </div>
      )}

      {/* Main card */}
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Search bar */}
        <div class="flex items-center gap-3 p-4 border-b border-slate-100 bg-slate-50/60">
          <div class="relative flex-1">
            <LuSearch class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar categorías..."
              class="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-800 placeholder-slate-400"
              value={searchQuery.value}
              onInput$={(e) => (searchQuery.value = (e.target as HTMLInputElement).value)}
            />
            {searchQuery.value && (
              <button
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                onClick$={() => (searchQuery.value = '')}
              >
                <LuX class="w-4 h-4" />
              </button>
            )}
          </div>
          <p class="text-xs text-slate-400 shrink-0">
            {cats.value.length} categorías
          </p>
        </div>

        {/* Legend */}
        <div class="flex items-center gap-4 px-4 py-2 border-b border-slate-100 bg-slate-50/30">
          <span class="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span class="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> Nivel 1 (Raíz)
          </span>
          <span class="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span class="w-2 h-2 rounded-full bg-orange-400 inline-block" /> Nivel 2
          </span>
          <span class="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span class="w-2 h-2 rounded-full bg-slate-300 inline-block" /> Nivel 3
          </span>
          <span class="flex items-center gap-1.5 text-[11px] text-slate-400 ml-auto">
            Doble click para renombrar · Hover para acciones
          </span>
        </div>

        {/* Tree */}
        <div class="flex flex-col">
          {/* Inline root input */}
          {isAddingRoot.value && (
            <InlineInput
              parentId=""
              addAction={addAction}
              onCancel$={() => (isAddingRoot.value = false)}
              level={0}
            />
          )}

          {filteredData.value.roots.length === 0 && !isAddingRoot.value ? (
            <div class="py-16 text-center text-slate-400">
              {searchQuery.value
                ? <><p class="font-medium">Sin resultados para "{searchQuery.value}"</p><p class="text-xs mt-1">Intenta con otro término.</p></>
                : <><p class="font-medium">No hay categorías todavía</p><p class="text-xs mt-1">Presiona "Categoría raíz" para crear la primera.</p></>
              }
            </div>
          ) : (
            filteredData.value.roots.map((root) => (
              <div
                key={root.id}
                draggable
                preventdefault:dragover
                class={`transition-all ${
                  rootDrag.fromId === root.id ? 'opacity-40' : ''
                } ${
                  rootDrag.overId === root.id && rootDrag.fromId !== root.id
                    ? 'border-t-2 border-cyan-400'
                    : ''
                }`}
                onDragStart$={() => { rootDrag.fromId = root.id; }}
                onDragOver$={() => { if (rootDrag.fromId !== root.id) rootDrag.overId = root.id; }}
                onDrop$={() => {
                  const roots = filteredData.value.roots;
                  if (!rootDrag.fromId || rootDrag.fromId === root.id) { rootDrag.fromId = ''; rootDrag.overId = ''; return; }
                  const ids = roots.map((r) => r.id);
                  const fromIdx = ids.indexOf(rootDrag.fromId);
                  const toIdx = ids.indexOf(root.id);
                  const reordered = [...ids];
                  reordered.splice(fromIdx, 1);
                  reordered.splice(fromIdx < toIdx ? toIdx - 1 : toIdx, 0, rootDrag.fromId);
                  reorderAction.submit({ siblings: reordered.join(',') });
                  rootDrag.fromId = ''; rootDrag.overId = '';
                }}
                onDragEnd$={() => { rootDrag.fromId = ''; rootDrag.overId = ''; }}
              >
                <CategoryTreeItem
                  cat={root}
                  allCats={filteredData.value.allCats}
                  addAction={addAction}
                  deleteAction={deleteAction}
                  toggleMenuAction={toggleMenuAction}
                  renameAction={renameAction}
                  reorderAction={reorderAction}
                  level={0}
                  forceExpand={filteredData.value.hasFilter}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Tips */}
      <div class="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-slate-400 px-1">
        <span><kbd class="px-1 bg-slate-100 rounded border border-slate-200 font-mono">Enter</kbd> confirmar · <kbd class="px-1 bg-slate-100 rounded border border-slate-200 font-mono">Esc</kbd> cancelar</span>
        <span>El ícono <span class="text-orange-500">👁</span> activa/desactiva la visibilidad en el menú</span>
        <span>Arrastrá el ícono <span class="text-slate-500">⠿</span> para reordenar dentro del mismo nivel</span>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Admin — Categorías',
};
