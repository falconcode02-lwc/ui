export interface SchedulerModel {
    id?: number;
    name: string;
    description?: string;
    type: 'cron' | 'interval';
    cronExpression?: string;
    intervalMinutes?: number;
    enabled: boolean;
}
