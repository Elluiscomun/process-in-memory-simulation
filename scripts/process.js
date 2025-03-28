// Importar funciones necesarias
import { generateMemoryframe, renderMemoryTable } from './main.js';
import PCB from './models/PCB.js';

// Selección de elementos
const addProcessButton = document.querySelector('#addProcess');
const mainMemoryTable = document.querySelector('#mainMemoryTable');
const ioSource = document.querySelector('#ioSource');

// Variable global para almacenar los procesos creados
window.processList = [];

// Variables globales para manejar los procesos en diferentes estados
window.waitingForCPU = []; // Procesos esperando CPU
window.waitingForResource = []; // Procesos esperando recursos
window.terminatedProcesses = []; // Procesos terminados

// Función para generar un tamaño de proceso aleatorio entre 4 y 40
function generateProcessSize() {
    return Math.floor(Math.random() * (40 - 4 + 1)) + 4;
}

// Función para calcular la capacidad de almacenamiento por fila
function getRowCapacity() {
    return window.appSettings.systemSize / 8; // 32/8 = 4 o 64/8 = 8
}

// Función para buscar espacio contiguo en memoria
function findContiguousSpace(processSize) {
    const rowCapacity = getRowCapacity(); // Capacidad de cada fila
    const requiredRows = Math.ceil(processSize / rowCapacity); // Filas necesarias para el proceso

    let startIndex = -1; // Índice inicial del espacio contiguo
    let contiguousCount = 0; // Contador de filas contiguas disponibles

    // Recorrer los frames en la matriz global
    for (let i = 0; i < window.memoryFrames.length; i++) {
        const frame = window.memoryFrames[i];
        const isFrameEmpty = frame.every(block => block.process === null); // Verificar si la fila está vacía

        if (isFrameEmpty) {
            if (startIndex === -1) startIndex = i; // Marcar el inicio del espacio contiguo
            
            contiguousCount++;

            // Si se encontraron suficientes filas contiguas
            if (contiguousCount*window.appSettings.frameSize >= requiredRows) {
                return startIndex; // Retornar el índice inicial
            }
        } else {
            // Reiniciar la búsqueda si se encuentra una fila ocupada
            startIndex = -1;
            contiguousCount = 0;
        }
    }

    return -1; // No se encontró espacio contiguo
}

// Función para asignar un proceso a memoria
function allocateProcessToMemory(process) {
    let sizeProcess = process.size; // Tamaño del proceso
    const rowCapacity = getRowCapacity(); // Capacidad de cada fila
    const requiredRows = Math.ceil(process.size / rowCapacity); // Filas necesarias para el proceso

    // Buscar espacio contiguo
    let startIndex = findContiguousSpace(process.size);

    // Si no hay espacio suficiente, generar más frames
    if (startIndex === -1) {
        console.error('Not enough contiguous space. Generating more frames...');
        let requiredFrames = Math.ceil(requiredRows / window.appSettings.frameSize) ; // Filas necesarias para el proceso
        generateMemoryframe(requiredFrames); // Generar las filas necesarias
        startIndex = findContiguousSpace(process.size); // Intentar nuevamente
    }

    // Si aún no hay espacio, retornar error
    if (startIndex === -1) {
        console.error(`Error: Unable to allocate process ${process.pid} to memory.`);
        return false;
    }

    // Asignar el proceso a las filas contiguas
    let count_frames_join = startIndex;
    let count_rows = requiredRows; // Contador de filas asignadas
    while (count_rows) {
        const frame = window.memoryFrames[count_frames_join];
        count_frames_join++;
        frame.forEach(block => {
            if (sizeProcess > 0) {
                block.process = process; // Asignar el PID al bloque
                sizeProcess=sizeProcess-rowCapacity; // Reducir el tamaño restante del proceso
                count_rows--; // Incrementar el contador de filas asignadas
            }
        });
    }

    console.log(`Process ${process.pid} allocated to memory starting at frame ${startIndex}.`);
    return true;
}

// Función para asignar un proceso a memoria no contigua
function allocateNoContinuosProcessToMemory(process) {

    const rowCapacity = getRowCapacity(); // Capacidad de cada fila
    let requiredRows = Math.ceil(process.size / rowCapacity);


    // Recorrer los marcos de memoria para buscar bloques vacíos
    while(requiredRows > 0) {
        for (let i = 0; i < window.memoryFrames.length; i++) {
            const frame = window.memoryFrames[i];
    
            // Buscar bloques vacíos en el marco actual
            if(frame[0].process === null) {
                frame.forEach(block => {
                    if (requiredRows > 0) {
                        block.process = process; // Asignar el proceso al bloque
                        requiredRows--; // Reducir el tamaño restante del proceso
                    }
                });
    
            }
    
            // Si el proceso ya se asignó completamente, salir del bucle
            if (requiredRows === 0) {
                console.log(`Process ${process.pid} allocated using Non-Contiguous memory scheme.`);
                return true;
            }
        }

        // Si no hay suficiente espacio, generar más marcos
        if (requiredRows > 0) {
            console.error('Not enough space. Generating more frames...');
            const requiredFrames = Math.ceil(requiredRows / window.appSettings.frameSize);
            generateMemoryframe(requiredFrames); // Generar más marcos
        }
    }
    

    

    return false; // Retornar false si no se pudo asignar
}

