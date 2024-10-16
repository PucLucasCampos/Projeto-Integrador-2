export namespace EventHandler {
    /**
     * Tipo Event 
     */
    export type Event = {
        id: number;
        titulo: string;
        descricao: string;
        valorCota: number;
        dataInicio: string;
        dataFim: string;
        data: string;
        status: boolean;
    }

    export async function getAllEvents() {
        
    }
}