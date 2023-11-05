import React from 'react'

interface IConditionGenerale {
    title: string
    parts: string[]
    index: number
}
const ConditionGenerale: React.FC<IConditionGenerale> = ({
    title,
    parts,
    index,
}) => {
    return (
        <div className="condition-generale">
            <h3>{index}. {title}</h3>
            <ul>
                {parts.map((part: string, indexPart) => (
                    <li key={index + indexPart}>
                        {index}.{(indexPart + 1)} {part}
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default ConditionGenerale