// Función para generar un nuevo proceso
function createProcess() {
    const pid = window.pid_count++; // Incrementar el contador global de procesos
    const size = generateProcessSize();
    const burstTime = Math.floor(Math.random() * 10) + 1; // Tiempo de ráfaga aleatorio
    const arrivalTime = Date.now(); // Usar la marca de tiempo actual como tiempo de llegada
    const status = 'Created'; // Estado inicial del proceso
    const burst = 1; // Número de ráfagas inicial

    // Crear una nueva instancia de PCB
    const newProcess = new PCB(pid, status, size, burst, arrivalTime, burstTime);

    // Agregar el proceso a la lista global
    processList.push(newProcess);

    console.log(`Process created: PID=${newProcess.pid}, Size=${newProcess.size}, Burst Time=${newProcess.burstTime}`);
    return newProcess;
}

// Función para animar el escaneo de los frames
function animateScanFrames() {
    const frames = mainMemoryTable.querySelectorAll('.main-memory-address-frame');
    return new Promise((resolve) => {
        let index = 0;

        function scanNextFrame() {
            if (index < frames.length) {
                frames[index].classList.add('scanning'); // Agregar clase de animación
                setTimeout(() => {
                    frames[index].classList.remove('scanning'); // Quitar clase de animación
                    index++;
                    scanNextFrame();
                }, 200); // Tiempo entre cada escaneo
            } else {
                resolve(); // Resolución de la promesa cuando termine el escaneo
            }
        }

        scanNextFrame();
    });
}

// Función para animar el escaneo de ioSource
function animateScanIoSource() {
    return new Promise((resolve) => {
        ioSource.classList.add('scanning'); // Agregar clase de animación
        setTimeout(() => {
            ioSource.classList.remove('scanning'); // Quitar clase de animación
            resolve(); // Resolución de la promesa cuando termine la animación
        }, 500); // Duración de la animación (en milisegundos)
    });
}

// Función principal para manejar la creación de procesos
async function handleAddProcess() {
    const process = createProcess();

    // Animar el escaneo de los frames
    await animateScanFrames();

    // Intentar asignar el proceso a memoria
    if (window.appSettings.memoryScheme === 'contiguous') {
        const success = allocateProcessToMemory(process);

        if (success) {
            renderMemoryTable(); // Renderizar la tabla actualizada
            showPopup(`Process ${process.pid} created successfully!`, 'success');
        } else {
            showPopup(`Error: Unable to create process ${process.pid}. No memory available.`, 'error');
            return; // Salir si no se pudo asignar el proceso
        }
    } if (window.appSettings.memoryScheme === 'non-contiguous'){
        const success = allocateNoContinuosProcessToMemory(process);

        if (success) {
            renderMemoryTable(); // Renderizar la tabla actualizada
            showPopup(`Process ${process.pid} created successfully!`, 'success');
        } else {
            showPopup(`Error: Unable to create process ${process.pid}. No memory available.`, 'error');
            return; // Salir si no se pudo asignar el proceso
        }    
    }

    // Animar el escaneo de ioSource y verificar si está vacío
    for (let attempt = 1; attempt <= 1; attempt++) {
        await animateScanIoSource();

        if (isIoSourceEmpty()) {
            process.updateStatus('Ready'); // Cambiar el estado del proceso a "Ready"
            renderMemoryTable(); // Actualizar la tabla con el nuevo estado
            showPopup(`Process ${process.pid} is now Ready!`, 'success');
            return;
        }

        console.error(`Attempt ${attempt}: ioSource is not empty.`);
    }

    // Si después de tres intentos ioSource sigue ocupado
    process.updateStatus('Created'); // Mantener el estado en "Created"
    renderMemoryTable(); // Actualizar la tabla con el estado actual
    showPopup(`Process ${process.pid} could not transition to Ready.`, 'error');
    waitingForResource.push(process); // Agregar a la lista de espera por recursos
}

// Función para verificar si ioSource está vacío
function isIoSourceEmpty() {
    return ioSource.children.length === 0;
}

