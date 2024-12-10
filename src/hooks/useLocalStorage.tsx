import { useState, useEffect, useCallback} from "react";
import {isGameResultArray } from "@/lib/GameResult";

export default function useLocalStorage<T>(
    key:string,
    initialValue: T
):[T,(value: T | ((val: T)=> T))=> void]{

    const readValue = ():T =>{
        try{
            const item = localStorage.getItem(key)
            if(item){
                const parsedItem = JSON.parse(item);
                if(isGameResultArray(parsedItem)){
                    return parsedItem as T
                }
            }
            return initialValue
        }catch(error){
            console.warn(`Error reading localStorage key "${key}:`, error)
            return initialValue
        }
    }
    const [storedValue, setStoredValue] = useState<T>(readValue)

    const setValue = useCallback(
        (value: T | ((val: T)=> T)) =>{
            try{
                const valueToStore = value instanceof Function ? value(storedValue) : value;
                if(!isGameResultArray(valueToStore)){
                    throw new Error('Invalid game result format')
                }
                setStoredValue(valueToStore)
                localStorage.setItem(key,JSON.stringify(valueToStore))
            }catch(error){
                console.warn(`Error setting localStorage key "${key}:`, error)
            }
        },
        [storedValue, key]
    )
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if(e.key === key && e.newValue){
                setStoredValue(JSON.parse(e.newValue))
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage',handleStorageChange);
    },[key])
    return [storedValue, setValue]
}
