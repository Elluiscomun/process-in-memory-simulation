class PCB {
    constructor(pid, status, size, arrivalTime, burstTime) {
        this.pid = pid; // Process ID
        this.status = status; // Estado del proceso (e.g., "Created", "Ready", "Executing", "Terminated")
        this.size = size; // Tamaño del proceso
        this.arrivalTime = arrivalTime; // Tiempo de llegada (AT)
        this.realativeArrivalTime = arrivalTime; // Tiempo de llegada relativo (AT)
        this.burstTime = burstTime; // Tiempo de ráfaga (BT)
        this.burstTimeInitial = burstTime; // Tiempo de ráfaga inicial
        this.completionTime = null; // Tiempo de finalización (CT)
        this.turnaroundTime = null; // Tiempo de retorno (TAT)
        this.waitingTime = null; // Tiempo de espera (WT)
        this.segments = []; // Lista de segmentos del proceso
    }

    // Método para calcular el Turnaround Time (TAT)
    calculateTurnaroundTime() {
        if (this.completionTime !== null && this.arrivalTime !== null) {
            this.turnaroundTime = this.completionTime - this.arrivalTime;
        }
    }

    // Método para calcular el Waiting Time (WT)
    calculateWaitingTime() {
        if (this.turnaroundTime !== null && this.burstTimeInitial !== null) {
            this.waitingTime = this.turnaroundTime - (this.burstTimeInitial*window.appSettings.unitTime*1000);
            console.log(this.waitingTime)
            console.log(this.turnaroundTime)
            console.log(this.burstTimeInitial*window.appSettings.unitTime*1000)
        }
    }

    // Método para actualizar el estado del proceso
    updateStatus(newStatus) {
        this.status = newStatus;
    }

    // Método para dividir el proceso en segmentos
    createSegments() {
        const segmentSizes = [Math.floor(this.size * 0.4), Math.floor(this.size * 0.3), Math.ceil(this.size * 0.3)];
        this.segments = segmentSizes.map((size, index) => ({
            segmentId: index + 1,
            size: size,
            frameNumber: null, // Número de marco asignado
            baseAddress: null, // Dirección base del segmento
            limit: size // Límite del segmento
        }));
    }
}

export default PCB;