import { useEffect, useState } from 'react'
import './index.scss'

interface ISidebarMenuItem {
    title: string
    id: string
    subList?: ISidebarMenuItem[]
}

interface ITutorialSidebarProps {
    show: boolean
}

const TutorialSidebar = ({ show }: ITutorialSidebarProps) => {
    const [menuGroups, setMenuGroups] = useState<ISidebarMenuItem[]>([])

    useEffect(() => {
        if (show) {
            const menuList: ISidebarMenuItem[] = []
            const groups = document.querySelectorAll('.tutorial-step-group')
            for (const group of groups) {
                const title = group.querySelector('h3')
                console.log(group.id, title?.textContent)
                const steps = group.querySelectorAll('.tutorial-step-item')
                const subList = []
                for (const step of steps) {
                    const stepTitle = step.querySelector('.tutorial-step__title')
                    console.log(stepTitle?.textContent, step?.id)
                    subList.push({
                        title: stepTitle?.textContent || '',
                        id: step?.id || '',
                    })
                }
                menuList.push({
                    id: group.id,
                    title: title?.textContent || '',
                    subList,
                })
            }
            console.log('menuList', menuList)
            setMenuGroups(menuList)
        }
    }, [show])
    return (
        <nav id="sidebar">
            <ul className="list-unstyled components">
                {menuGroups.map((group) => (
                    <li key={group.id}>
                        <a href={`#${group.id}`}>{group.title}</a>
                        <li className="sidebar-subList">
                            <ul className="list-unstyled" id={group.id}>
                                {group.subList?.map((sub) => (
                                    <li key={sub.id}>
                                        <a href={`#${sub.id}`}>{sub.title}</a>
                                    </li>
                                ))}
                            </ul>
                        </li>
                    </li>
                ))}
            </ul>
        </nav>
    )
}

export default TutorialSidebar
