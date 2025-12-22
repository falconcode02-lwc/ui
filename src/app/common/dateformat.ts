export function arrayToDate(arr: any): any {
    
    if(!arr){
        return null;
    }

    return new Date(
        arr[0],
        arr[1] - 1,
        arr[2],
        arr[3],
        arr[4],
        arr[5]
    );
}