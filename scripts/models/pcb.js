class PCB {
    constructor(pid, status, size, burst, arrivalTime, burstTime) {
        this.pid = pid; // Process ID
        this.status = status; // Estado del proceso (e.g., "Created", "Ready", "Executing", "Terminated")
        this.size = size; // Tamaño del proceso
        this.burst = burst; // Número de ráfagas
        this.arrivalTime = arrivalTime; // Tiempo de llegada (AT)
        this.burstTime = burstTime; // Tiempo de ráfaga (BT)
        this.completionTime = null; // Tiempo de finalización (CT)
        this.turnaroundTime = null; // Tiempo de retorno (TAT)
        this.waitingTime = null; // Tiempo de espera (WT)
    }

    // Método para calcular el Turnaround Time (TAT)
    calculateTurnaroundTime() {
        if (this.completionTime !== null && this.arrivalTime !== null) {
            this.turnaroundTime = this.completionTime - this.arrivalTime;
        }
    }

    // Método para calcular el Waiting Time (WT)
    calculateWaitingTime() {
        if (this.turnaroundTime !== null && this.burstTime !== null) {
            this.waitingTime = this.turnaroundTime - this.burstTime;
        }
    }

    // Método para actualizar el estado del proceso
    updateStatus(newStatus) {
        this.status = newStatus;
    }
}

export default PCB;