// Importar funciones necesarias
import { generateMemoryframe, renderMemoryTable, renderPagingTable, renderSegmentTable } from './main.js';
import PCB from './models/PCB.js';

// Selección de elementos
const addProcessButton = document.querySelector('#addProcess');
const mainMemoryTable = document.querySelector('#mainMemoryTable');
const ioSource = document.querySelector('#ioSource');

// Variable global para almacenar los procesos creados
window.processList = [];
window.segmentTable = []; // Tabla global para almacenar los segmentos de los procesos

// Variables globales para manejar los procesos en diferentes estados
window.waitingForCPU = []; // Procesos esperando CPU
window.waitingForIO = []; // Procesos esperando recursos
window.terminatedProcesses = []; // Procesos terminados

// Estructura global para la tabla de paginación
window.pagingTable = [];

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

    // Crear una nueva instancia de PCB
    const newProcess = new PCB(pid, status, size, arrivalTime, burstTime);

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

    if (window.appSettings.partitioning === 'segmentation') {
        process.createSegments();
        allocateSegmentsToMemory(process); // Asignar los segmentos a memoria
        
        showPopup(`Process ${process.pid} created with segmentation!`, 'success');
        return;
    }

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
    waitingForIO.push(process); // Agregar a la lista de espera por recursos
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

// Función para verificar el número de frame de un proceso
function findFrameNumber(pid) {
    for (let i = 0; i < window.memoryFrames.length; i++) {
        const frame = window.memoryFrames[i];
        if (frame.some(block => block.process && block.process.pid === pid)) {
            return i; // Retornar el índice del frame
        }
    }
    return -1; // No encontrado
}

// Función para verificar la tabla de paginación
function checkPagingTable() {
    if (window.pagingTable.length === 0) return;

    const ioSource = document.querySelector('#ioSource');

    if (ioSource.children.length === 0) {
        const processInPaging = window.pagingTable[0]; // Sacar el primer proceso de la tabla
        window.pagingTable = window.pagingTable.filter(p => p.pid !== processInPaging.pid); // Eliminar de la tabla de paginación

        const process = processList.find(p => p.pid === processInPaging.pid);
        
        if (process) {
            process.updateStatus('Ready');
            process.realativeArrivalTime = Date.now(); // Actualizar el tiempo de llegada
            renderMemoryTable();
            console.log(`Process PID=${process.pid} moved from Paging to Ready.`);
        }

        renderPagingTable();
    }
}

// Función para mover procesos de la tabla de paginación a waitingForCPU
function moveFromPagingToWaitingForCPU() {
    if (window.pagingTable.length === 0) return; // No hay procesos en la tabla de paginación

    const processEntry = window.pagingTable[0]; // Sacar el primer proceso de la tabla
    
    window.pagingTable = window.pagingTable.filter(p => p.pid === processEntry.pid);
    console.error(window.pagingTable);
    const process = window.processList.find(p => p.pid === processEntry.pid);


    if (process && isIoSourceEmpty()) {
        process.updateStatus('Ready');
        process.realativeArrivalTime = Date.now(); // Actualizar el tiempo de llegada
        console.log(`Process PID=${process.pid} moved from Paging Table to WaitingForCPU.`);
    }

    // Actualizar la tabla de paginación
    renderPagingTable();
    renderMemoryTable(); 
}

// Función para mover procesos de waitingForCPU a processList
function moveFromWaitingForCPUToProcessList() {
    if (window.waitingForCPU.length === 0) return; // No hay procesos en waitingForCPU

    const process = window.waitingForCPU[0]; // Sacar el primer proceso de la lista
    window.waitingForCPU = window.waitingForCPU.filter(p => p.pid !== process.pid); // Eliminar de waitingForCPU
    
    process.updateStatus('Ready'); // Cambiar el estado del proceso a Ready
    window.processList.push(process); // Mover el proceso de vuelta a processList

    console.log(`Process PID=${process.pid} moved from WaitingForCPU to ProcessList.`);
}

// Función para mover un proceso a la tabla de paginación
function moveToPagingTable(process) {
    const frameNumbers = []; // Almacenar los números de frame ocupados por el proceso
    process.updateStatus('WaitingForResource'); // Cambiar el estado del proceso a "WaitingForResource"
    // Buscar los frames ocupados por el proceso en memoria principal
    window.memoryFrames.forEach((frame, frameIndex) => {
        if(frame[0].process && frame[0].process.pid === process.pid) {
            frameNumbers.push(frameIndex); // Agregar el número de frame a la lista
        }
    });

    // Agregar el proceso a la tabla de paginación
    frameNumbers.forEach(frameNumber => {
        window.pagingTable.push({
            pid: process.pid,
            frameNumber: frameNumber,
            burstTime: process.burstTime, // Agregar el burstTime del proceso
            status: 'WaitingForResource'
        });
    });

    // Actualizar las tablas
    renderMemoryTable();
    renderPagingTable();

    console.log(`Process PID=${process.pid} moved to Paging Table.`);
}

function allocateSegmentsToMemory(process) {
    
    process.segments.forEach(segment => {
        let assigned = false;
        let requiredRows = Math.ceil(segment.size / getRowCapacity()); // Filas necesarias para el segmento 
        
        while(!assigned){
            // Buscar un marco vacío que pueda contener el segmento
            for (let i = 0; i < window.memoryFrames.length; i++) {
                const frame = window.memoryFrames[i];
                const isFrameEmpty = frame.every(block => block.process === null);

                if (isFrameEmpty && frame.length >= requiredRows) {
                    // Asignar el segmento al marco
                    for (let j = 0; j < requiredRows; j++) {
                        frame[j].process = process;
                        frame[j].segmentId = segment.segmentId; // Asociar el bloque al segmento  
                    }

                    segment.frameNumber = i; // Guardar el número de marco asignado
                    segment.baseAddress = frame[0].address; // Dirección base del segmento
                    assigned = true;

                    if(segment.segmentId===3){
                        process.updateStatus('Ready')
                    }
                    break;
                }
            }

            // Si no se encontró un marco, generar más
            if (!assigned) {
                console.error(`Not enough space for segment ${segment.segmentId} of process PID=${process.pid}. Generating more frames...`);
                generateMemoryframe(1); // Generar un marco adicional
            }
        }
        
    });

    console.log(`Process PID=${process.pid} segments allocated to memory.`);
    renderMemoryTable(); // Actualizar la tabla de memoria
}

