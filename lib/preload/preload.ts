import { contextBridge } from 'electron'
import { conveyor } from '@/lib/conveyor/api'

try {
  contextBridge.exposeInMainWorld('conveyor', conveyor)
} catch (error) {
  console.error(error)
}
