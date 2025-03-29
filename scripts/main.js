window.address_memory_last = 1; // Dirección inicial en hexadecimal
window.pid_count = 1; // Contador de procesos
window.memoryFrames = []; // Matriz global para almacenar los frames y bloques

// Selecciona el contenedor principal donde se agregarán los frames
const memoryTableContainer = document.querySelector('.main-memory-table');

// Función para generar frames y almacenarlos en la matriz global
function generateMemoryframe(amount) {
    const baseIncrement = 0x1000; // Incremento en hexadecimal para cada bloque
    let frameSize = window.appSettings.frameSize; 

    for (let frameIndex = 0; frameIndex < amount; frameIndex++) {
        const frame = []; // Crear un nuevo frame (fila en la matriz)

        
        if(window.appSettings.partitioning === 'dynamic' || window.appSettings.partitioning === 'segmentation') {
            frameSize=Math.floor(Math.random() * (7 - 2 + 1)) + 2;
        }
        
        for (let i = 0; i < frameSize; i++) {
            // Calcula la dirección hexadecimal basada en address_memory_last
            const address = (window.address_memory_last * baseIncrement).toString(16).toUpperCase();

            // Crear un bloque de memoria
            const memoryBlock = {
                address: `0x${address}`,
                process: null // Inicialmente vacío
            };

            // Agregar el bloque al frame
            frame.push(memoryBlock);

            // Actualizar la secuencia global
            window.address_memory_last++;
        }

        // Agregar el frame a la matriz global
        window.memoryFrames.push(frame);
    }

    // Renderizar la tabla en el HTML
    renderMemoryTable();
}

// Función para renderizar la tabla de memoria en el HTML
function renderMemoryTable() {
    // Limpiar el contenedor antes de renderizar
    memoryTableContainer.innerHTML = `
        <div class="main-memory-address-box">
            <div class="main-memory-address-box-address">
                <p class="main-memory-address-box-title">Address</p>
            </div>
            <div class="main-memory-address-box-process">
                <p class="main-memory-address-box-title">Process</p>
            </div>
        </div>
    `;

    // Recorrer los frames en la matriz global
    window.memoryFrames.forEach((frame) => {
        // Crear un nuevo contenedor para el frame
        const memoryframe = document.createElement('div');
        memoryframe.classList.add('main-memory-address-frame');

        // Recorrer los bloques dentro del frame
        frame.forEach((block) => {
            // Crear el contenedor principal del bloque
            const memoryBox = document.createElement('div');
            memoryBox.classList.add('main-memory-address-box');

            // Crear el contenedor de la dirección
            const addressBox = document.createElement('div');
            addressBox.classList.add('main-memory-address-box-address');
            const addressText = document.createElement('p');
            addressText.classList.add('main-memory-address-box-title');
            addressText.textContent = block.address;
            addressBox.appendChild(addressText);

            // Crear el contenedor del proceso
            const processBox = document.createElement('div');
            processBox.classList.add('main-memory-address-box-process');
            const processText = document.createElement('p');
            processText.classList.add('main-memory-address-box-title');

            // Mostrar el PID y el estado del proceso si existe
            if (block.process) {
                processText.textContent = `PID: ${block.process.pid}, Status: ${block.process.status}, Burst: ${block.process.burstTime}`;
            } else {
                processText.textContent = ''; // Si no hay proceso, dejar vacío
            }
            processBox.appendChild(processText);

            // Agregar los contenedores al bloque principal
            memoryBox.appendChild(addressBox);
            memoryBox.appendChild(processBox);

            // Agregar el bloque al frame
            memoryframe.appendChild(memoryBox);
        });

        // Agregar el frame al contenedor principal
        memoryTableContainer.appendChild(memoryframe);
    });
}

// Función para renderizar la tabla de paginación en el HTML
function renderPagingTable() {
    const secondMemory = document.querySelector('#secondMemory');
    secondMemory.innerHTML = ''; // Limpiar la tabla

    // Crear encabezados de la tabla
    const header = document.createElement('div');
    header.classList.add('paging-header');
    header.innerHTML = `
        <div>PID</div>
        <div>Frame Number</div>
        <div>Burst Time</div>
        <div>Status</div>
    `;
    secondMemory.appendChild(header);

    // Agregar filas para cada entrada en la tabla de paginación
    window.pagingTable.forEach(entry => {
        const row = document.createElement('div');
        row.classList.add('paging-row');
        row.innerHTML = `
            <div>${entry.pid}</div>
            <div>${entry.frameNumber}</div>
            <div>${entry.burstTime}</div>
            <div>${entry.status}</div>
        `;
        secondMemory.appendChild(row);
    });
}

function renderSegmentTable() {
    const secondMemory = document.querySelector('#secondMemory');
    secondMemory.innerHTML = ''; // Limpiar la tabla

    // Crear encabezados de la tabla
    const header = document.createElement('div');
    header.classList.add('segment-header');
    header.innerHTML = `
        <div>PID</div>
        <div>Segment ID</div>
        <div>Base Address</div>
        <div>Limit (Bytes)</div>
        <div>Burst</div>
    `;
    secondMemory.appendChild(header);

    // Agregar filas para cada segmento en la tabla de segmentación
    window.segmentTable.forEach(entry => {
        const row = document.createElement('div');
        row.classList.add('segment-row');
        row.innerHTML = `
            <div>${entry.pid}</div>
            <div>${entry.segmentId}</div>
            <div>${entry.baseAddress || 'Not Assigned'}</div>
            <div>${entry.limit}</div>
            <div>${entry.burstTime}</div>
        `;
        secondMemory.appendChild(row);
    });
}

export { generateMemoryframe, renderMemoryTable, renderPagingTable, renderSegmentTable };
