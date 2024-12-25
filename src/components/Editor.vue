<template>
  <div class="quill-editor-wrapper">
    <div ref="editorRef"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import Quill from 'quill';
import 'quill/dist/quill.core.css';
import 'quill/dist/quill.snow.css';
import 'quill/dist/quill.bubble.css';
import axios from 'axios';
import ImageResize from 'quill-image-resize-vue';

// Register the image resize module
Quill.register('modules/imageResize', ImageResize);

// Define component props
const props = defineProps<{
  modelValue?: string;
  quillOptions?: any;
  imageHandlerType?: 'server' | 'inline';
  maxFileSize?: number;
  maxWidth?: number; // Updated prop for maximum width
  maxHeight?: number; // Updated prop for maximum height
}>();

const emit = defineEmits(['update:modelValue']);

// Initialize variables with default values
const editorContent = props.modelValue ?? '';
const quillOpts = props.quillOptions;
const imageHandlerType = props.imageHandlerType ?? 'server';
const maxFileSize = props.maxFileSize ?? 1_000_000; // 1MB
const maxWidth = props.maxWidth ?? 200; // Default max width
const maxHeight = props.maxHeight ?? 150; // Default max height

// Reference to the editor DOM element
const editorRef = ref<HTMLElement | null>(null);

// Quill instance
let quill: Quill | null = null;

/**
 * Prompts user to select an image file.
 * @returns The selected File or null.
 */
async function selectFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.addEventListener('change', () => {
      resolve(input.files?.[0] || null);
    });

    input.click();
  });
}

/**
 * Uploads the selected image to the server and inserts its URL.
 */
async function customImageUploadHandler() {
  const file = await selectFile();
  if (!file) return;

  try {
    const formData = new FormData();
    formData.append('upload', file);
    formData.append('type_t', 'fileTypes.other_file');

    const response = await axios.post(`/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Accept: 'application/json',
      },
    });

    const range = quill?.getSelection(true);
    if (range && quill) {
      quill.insertEmbed(range.index, 'image', response.data.blog_url, 'user');
      quill.setSelection(range.index + 1, 0);
    }
  } catch (error) {
    console.error('Image upload failed:', error);
  }
}

/**
 * Resizes an image while maintaining its aspect ratio.
 * @param file The image file to resize.
 * @param maxWidth Maximum width.
 * @param maxHeight Maximum height.
 * @returns Resized image as a base64 string.
 */
async function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener('load', () => {
      if (typeof reader.result !== 'string') {
        return reject(new Error('Invalid file data.'));
      }

      const img = new Image();
      img.addEventListener('load', () => {
        let { width, height } = img;

        // Calculate aspect ratio
        const aspectRatio = width / height;

        // Adjust dimensions to maintain aspect ratio
        if (width > maxWidth) {
          width = maxWidth;
          height = width / aspectRatio;
        }

        if (height > maxHeight) {
          height = maxHeight;
          width = height * aspectRatio;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) return reject(new Error('Canvas context unavailable.'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL(file.type));
      });

      img.addEventListener('error', reject);
      img.src = reader.result;
    });

    reader.addEventListener('error', reject);
    reader.readAsDataURL(file);
  });
}

/**
 * Inserts an inline (base64) image with optional resizing and size validation.
 */
async function customInlineImageHandler() {
  const file = await selectFile();
  if (!file) return;

  if (file.size > maxFileSize) {
    alert(`Image exceeds the maximum size of ${maxFileSize} bytes.`);
    return;
  }

  try {
    const resizedBase64 = await resizeImage(file, maxWidth, maxHeight);
    const originalBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.addEventListener('load', () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file.'));
        }
      });

      reader.addEventListener('error', reject);
      reader.readAsDataURL(file);
    });

    const range = quill?.getSelection(true);
    if (range && quill) {
      quill.insertEmbed(range.index, 'image', resizedBase64, 'user');

      // Store original image data
      setTimeout(() => {
        const images = document.querySelectorAll('.ql-editor img');
        for (const img of images) {
          if (img.src === resizedBase64) {
            img.dataset.originalSrc = originalBase64;
          }
        }
        emit('update:modelValue', quill.root.innerHTML);
      }, 0);

      quill.setSelection(range.index + 1, 0);
    }
  } catch (error) {
    console.error('Inline image insertion failed:', error);
  }
}

/**
 * Chooses the image handler based on the prop.
 */
function customImageHandler() {
  if (imageHandlerType === 'server') {
    customImageUploadHandler();
  } else {
    customInlineImageHandler();
  }
}

// Initialize Quill on component mount
onMounted(() => {
  const options: Quill.QuillOptionsStatic = {
    theme: 'snow',
    modules: {
      imageResize: { displaySize: true },
      toolbar: {
        container: quillOpts || [
          ['bold', 'italic', 'underline', 'strike'],
          ['blockquote', 'code-block'],
          ['link', 'image', 'video', 'formula'],
          [{ header: 1 }, { header: 2 }],
          [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
          [{ script: 'sub' }, { script: 'super' }],
          [{ indent: '-1' }, { indent: '+1' }],
          [{ direction: 'rtl' }],
          [{ size: ['small', false, 'large', 'huge'] }],
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          [{ color: [] }, { background: [] }],
          [{ font: [] }],
          [{ align: [] }],
          ['clean'],
        ],
        handlers: { image: customImageHandler },
      },
    },
  };

  if (editorRef.value) {
    quill = new Quill(editorRef.value, options);

    // Set initial content
    if (editorContent) {
      quill.root.innerHTML = editorContent;
    }

    // Emit content changes
    quill.on('text-change', () => {
      emit('update:modelValue', quill?.root.innerHTML || '');
    });
  }
});

// Update editor content when prop changes
watch(
  () => props.modelValue,
  (newValue) => {
    if (quill && newValue !== quill.root.innerHTML) {
      quill.root.innerHTML = newValue || '';
    }
  },
);
</script>

<style scoped>
.quill-editor-wrapper {
  /* Add your editor styles here */
}
</style>
