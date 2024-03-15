import { Col, Container, Row } from "react-bootstrap"
import { useAuth } from "../../../../../hooks/AuthContext";
import { hasSubAccount } from "../../../../../utils";
import { useEffect, useState } from "react";
import axiosClient from "../../../../../axiosClient";
import BitgetProfile, { IBitgetProfile } from "../../BitgetProfile";
import { ISubAccount } from "../../../SubAccounts/sub-account.interface";
import './index.scss';

interface ISubAccountProfile {
    _id: string
    preferences: ISubAccount['preferences']
    bitget: IBitgetProfile
    numAccount: number
}

const SubAccountProfile = () => {
    const { user } = useAuth()
    const [subAccounts, setSubAccounts] = useState<ISubAccountProfile[]>();
    const [bitgetTotal, setBitgetTotal] = useState<IBitgetProfile>();
    if (!hasSubAccount(user)) return null;

    useEffect(() => {
        (async () => {
            const results = await axiosClient.get<ISubAccountProfile[]>('/user/sub-accounts/profile');

            const bitgetTotal = {
                available: results.data.reduce((acc, subAccount) => acc + subAccount.bitget.available, 0),
                totalPnL: results.data.reduce((acc, subAccount) => acc + subAccount.bitget.totalPnL, 0),
                unrealizedPL: results.data.reduce((acc, subAccount) => acc + subAccount.bitget.unrealizedPL, 0),
            }

            setBitgetTotal(bitgetTotal);
            setSubAccounts(results.data);
        })()
    }, [])

    if (!subAccounts || subAccounts.length === 0) return null;

    return (
        <Row className="sub-account-profile mt-2">
            <Col xs={12} className="p-0">
                <div className="section-title" style={{ border: 'none' }}>Sous-comptes</div>
            </Col>
            {subAccounts.length > 1 && (
                <Col className='sub-account-profile-item sub-account-profile-item-total' xs={6} md={4}>
                    <div className="sub-account-profile-item-title">
                        <b>Total des sous comptes</b>
                    </div>
                    <div className="sub-account-profile-item-body">
                        <BitgetProfile bitgetProfile={bitgetTotal} />
                    </div>
                </Col>
            )}
            {subAccounts?.map((subAccount) => (
                <Col key={subAccount._id} className='sub-account-profile-item' xs={6} md={4}>
                    <div className="sub-account-profile-item-title">
                        <b>#{subAccount.numAccount}: {subAccount.preferences.bot.strategy?.name || 'Stratégie personnalisée'}</b>
                    </div>
                    <div className="sub-account-profile-item-body">
                        <BitgetProfile bitgetProfile={subAccount.bitget} />
                    </div>
                </Col>
            ))}
        </Row>
    )
}

export default SubAccountProfile;