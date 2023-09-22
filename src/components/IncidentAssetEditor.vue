<script setup lang="ts">
import { ref, watch, toRefs } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  printSize: {
    type: String,
    default: '',
  },
  perPage: {
    type: Number,
    default: 2,
  },
  printContainerStyle: {
    type: String,
    default: '',
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
});
const { modelValue, printSize, perPage, printContainerStyle } = toRefs(props);

const emit = defineEmits(['update:modelValue']);

const htmlContent = ref(modelValue.value);
const editorElement = ref<HTMLDivElement | null>(null);

watch(modelValue, (newValue) => {
  htmlContent.value = newValue;
});

function updateHtmlContent() {
  if (editorElement.value) {
    htmlContent.value = editorElement.value.innerHTML;
    emit('update:modelValue', htmlContent.value); // Emitting changes to parent
  }
}

function handleEnter(event: KeyboardEvent) {
  event.preventDefault();
  updateHtmlContent();
}

function printContent() {
  const printWindow = window.open('', '_blank');

  if (printWindow) {
    const printContent = `
        <html>
          <head>
              <link href="https://fonts.googleapis.com/css?family=Nunito+Sans:100,300,400,500,600,700,800,900,1000&display=swap" rel="stylesheet">
              <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,600,700&display=swap" rel="stylesheet">
              <title></title>
              <style>
                  @media print {
                      html, body { height: max-content }
                      body {-webkit-print-color-adjust: exact;}
                      @page {
                        size: ${printSize.value};
                        margin: 0;
                      }
                  }
              </style>
          </head>
          <body style="font-family:Nunito Sans,sans-serif">
          <div style="${printContainerStyle.value}">
            ${editorElement.value.innerHTML.repeat(perPage.value)}
          </div>
          </body>
        </html>
      `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  }
}

defineExpose({
  printContent,
});
</script>

<template>
  <div
    ref="editorElement"
    :contenteditable="!readOnly"
    spellcheck="false"
    class="outline-none h-max"
    @keydown.enter="handleEnter"
    @blur="updateHtmlContent"
    v-html="htmlContent"
  ></div>
</template>
