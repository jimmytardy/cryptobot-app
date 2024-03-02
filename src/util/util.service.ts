import { Injectable } from '@nestjs/common'
import { FuturesHoldSide } from 'bitget-api'
import { IArrayModification } from './util.interface'
import * as exactMath from 'exact-math'

@Injectable()
export class UtilService {
    static compareArraysNumber(oldArray: number[], newArray: number[]): IArrayModification[] {
        const modifications: IArrayModification[] = []
        if (oldArray.length < newArray.length) {
            for (let i = oldArray.length; i < newArray.length; i++) {
                modifications.push({
                    index: i,
                    newNumber: newArray[i],
                    action: 'add',
                })
            }
        } else if (oldArray.length > newArray.length) {
            for (let i = newArray.length; i < oldArray.length; i++) {
                modifications.push({
                    index: i,
                    oldNumber: oldArray[i],
                    action: 'remove',
                })
            }
        }

        for (let i = 0; i < Math.min(oldArray.length, newArray.length); i++) {
            if (oldArray[i] !== newArray[i]) {
                // L'élément de oldArray a été mis à jour en newArray
                modifications.push({
                    index: i,
                    oldNumber: oldArray[i],
                    newNumber: newArray[i],
                    action: 'update',
                })
            }
        }

        return modifications
    }

    static sortBySide(array: number[], side: FuturesHoldSide): number[] {
        return array.sort((a, b) => {
            if (side === 'long') {
                return a - b
            } else {
                return b - a
            }
        })
    }

    static sortBySideObject<T extends object>(objects: T[], attribute: keyof T, side: FuturesHoldSide): T[] {
        if (objects.length > 0 && typeof objects[0][attribute] !== 'number') {
            throw new Error(`L'attribut ${String(attribute)} doit être de type number.`)
        }
        return objects.sort((a, b) => {
            const valueA = a[attribute] as number;
            const valueB = b[attribute] as number;

            if (side === 'long') {
                return valueA - valueB
            } else {
                return valueB - valueA
            }
        })
    }

    static getPnL(size: number, PE: number, triggerPrice: number, side: FuturesHoldSide): number {
        if (side === 'long') {
            return exactMath.mul(exactMath.sub(triggerPrice, PE), size)
        } else {
            return exactMath.mul(exactMath.sub(PE, triggerPrice), size)
        }
    }

    static async sleep(ms: number) {
        return await new Promise((r) => setTimeout(r, ms))
    }

    static generateReferralCode(length: number = 6) {
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        let code = ''
        for (let i = 0; i < length; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length))
        }
        return code
    }
}