// Función para mostrar un mensaje emergente (pop-up)
function showPopup(message, type) {
    const popup = document.createElement('div');
    popup.classList.add('popup', type); // Clase "success" o "error"
    popup.textContent = message;

    // Agregar el pop-up al cuerpo
    document.body.appendChild(popup);

    // Eliminar el pop-up después de 3 segundos
    setTimeout(() => {
        popup.remove();
    }, 5000);
}

let isProcessing = false; // Indicador para evitar llamadas concurrentes

// Función para procesar la cola de procesos en estado "Ready"
async function processReadyQueue() {
    if (isProcessing) return; // Salir si ya se está procesando
    isProcessing = true; // Marcar como en ejecución

    // Filtrar los procesos en estado "Ready"
    const readyProcesses = processList.filter(process => process.status === 'Ready');

    if (readyProcesses.length === 0) {
        console.error('No processes in Ready state to process.');
        isProcessing = false; // Marcar como no en ejecución
        return;
    }

    // Ordenar los procesos por tiempo de llegada (arrivalTime)
    readyProcesses.sort((a, b) => a.arrivalTime - b.arrivalTime);

    // Atender el primer proceso en la cola
    const processToRun = readyProcesses[0];
    console.log(`Processing PID=${processToRun.pid}...`);

    // Cambiar el estado del proceso a "Executing"
    processToRun.updateStatus('Executing');
    renderMemoryTable(); // Actualizar la tabla con el nuevo estado

    // Mostrar el proceso en el CPU
    const cpuSource = document.querySelector('#cpuSource');
    const cpuProcessDiv = document.createElement('div');
    cpuProcessDiv.innerHTML = `<p>PID: ${processToRun.pid}</p><p>Status: Executing</p>`;
    cpuSource.appendChild(cpuProcessDiv); // Agregar el div al contenedor de CPU

    // Convertir unitTime de segundos a milisegundos
    const unitTimeInMs = window.appSettings.unitTime * 1000;

    // Simular el tiempo de ejecución del proceso (burstTime * unitTime)
    await new Promise(resolve => setTimeout(resolve, processToRun.burstTime * unitTimeInMs));

    // Eliminar el div del proceso de CPU
    if(cpuSource.firstChild) cpuSource.removeChild(cpuProcessDiv); // Eliminar el div del contenedor de CPU

    // Mover el proceso a IO y cambiar su estado
    const ioSource = document.querySelector('#ioSource');
    const ioProcessDiv = document.createElement('div');
    ioProcessDiv.innerHTML = `<p>PID: ${processToRun.pid}</p><p>Status: ${processToRun.status}</p>`;
    ioSource.appendChild(ioProcessDiv); // Agregar el div al contenedor de IO

    // Simular el tiempo en IO antes de eliminarlo
    await new Promise(resolve => setTimeout(resolve, unitTimeInMs)); // Simular 1 segundo en IO

    // Eliminar el div del proceso de IO
    ioSource.removeChild(ioProcessDiv); // Eliminar el div del contenedor de IO
    
    // Cambiar el estado del proceso a "Terminated"
    processToRun.updateStatus('Terminated');

    // Mover el proceso a la lista de procesos terminados
    terminatedProcesses.push(processToRun);

    // Eliminar el proceso de processList
    const index = processList.indexOf(processToRun);
    if (index !== -1) {
        processList.splice(index, 1);
    }

    // Verificar si hay procesos en waitingForResource
    if (waitingForResource.length > 0) {
        const nextProcess = waitingForResource.shift(); // Sacar el primer proceso de la lista
        nextProcess.updateStatus('Ready'); // Cambiar su estado a "Ready"
        processList.push(nextProcess); // Moverlo a la lista de procesos listos
        console.log(`Process PID=${nextProcess.pid} moved from WaitingForResource to Ready.`);
        renderMemoryTable(); // Actualizar la tabla con el nuevo estado
    }

    // Eliminar el proceso de mainMemoryTable
    window.memoryFrames.forEach(frame => {
        frame.forEach(block => {
            if (block.process && block.process.pid === processToRun.pid) {
                block.process = null; // Liberar el bloque de memoria
            }
        });
    });

    

    console.log(`Process PID=${processToRun.pid} has been terminated.`);
    renderMemoryTable(); // Actualizar la tabla
    showPopup(`Process ${processToRun.pid} has been terminated.`, 'success');

    isProcessing = false; // Marcar como no en ejecución
}

// Observador para verificar si hay procesos en estado "Ready"
setInterval(() => {
    const readyProcesses = processList.filter(process => process.status === 'Ready');
    if (readyProcesses.length > 0) {
        processReadyQueue(); // Llamar a la función si hay procesos en estado "Ready"
    }
}, 1000); // Verificar cada 1 segundo

// Agregar evento al botón "Add Process"
addProcessButton.addEventListener('click', handleAddProcess);