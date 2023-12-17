import { Injectable } from '@nestjs/common'
import { IArrayModification } from './util.interface'
import { FuturesHoldSide } from 'bitget-api';

@Injectable()
export class UtilService {
    static compareArraysNumber(
        oldArray: number[],
        newArray: number[],
    ): IArrayModification[] {
        const modifications: IArrayModification[] = [];
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
                });
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
}
