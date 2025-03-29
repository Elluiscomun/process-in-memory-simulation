class Paging {
    constructor(pbc, frameNumber) {
        this.pbc = pbc; // ID del proceso asociado a esta página
        this.frameNumber = frameNumber; // Número de frame asignado
    }

    // Método para asignar un nuevo frame
    assignFrame(newFrameNumber) {
        this.frameNumber = newFrameNumber;
    }

    // Método para obtener información del frame
    getFrameInfo() {
        return {
            pbc: this.pbc,
            frameNumber: this.frameNumber
        };
    }
}

export default Paging;