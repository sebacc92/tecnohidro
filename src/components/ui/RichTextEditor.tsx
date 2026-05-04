import { component$, useSignal, useVisibleTask$, useStyles$ } from '@builder.io/qwik';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  name: string;
  label?: string;
}

export const RichTextEditor = component$(({ value, name, label }: RichTextEditorProps) => {
  useStyles$(`
    .ql-container {
      font-size: 14px;
      min-height: 150px;
      border-bottom-left-radius: 0.5rem;
      border-bottom-right-radius: 0.5rem;
    }
    .ql-toolbar {
      border-top-left-radius: 0.5rem;
      border-top-right-radius: 0.5rem;
      background: #f8fafc;
    }
    .ql-editor {
      min-height: 150px;
    }
  `);

  const containerRef = useSignal<Element>();
  const inputRef = useSignal<HTMLInputElement>();

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    if (!containerRef.value) return;

    const quill = new Quill(containerRef.value, {
      theme: 'snow',
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['clean'],
        ],
      },
    });

    if (value) {
      quill.root.innerHTML = value;
    }

    quill.on('text-change', () => {
      if (inputRef.value) {
        inputRef.value.value = quill.root.innerHTML;
      }
    });

    cleanup(() => {
      // Quill doesn't have a formal destroy method, but we can clean up if needed
    });
  });

  return (
    <div class="space-y-1">
      {label && <label class="text-xs font-bold text-slate-500 uppercase">{label}</label>}
      <div class="bg-white rounded-lg border border-slate-300 overflow-hidden focus-within:border-orange-500 transition-colors">
        <div ref={containerRef} />
      </div>
      <input type="hidden" name={name} ref={inputRef} value={value} />
    </div>
  );
});
