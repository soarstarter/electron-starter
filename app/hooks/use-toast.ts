import { toast } from '@/app/components/ui/sonner'

export type Toast = typeof toast

export const useToast = (): Toast => toast

export { toast }
