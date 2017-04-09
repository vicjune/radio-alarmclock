export interface Alarm {
    id: number;
    hour: number;
    minute: number;
    days: number[];
    enabled: boolean;
    loading: boolean;
}
