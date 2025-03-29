import { generateMemoryframe, renderMemoryTable } from './main.js';
// Selección de elementos
const modal = document.querySelector('#settingsModal');
const closeButton = document.querySelector('.close-button');
const settingsForm = document.querySelector('#settingsForm');
const partitioningSelect = document.querySelector('#partitioning');
const frameSizeInput = document.querySelector('#frameSize');
const memoryTableContainer = document.querySelector('.main-memory-table'); // Contenedor principal de los frames
const schedulerSelect = document.querySelector('#scheduler');
const quantumInput = document.querySelector('#quantum');

// Seleccionar los elementos del DOM
const memorySchemeSelect = document.querySelector('#memoryScheme');
const pagingOption = partitioningSelect.querySelector('option[value="paging"]');
const segmentationOption = partitioningSelect.querySelector('option[value="segmentation"]');

// Objeto global para almacenar la configuración
window.appSettings = {
    scheduler: 'fcfs', // Valor predeterminado
    memoryScheme: 'contiguous', // Valor predeterminado
    partitioning: 'fixed', // Valor predeterminado
    frameSize: 1, // Valor predeterminado
    systemSize: 32, // Valor predeterminado
    unitTime: 3, // Valor predeterminado
    quantum: 1 // Valor predeterminado para Round Robin
};

// Habilitar/deshabilitar el tamaño de marco según la partición seleccionada
partitioningSelect.addEventListener('change', () => {
    if (partitioningSelect.value === 'fixed' || partitioningSelect.value === 'paging') {
        frameSizeInput.disabled = false;
    } else {
        frameSizeInput.disabled = true;
        frameSizeInput.value = 1; // Restablecer a 1 si no es dinámico
    }
});

// Habilitar/deshabilitar el quantum según el planificador seleccionado
schedulerSelect.addEventListener('change', () => {
    if (schedulerSelect.value === 'rr') {
        quantumInput.disabled = false; // Habilitar quantum para Round Robin
    } else {
        quantumInput.disabled = true; // Deshabilitar quantum para otros planificadores
        quantumInput.value = 100; // Restablecer el valor predeterminado
    }
});

// Función para habilitar/deshabilitar opciones de partición
function updatePartitioningOptions() {
    if (memorySchemeSelect.value === 'non-contiguous') {
        // Habilitar Paging y Segmentation
        pagingOption.disabled = false;
        segmentationOption.disabled = false;

        // Deshabilitar Fixed y Dynamic
        partitioningSelect.querySelector('option[value="fixed"]').disabled = true;
        partitioningSelect.querySelector('option[value="dynamic"]').disabled = true;
    } else if (memorySchemeSelect.value === 'contiguous') {
        // Habilitar Fixed y Dynamic
        partitioningSelect.querySelector('option[value="fixed"]').disabled = false;
        partitioningSelect.querySelector('option[value="dynamic"]').disabled = false;

        // Deshabilitar Paging y Segmentation
        pagingOption.disabled = true;
        segmentationOption.disabled = true;
    }
}

// Agregar evento al selector de esquema de memoria
memorySchemeSelect.addEventListener('change', updatePartitioningOptions);

// Llamar a la función al cargar la página para establecer el estado inicial
updatePartitioningOptions();

// Función para eliminar solo los frames con la clase "main-memory-address-frame"
function clearMemoryFrames() {
    const frames = memoryTableContainer.querySelectorAll('.main-memory-address-frame');
    frames.forEach((frame) => frame.remove());
}

// Función para abrir la ventana modal
function openSettingsModal() {
    location.reload();
    modal.style.display = 'block';
}

// Función para cerrar la ventana modal
function closeSettingsModal() {
    modal.style.display = 'none';
}

// Exponer las funciones al ámbito global
window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;

// Cerrar la ventana modal al hacer clic fuera del contenido
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        closeSettingsModal();
    }
});

// Guardar la configuración
settingsForm.addEventListener('submit', (event) => {
    event.preventDefault();

    // Actualiza los valores en el objeto global
    window.appSettings.scheduler = document.querySelector('#scheduler').value;
    window.appSettings.memoryScheme = document.querySelector('#memoryScheme').value;
    window.appSettings.partitioning = partitioningSelect.value;
    window.appSettings.frameSize = parseInt(frameSizeInput.value, 10);
    window.appSettings.systemSize = parseInt(document.querySelector('#systemSize').value, 10);
    window.appSettings.unitTime = parseInt(document.querySelector('#unitTime').value, 10);

    // Guardar quantum solo si el scheduler es Round Robin
    if (window.appSettings.scheduler === 'rr') {
        window.appSettings.quantum = parseInt(quantumInput.value, 10);
    }

    console.log('Configuración guardada:', window.appSettings);

    // Elimina solo los frames existentes con la clase "main-memory-address-frame"
    clearMemoryFrames();

    // Cierra la ventana modal
    closeSettingsModal();

    // Genera nuevos frames (puedes ajustar el número según sea necesario)
    generateMemoryframe(3);

    clearVariables(); // Llama a la función para limpiar las variables globales
});

function clearVariables(){
    const cpuSource = document.querySelector('#cpuSource');
    cpuSource.textContent = '';

    window.memoryFrames = [];
    window.address_memory_last = 1;
    window.pid_count = 1;

    window.waitingForCPU = []; // Procesos esperando CPU
    window.waitingForResource = []; // Procesos esperando recursos
    window.terminatedProcesses = []; // Procesos terminados
    window.processList = []; // Lista de procesos

    if(ioSource.firstChild) ioSource.removeChild(ioSource.firstChild);
}