function moveToSegmentTable(process) {
    process.updateStatus('WaitingForResource'); // Cambiar el estado del proceso a "WaitingForResource"

    // Mover cada segmento del proceso a la tabla de segmentación
    process.segments.forEach(segment => {
        window.segmentTable.push({
            pid: process.pid,
            segmentId: segment.segmentId,
            size: segment.size,
            baseAddress: segment.baseAddress,
            limit: segment.limit,
            frameNumber: segment.frameNumber || 'Not Assigned',
            status: 'WaitingForResource',
            burstTime: process.burstTime
        });
    });

    // Actualizar la tabla de segmentación en el DOM
    renderSegmentTable();
    renderMemoryTable();

    console.log(`Process PID=${process.pid} segments moved to Segment Table.`);
}

function checkSegmentTable() {
    if (window.segmentTable.length === 0) return;

    const ioSource = document.querySelector('#ioSource');

    if (ioSource.children.length === 0) {
        const processInSegment = window.segmentTable[0]; // Sacar el primer proceso de la tabla
        window.segmentTable = window.segmentTable.filter(p => p.pid !== processInSegment.pid); // Eliminar de la tabla de segmentos

        const process = processList.find(p => p.pid === processInSegment.pid);

        if (process) {
            process.updateStatus('Ready');
            process.realativeArrivalTime = Date.now(); // Actualizar el tiempo de llegada
            renderMemoryTable();
            console.log(`Process PID=${process.pid} moved from Segment Table to Ready.`);
        }

        renderSegmentTable();
        renderMemoryTable();
    }
}

// Función para procesar la cola de procesos en estado "Ready"
async function processReadyQueue() {
    if (isProcessing) return; // Salir si ya se está procesando
    isProcessing = true;

    if(window.appSettings.scheduler === 'rr' && window.appSettings.partitioning === 'paging') {
        checkPagingTable();
        moveFromPagingToWaitingForCPU();
    }else if(window.appSettings.scheduler === 'rr' && window.appSettings.partitioning === 'segmentation'){
        checkSegmentTable();
    }
    

    const readyProcesses = processList.filter(process => process.status === 'Ready');
    console.error(processList.filter(process => process.status === 'Ready'));

    if (readyProcesses.length === 0) {
        console.error('No processes in Ready state to process.');
        const waitingProcesses = processList.filter(process => process.status === 'WaitingForResource');
        if(waitingProcesses.length === 0){
            isProcessing = false;
            return;
        } 
    }

    // Ordenar los procesos por tiempo de llegada
    readyProcesses.sort((a, b) => a.realativeArrivalTime - b.realativeArrivalTime);

    const processToRun = readyProcesses[0];
    console.log(`Processing PID=${processToRun.pid}...`);

    processToRun.updateStatus('Executing');
    renderMemoryTable();

    const cpuSource = document.querySelector('#cpuSource');
    const cpuProcessDiv = document.createElement('div');
    cpuProcessDiv.innerHTML = `<p>PID: ${processToRun.pid}</p><p>Status: Executing</p>`;
    cpuSource.appendChild(cpuProcessDiv);

    // Convertir unitTime de segundos a milisegundos
    const unitTimeInMs = window.appSettings.unitTime * 1000;
    const quantumInMs = window.appSettings.quantum * unitTimeInMs;

    // Simular el tiempo de ejecución del proceso
    if(window.appSettings.scheduler === 'rr'){
        await new Promise(resolve => setTimeout(resolve, Math.min(quantumInMs, processToRun.burstTime * unitTimeInMs)));
        processToRun.burstTime -= window.appSettings.quantum;// Reducir el burstTime del proceso
    }else{
        await new Promise(resolve => setTimeout(resolve, processToRun.burstTime * unitTimeInMs));
    } 

    // Eliminar el proceso del CPU
    if(cpuSource.firstChild) cpuSource.removeChild(cpuProcessDiv);

    
    if (processToRun.burstTime > 0 && window.appSettings.scheduler === 'rr' && window.appSettings.partitioning === 'paging') {
        
        // Si el proceso aún tiene burstTime, enviarlo a la tabla de paginación
        moveToPagingTable(processToRun);

    }else if(processToRun.burstTime > 0 && window.appSettings.scheduler === 'rr' && window.appSettings.partitioning === 'segmentation'){
        moveToSegmentTable(processToRun);
    }else{
        // Si el proceso ha terminado, enviarlo a IO
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
        if (waitingForIO.length > 0) {
            const nextProcess = waitingForIO.shift(); // Sacar el primer proceso de la lista
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
        
    }

    console.error("llegue casi al final");
    isProcessing = false;
}

// Observador para verificar si hay procesos en estado "Ready"
setInterval(() => {
    const readyProcesses = processList.filter(process => process.status === 'Ready' || 'WaitingForResource');
    if (readyProcesses.length > 0) {
        processReadyQueue(); // Llamar a la función si hay procesos en estado "Ready"
    }
}, 1000); // Verificar cada 1 segundo

// Agregar evento al botón "Add Process"
addProcessButton.addEventListener('click', handleAddProcess);