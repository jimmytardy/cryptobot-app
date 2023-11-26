import { IUser, UserSubscriptionEnum } from '../interfaces/user.interface'

export const isNumber = (value: string | number) => {
    if (typeof value === 'number') return true
    return !Number.isNaN(parseFloat(value))
}

export const isTrader = (user: IUser): boolean => {
    return user.subscription && user.subscription.rights.includes(UserSubscriptionEnum.TRADER);
}

export const getDifferenceDates = (
    date1: Date,
    date2: Date,
): {
    month: number
    days: number
    hours: number
} => {
    // Convertir les dates en objets Date
    date1 = new Date(date1)
    date2 = new Date(date2)

    // Calculer la différence en millisecondes
    const differenceEnMillisecondes = date2.getTime() - date1.getTime()
    // Créer la chaîne de résultat
    return {
        month: Math.floor(
            differenceEnMillisecondes / (30 * 24 * 60 * 60 * 1000),
        ),
        days: Math.floor(
            (differenceEnMillisecondes % (30 * 24 * 60 * 60 * 1000)) /
                (24 * 60 * 60 * 1000),
        ),
        hours: Math.floor(
            (differenceEnMillisecondes % (24 * 60 * 60 * 1000)) /
                (60 * 60 * 1000),
        ),
    }
}

export const formatDateForMonthInput = (date?: Date) => {
    if (date) {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0') // Ajoute un zéro initial si nécessaire
        return `${year}-${month}`
    }
    return undefined
}

export const monthDiff = (dateFrom: Date, dateTo: Date) => {
    return (
        dateTo.getMonth() -
        dateFrom.getMonth() +
        12 * (dateTo.getFullYear() - dateFrom.getFullYear())
    )
}

export const getFormatDateForInput = (date: Date) => {
    console.log(date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate() + 1).padStart(2, '0'))
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate() + 1).padStart(2, '0')
}