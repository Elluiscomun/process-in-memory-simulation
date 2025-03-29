// Seleccionar el botón y el contenedor de la tabla
const terminatedButton = document.querySelector('#terminatedButton');
const terminatedTableContainer = document.querySelector('#terminatedProcessesTable');
const terminatedTableContent = document.querySelector('#terminatedTableContent');

// Función para renderizar la tabla de procesos terminados
function renderTerminatedTable() {
    // Limpiar el contenido anterior
    terminatedTableContent.innerHTML = '';

    // Verificar si hay procesos terminados
    if (window.terminatedProcesses.length === 0) {
        terminatedTableContent.innerHTML = '<p>No terminated processes.</p>';
        return;
    }

    // Crear encabezados de la tabla
    const header = document.createElement('div');
    header.classList.add('terminated-row');
    header.innerHTML = `
        <div>PID</div>
        <div>Status</div>
        <div>Size</div>
        <div>Arrival Time (Unit Time)</div>
        <div>Burst Time</div>
        <div>Completion Time (Unit Time)</div>
        <div>Turnaround Time (Unit Time)</div>
        <div>Waiting Time (Unit Time)</div>
    `;
    terminatedTableContent.appendChild(header);

    // Agregar filas para cada proceso terminado
    window.terminatedProcesses.forEach(process => {
        const row = document.createElement('div');
        row.classList.add('terminated-row');

        const unitTime = window.appSettings.unitTime * 1000;
        // Calcular tiempos relativos en función de window.referenceTime
        const arrivalTime = (process.arrivalTime - window.referenceTime) / unitTime;
        const relativeCompletionTime = process.completionTime !== null ? (process.completionTime - window.referenceTime)/unitTime : 'N/A';
        process.calculateTurnaroundTime();
        const turnaroundTime= process.turnaroundTime !== null ? process.turnaroundTime/unitTime : 'N/A'
        process.calculateWaitingTime();
        const waitingTime = process.waitingTime !== null ? process.waitingTime/unitTime : 'N/A';

        row.innerHTML = `
            <div>${process.pid}</div>
            <div>${process.status}</div>
            <div>${process.size}</div>
            <div>${arrivalTime}</div>
            <div>${process.burstTimeInitial}</div>
            <div>${relativeCompletionTime}</div>
            <div>${turnaroundTime}</div>
            <div>${waitingTime}</div>
        `;
        terminatedTableContent.appendChild(row);
    });
}

// Evento para mostrar/ocultar la tabla al hacer clic en el botón
terminatedButton.addEventListener('click', () => {
    if (terminatedTableContainer.style.display === 'none') {
        renderTerminatedTable(); // Renderizar la tabla
        terminatedTableContainer.style.display = 'block'; // Mostrar la tabla
    } else {
        terminatedTableContainer.style.display = 'none'; // Ocultar la tabla
    }
});