window.address_memory_last = 1; // Dirección inicial en hexadecimal
window.pid_count = 1; // Contador de procesos

// Selecciona el contenedor principal donde se agregarán los framees
const memoryTableContainer = document.querySelector('.main-memory-table');

// Función para generar framees de bloques de memoria
function generateMemoryframe(amount) {
    const baseIncrement = 0x1000; // Incremento en hexadecimal para cada bloque

    for (let frameIndex = 0; frameIndex < amount; frameIndex++) {
        // Crea un nuevo contenedor para el frame
        const memoryframe = document.createElement('div');
        memoryframe.classList.add('main-memory-address-frame');

        for (let i = 0; i < window.appSettings.frameSize; i++) {
            // Calcula la dirección hexadecimal basada en address_memory_last
            const address = (window.address_memory_last * baseIncrement).toString(16).toUpperCase();

            // Crea el contenedor principal del bloque
            const memoryBox = document.createElement('div');
            memoryBox.classList.add('main-memory-address-box');

            // Crea el contenedor de la dirección
            const addressBox = document.createElement('div');
            addressBox.classList.add('main-memory-address-box-address');
            const addressText = document.createElement('p');
            addressText.classList.add('main-memory-address-box-title');
            addressText.textContent = `0x${address}`;
            addressBox.appendChild(addressText);

            // Crea el contenedor del proceso (vacío)
            const processBox = document.createElement('div');
            processBox.classList.add('main-memory-address-box-process');
            const processText = document.createElement('p');
            processText.classList.add('main-memory-address-box-title');
            processText.textContent = ''; // Espacio vacío
            processBox.appendChild(processText);

            // Agrega los contenedores al bloque principal
            memoryBox.appendChild(addressBox);
            memoryBox.appendChild(processBox);

            // Agrega el bloque al frame
            memoryframe.appendChild(memoryBox);

            // Actualiza la secuencia global
            window.address_memory_last++;
        }

        // Agrega el nuevo frame al contenedor principal
        memoryTableContainer.appendChild(memoryframe);
    }
}



