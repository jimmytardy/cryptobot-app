export interface IErrorTraceService<T = string> {
    _id: string;
    userId: T;
    severity: string;
    finish: boolean;
    functionName: string;
    createdAt: Date;
    context: any;
}