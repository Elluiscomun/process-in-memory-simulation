// Selección de elementos
const addProcessButton = document.querySelector('#addProcess');
const mainMemoryTable = document.querySelector('#mainMemoryTable');
const ioSource = document.querySelector('#ioSource');

// Función para generar un tamaño de proceso aleatorio entre 4 y 40
function generateProcessSize() {
    return Math.floor(Math.random() * (40 - 4 + 1)) + 4;
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
    }, 3000);
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

// Función para verificar si ioSource está vacío
function isIoSourceEmpty() {
    return ioSource.children.length === 0;
}

// Función principal para manejar la creación de procesos
async function handleAddProcess() {
    const processSize = generateProcessSize();
    console.log(`Generated process size: ${processSize}`);

    // Intentar encontrar espacio en memoria y verificar ioSource
    for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`Attempt ${attempt}: Scanning memory and I/O source...`);

        // Animar el escaneo de los frames
        await animateScanFrames();

        // Animar el escaneo de ioSource
        await animateScanIoSource();

        // Verificar si ioSource está vacío
        if (isIoSourceEmpty()) {
            showPopup('Process created successfully! Memory and Sources available.', 'success');
            return; // Salir si se encontró espacio
        }
    }

    // Si no se encontró espacio después de 2 intentos
    showPopup('Error: Unable to create process. No memory available.', 'error');
}

// Agregar evento al botón "Add Process"
addProcessButton.addEventListener('click', handleAddProcess);