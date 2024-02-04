import { FuturesClient } from 'bitget-api'
import { mockFuturesClient } from './mocks/libs/bitgetApi.mock'

// Dans votre test ou spécification, utilisez le mock à la place de l'objet réel
jest.mock<FuturesClient>('bitget-api', () => mockFuturesClient)
