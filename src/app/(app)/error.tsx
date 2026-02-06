'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex items-center justify-center py-20">
      <Card className="max-w-md w-full border-destructive/30">
        <CardContent className="p-8 text-center space-y-4">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          <h2 className="text-xl font-bold">Что-то пошло не так</h2>
          <p className="text-sm text-muted-foreground">
            {error.message || 'Произошла непредвиденная ошибка'}
          </p>
          <Button onClick={reset} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" /> Попробовать снова
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
